import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from './services/auth.service';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, MatToolbarModule, MatIconModule, MatButtonModule, AsyncPipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'DevotionTracker';

  private authService = inject(AuthService);
  private router = inject(Router);
  currentUser = this.authService.currentUser;
  isLoggedIn = computed(() => !!this.currentUser());

  constructor() {}

  async signOut() {
    await this.authService.signOut();
    this.router.navigate(['/login']);
  }
}
