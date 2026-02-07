import { Component, inject, OnInit, signal, effect } from '@angular/core';
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
import { Profile, ProfileService } from './services/profile.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, MatToolbarModule, MatIconModule, MatButtonModule, NotificationOutletComponent, MatSlideToggleModule, MatSidenavModule, MatListModule, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
/** Root shell component handling layout, auth UI, and theme toggling. */
export class AppComponent implements OnInit{
  title = 'DevotionTracker';
  currentYear = new Date().getFullYear();
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly profileService = inject(ProfileService);
  currentUser = this.authService.currentUser;
  profile = signal<Profile | null>(null);

  constructor(
    public readonly themeService: ThemeService,
    public readonly supabaseService: SupabaseService
  ) {
    effect(() => {
      const user = this.currentUser();
      if (!user) {
        this.profile.set(null);
        return;
      }
      this.profileService.getProfile().then(profile => {
        this.profile.set(profile);
      });
    });
  }

  /** Initialize theme and keep profile state in sync with auth changes. */
  ngOnInit(): void {
    this.themeService.initTheme();
  }
  
  /** Sign out the user and redirect to login. */
  async signOut() {
    await this.authService.signOut();
    this.router.navigate(['/login']);
  }
  /** Expose auth state for template rendering. */
  isLoggedIn():boolean{
    return this.supabaseService.isLoggedIn();
  }
}
