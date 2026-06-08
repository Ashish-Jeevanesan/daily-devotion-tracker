import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BibleBook } from '../data/bible-books';
import { Observable, from, of } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { catchError, map, shareReplay, switchMap } from 'rxjs/operators';

export interface VersePreview {
  reference: string;
  verses: Array<{ verse: number; text: string }>;
}

@Injectable({
  providedIn: 'root'
})
/** Provides Bible book metadata and chapter lists. */
export class BibleService {
  private booksCache$: Observable<BibleBook[]> | null = null;
  private verseCache = new Map<string, VersePreview>();
  private verseCountCache = new Map<string, number[]>();

  constructor(private supabaseService: SupabaseService, private http: HttpClient) { }

  /** Fetch and cache the list of Bible books from Supabase. */
  getBooks(): Observable<BibleBook[]> {
    if (!this.booksCache$) {
      const promise = this.supabaseService.supabase
        .from('bible_books')
        .select('*')
        .is('void_fl', null)
        .order('id');
      
      this.booksCache$ = from(promise).pipe(
        map(response => {
          if (response.error) {
            console.error('Error fetching bible books:', response.error);
            return [];
          }
          return response.data as BibleBook[];
        }),
        shareReplay(1)
      );
    }
    return this.booksCache$;
  }

  /** Derive chapter numbers for a selected book. */
  getChapters(bookName: string): Observable<number[]> {
    return this.getBooks().pipe(
      map(books => {
        const book = books.find(b => b.name === bookName);
        if (book) {
          return Array.from({ length: book.chapters }, (_, i) => i + 1);
        }
        return [];
      })
    );
  }

  /** Fetch verse numbers for a chapter — DB first, API fallback, async DB write on miss. */
  getChapterVerses(bookName: string, chapter: number): Observable<number[]> {
    const key = `${bookName}:${chapter}`;
    if (this.verseCountCache.has(key)) {
      return of(this.verseCountCache.get(key)!);
    }

    const fallback = Array.from({ length: 176 }, (_, i) => i + 1);

    return this.getBooks().pipe(
      switchMap(books => {
        const book = books.find(b => b.name === bookName);
        if (!book) return of(fallback);

        // L2: Supabase DB
        return from(
          this.supabaseService.supabase
            .from('bible_verse_counts')
            .select('verse_count')
            .eq('book_id', book.id)
            .eq('chapter', chapter)
            .maybeSingle()
        ).pipe(
          switchMap(({ data }) => {
            if (data?.verse_count) {
              const arr = Array.from({ length: data.verse_count }, (_, i) => i + 1);
              this.verseCountCache.set(key, arr);
              return of(arr);
            }

            // L3: external API — return immediately, save to DB in background
            return this.http.get<{ verses: Array<{ verse: number }> }>(
              `https://bible-api.com/${bookName.replace(/\s+/g, '+')}+${chapter}?translation=kjv`
            ).pipe(
              map(res => {
                const arr = Array.from({ length: res.verses.length }, (_, i) => i + 1);
                this.verseCountCache.set(key, arr);
                this.saveVerseCountAsync(book.id, chapter, res.verses.length);
                return arr;
              }),
              catchError(() => of(fallback))
            );
          })
        );
      })
    );
  }

  /** Fire-and-forget: persist a chapter's verse count so future users skip the API call.
   *  Uses ignoreDuplicates so the original audit fields (added_by_*) are never overwritten. */
  private saveVerseCountAsync(bookId: number, chapter: number, verseCount: number): void {
    this.supabaseService.supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      this.supabaseService.supabase
        .from('bible_verse_counts')
        .upsert(
          {
            book_id: bookId,
            chapter,
            verse_count: verseCount,
            added_by_user_id: user.id,
            added_by_username: user.email ?? user.id
          },
          { onConflict: 'book_id,chapter', ignoreDuplicates: true }
        )
        .then(({ error }) => {
          if (error) console.warn('bible_verse_counts save failed:', error.message);
        });
    });
  }

  /** Fetch a verse or short range from bible-api.com (KJV). Results are cached. */
  getVerseText(bookName: string, chapter: number, verseStart: number, verseEnd: number | null): Observable<VersePreview | null> {
    const refPath = verseEnd && verseEnd > verseStart
      ? `${bookName.replace(/\s+/g, '+')}+${chapter}:${verseStart}-${verseEnd}`
      : `${bookName.replace(/\s+/g, '+')}+${chapter}:${verseStart}`;

    if (this.verseCache.has(refPath)) {
      return of(this.verseCache.get(refPath)!);
    }

    return this.http.get<{ reference: string; verses: Array<{ verse: number; text: string }> }>(`https://bible-api.com/${refPath}?translation=kjv`).pipe(
      map(res => {
        const result: VersePreview = {
          reference: res.reference,
          verses: res.verses.map(v => ({ verse: v.verse, text: v.text.trim() }))
        };
        this.verseCache.set(refPath, result);
        return result;
      }),
      catchError(() => of(null))
    );
  }
}
