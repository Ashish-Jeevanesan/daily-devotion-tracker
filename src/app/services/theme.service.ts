import { Injectable } from '@angular/core';

type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly storageKey = 'theme';

  initTheme() {
    const saved = localStorage.getItem(this.storageKey) as 'light' | 'dark' | null;
    this.setTheme(saved ?? 'light');
  }

  toggleTheme() {
    const isDark = document.body.classList.contains('dark-theme');
    this.setTheme(isDark ? 'light' : 'dark');
  }

  setTheme(theme: 'light' | 'dark') {
    document.body.classList.remove('light-theme', 'dark-theme');
    document.body.classList.add(theme === 'dark' ? 'dark-theme' : 'light-theme');
    localStorage.setItem(this.storageKey, theme);
  }

  isDark(): boolean {
    return document.body.classList.contains('dark-theme');
  }
}
