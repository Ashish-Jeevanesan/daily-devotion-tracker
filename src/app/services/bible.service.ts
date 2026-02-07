import { Injectable } from '@angular/core';
import { BibleBook } from '../data/bible-books';
import { Observable, from } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { map, shareReplay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
/** Provides Bible book metadata and chapter lists. */
export class BibleService {
  private booksCache$: Observable<BibleBook[]> | null = null;

  constructor(private supabaseService: SupabaseService) { }

  /** Fetch and cache the list of Bible books from Supabase. */
  getBooks(): Observable<BibleBook[]> {
    if (!this.booksCache$) {
      const promise = this.supabaseService.supabase
        .from('bible_books')
        .select('*')
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
}
