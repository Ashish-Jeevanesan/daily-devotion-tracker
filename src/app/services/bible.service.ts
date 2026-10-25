import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BibleBook } from '../data/bible-books';
import { Observable, from, of } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { catchError, map, shareReplay, switchMap } from 'rxjs/operators';
import { resolveBookFolder } from '../data/bible-version-books';

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

  /** Fetch a verse or short range from wldeh/bible-api for the given version. Cached per version+reference. */
  getVerseText(bookName: string, chapter: number, verseStart: number, verseEnd: number | null, versionId: string = 'en-kjv'): Observable<VersePreview | null> {
    const isRange = verseEnd != null && verseEnd > verseStart;
    const reference = isRange ? `${bookName} ${chapter}:${verseStart}-${verseEnd}` : `${bookName} ${chapter}:${verseStart}`;
    const cacheKey = `${versionId}:${reference}`;

    if (this.verseCache.has(cacheKey)) {
      return of(this.verseCache.get(cacheKey)!);
    }

    const folder = resolveBookFolder(bookName, versionId);
    const url = `https://cdn.jsdelivr.net/gh/wldeh/bible-api/bibles/${versionId}/books/${encodeURIComponent(folder)}/chapters/${chapter}.json`;
    const end = isRange ? verseEnd! : verseStart;

    return this.http.get<{ data: Array<{ verse: string; text: string }> }>(url).pipe(
      map(res => {
        const seen = new Set<number>();
        const verses = (res.data || [])
          .map(v => ({ verse: Number(v.verse), text: this.cleanVerseText(v.text) }))
          .filter(v => v.verse >= verseStart && v.verse <= end)
          .filter(v => (seen.has(v.verse) ? false : (seen.add(v.verse), true)));
        if (verses.length === 0) return null;
        const result: VersePreview = { reference, verses };
        this.verseCache.set(cacheKey, result);
        return result;
      }),
      catchError(() => of(null))
    );
  }

  /** Strip wldeh formatting artifacts: leading pilcrow and trailing translator footnotes.
   *  Guarded so real verse text is never truncated (inline footnotes keep their note text). */
  private cleanVerseText(text: string): string {
    let t = (text || '').replace(/^\s*¶\s*/, '').trim();
    const m = t.match(/\s*\d{1,3}[:.]\d{1,3}\s+[\s\S]*$/u);
    if (m && m.index !== undefined && m[0].length < t.length * 0.5) {
      t = t.slice(0, m.index).trim();
    }
    t = t.replace(/\s*\d{1,3}[:.]\d{1,3}\s*/g, ' ');
    return t.replace(/\s{2,}/g, ' ').replace(/\s+([.,;:।])/g, '$1').trim();
  }
}
