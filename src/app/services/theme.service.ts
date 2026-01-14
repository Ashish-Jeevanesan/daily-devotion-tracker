import { Injectable } from '@angular/core';

type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly storageKey = 'theme';

  initTheme() {
    const savedTheme = localStorage.getItem(this.storageKey) as Theme | null;

    if (savedTheme) {
      this.setTheme(savedTheme);
    } else {
      this.setTheme('light');
    }
  }

  toggleTheme() {
    const isDark = document.body.classList.contains('dark');
    this.setTheme(isDark ? 'light' : 'dark');
  }

  setTheme(theme: Theme) {
    document.body.classList.toggle('dark', theme === 'dark');
    localStorage.setItem(this.storageKey, theme);
  }

  isDark(): boolean {
    return document.body.classList.contains('dark');
  }
}
