import { Component, inject, OnInit, signal, effect } from '@angular/core';
import { Router, RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';
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
import { ACCESS_CODES } from './services/access-codes';
import { AccessService } from './services/access.service';
import { Profile, ProfileService } from './services/profile.service';
import { LanguageService } from './services/language.service';
import { TranslateModule } from '@ngx-translate/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, MatToolbarModule, MatIconModule, MatButtonModule, NotificationOutletComponent, MatSlideToggleModule, MatSidenavModule, MatListModule, CommonModule, TranslateModule, MatFormFieldModule, MatSelectModule, MatMenuModule, MatTooltipModule, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
/** Root shell component handling layout, auth UI, and theme toggling. */
export class AppComponent implements OnInit{
  title = 'DevotionTracker';
  currentYear = new Date().getFullYear();
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly accessService = inject(AccessService);
  private readonly profileService = inject(ProfileService);
  currentUser = this.authService.currentUser;
  profile = signal<Profile | null>(null);
  canViewAdminReports = signal(false);

  constructor(
    public readonly themeService: ThemeService,
    public readonly languageService: LanguageService,
    public readonly supabaseService: SupabaseService
  ) {
    effect(() => {
      const user = this.currentUser();
      if (!user) {
        this.profile.set(null);
        this.canViewAdminReports.set(false);
        return;
      }
      this.profileService.getProfile().then(profile => {
        this.profile.set(profile);
        if (profile?.language) {
          this.languageService.setLanguage(profile.language);
        }
      });
      this.accessService.hasAccess(ACCESS_CODES.ADMIN_REPORTS, true).then(hasAccess => {
        this.canViewAdminReports.set(hasAccess);
      });
    });
  }

  /** Initialize theme and keep profile state in sync with auth changes. */
  ngOnInit(): void {
    this.themeService.initTheme();
    this.languageService.initLanguage();
  }
  
  onLanguageChange(lang: string) {
    this.languageService.setLanguage(lang);
    if (this.isLoggedIn()) {
      this.profileService.updateLanguage(lang);
    }
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
