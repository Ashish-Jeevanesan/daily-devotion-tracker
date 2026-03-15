import { Injectable, signal, Injector } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { User } from '@supabase/supabase-js';
import { Router } from '@angular/router';
import { ProfileService } from './profile.service';

@Injectable({
  providedIn: 'root'
})
/** Supabase auth wrapper with session tracking and profile gating. */
export class AuthService {
  currentUser = signal<User | null | undefined>(undefined);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly router: Router,
    private readonly injector: Injector
  ) {
    this.getSession();
    this.supabaseService.supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        this.currentUser.set(session?.user ?? null);
        this.checkProfileAndRedirect();
      }
      if (event === 'SIGNED_OUT') {
        this.currentUser.set(null);
      }
    });
  }

  /** Register a new user with email/password. */
  async signUp(email: string, password: string) {
    const { data, error } = await this.supabaseService.supabase.auth.signUp({
      email: email,
      password: password,
    });
    if (error) {
      throw new Error(error.message);
    }
    return data.user;
  }

  /** Send a password reset email. */
  async resetPassword(email: string) {
    const { error } = await this.supabaseService.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/update-password', // We need to create this route
    });
    if (error) {
      throw new Error(error.message);
    }
  }

  /** Update the current user's password. */
  async updatePassword(password: string) {
    const { error } = await this.supabaseService.supabase.auth.updateUser({
      password: password
    });
    if (error) {
      throw new Error(error.message);
    }
  }

  /** Sign in with email/password. */
  signIn(email: string, password: string) {
    return this.supabaseService.supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
  }

  /** Sign out the current user. */
  async signOut() {
    const { error } = await this.supabaseService.supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    }
  }

  /** Hydrate session and keep current user signal in sync. */
  async getSession() {
    const { data } = await this.supabaseService.supabase.auth.getSession();
    if (data.session) {
      this.currentUser.set(data.session.user);
      this.checkProfileAndRedirect();
    } else {
      this.currentUser.set(null);
    }
    return data.session;
  }

  /** Enforce profile completion before accessing the app. */
  private async checkProfileAndRedirect() {
    if (this.currentUser()) {
      const profileService = this.injector.get(ProfileService);
      const profile = await profileService.getProfile();
      if (!profile || !profile.full_name || !profile.age) {
        if (this.router.url !== '/profile') {
          this.router.navigate(['/profile']);
        }
      } else {
        if (this.router.url === '/login' || this.router.url === '/profile') {
          this.router.navigate(['/']);
        }
      }
    }
  }
}
