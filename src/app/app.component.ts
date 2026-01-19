import { Component, computed, inject, OnInit } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from './services/auth.service';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { NotificationOutletComponent } from './components/notification-outlet/notification-outlet.component';
import { ThemeService } from './services/theme.service';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { SupabaseService } from './services/supabase.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, MatToolbarModule, MatIconModule, MatButtonModule, NotificationOutletComponent, MatSlideToggleModule, MatSidenavModule, MatListModule, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit{
  title = 'DevotionTracker';
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  currentUser = this.authService.currentUser;

  constructor(public readonly themeService: ThemeService,
    public readonly supabaseService: SupabaseService
  ) {}

  ngOnInit(): void {
    this.themeService.initTheme();
  }
  
  async signOut() {
    await this.authService.signOut();
    this.router.navigate(['/login']);
  }
  isLoggedIn():boolean{
    return this.supabaseService.isLoggedIn();
  }
}
