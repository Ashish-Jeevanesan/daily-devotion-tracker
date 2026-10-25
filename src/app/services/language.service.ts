import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Title } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private readonly storageKey = 'language';
  readonly supportedLangs = ['en', 'hi', 'or', 'ta'];
  readonly nativeLangLabels: { [key: string]: string } = {
    en: 'English',
    hi: 'हिन्दी',
    or: 'ଓଡ଼ିଆ',
    ta: 'தமிழ்'
  };

  constructor(private translate: TranslateService, private titleService: Title) {
    this.translate.onLangChange.subscribe(() => {
      this.titleService.setTitle(this.translate.instant('app.title'));
    });
  }

  initLanguage() {
    this.translate.setDefaultLang('en');
    const savedLang = localStorage.getItem(this.storageKey);
    const lang = savedLang && this.supportedLangs.includes(savedLang) ? savedLang : 'en';
    this.setLanguage(lang);
  }

  setLanguage(lang: string) {
    if (this.supportedLangs.includes(lang)) {
      this.translate.use(lang);
      document.documentElement.lang = lang;
      localStorage.setItem(this.storageKey, lang);
    }
  }

  getCurrentLang(): string {
    return this.translate.currentLang || 'en';
  }
}
