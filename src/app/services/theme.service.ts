import { Injectable } from '@angular/core';

type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
/** Controls light/dark theme state and persistence. */
export class ThemeService {
  private readonly storageKey = 'theme';

  /** Initialize theme from local storage. */
  initTheme() {
    const saved = localStorage.getItem(this.storageKey) as 'light' | 'dark' | null;
    this.setTheme(saved ?? 'light');
  }

  /** Toggle between light and dark themes. */
  toggleTheme() {
    const isDark = document.body.classList.contains('dark-theme');
    this.setTheme(isDark ? 'light' : 'dark');
  }

  /** Apply the specified theme and persist it. */
  setTheme(theme: 'light' | 'dark') {
    document.body.classList.remove('light-theme', 'dark-theme');
    document.body.classList.add(theme === 'dark' ? 'dark-theme' : 'light-theme');
    localStorage.setItem(this.storageKey, theme);
  }

  /** Check whether dark theme is active. */
  isDark(): boolean {
    return document.body.classList.contains('dark-theme');
  }
}
