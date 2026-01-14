import { Component, computed, inject, OnInit } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from './services/auth.service';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, MatToolbarModule, MatIconModule, MatButtonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit{
  title = 'DevotionTracker';

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  currentUser = this.authService.currentUser;
  isLoggedIn = computed(() => !!this.currentUser());

  constructor(private readonly themeService: ThemeService) {}

  ngOnInit(): void {
    this.themeService.initTheme();
  }
  
  async signOut() {
    await this.authService.signOut();
    this.router.navigate(['/login']);
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }
}
