import { Injectable } from '@angular/core';
import { BIBLE_BOOK_TRANSLATIONS } from './bible-book-translations';
import { LanguageService } from '../services/language.service';

@Injectable({
  providedIn: 'root'
})
export class BibleTranslationService {

  constructor(private languageService: LanguageService) { }

  getTranslatedBookName(bookName: string): string {
    const lang = this.languageService.getCurrentLang();
    if (lang === 'en') {
      return bookName;
    }
    return BIBLE_BOOK_TRANSLATIONS[bookName]?.[lang] || bookName;
  }
}
