import { Injectable, signal, Injector } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { User } from '@supabase/supabase-js';
import { Router } from '@angular/router';
import { ProfileService } from './profile.service';

@Injectable({
  providedIn: 'root'
})
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

  signIn(email: string, password: string) {
    return this.supabaseService.supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
  }

  async signOut() {
    const { error } = await this.supabaseService.supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    }
  }

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

  private async checkProfileAndRedirect() {
    if (this.currentUser()) {
      const profileService = this.injector.get(ProfileService);
      const profile = await profileService.getProfile();
      if (!profile || !profile.full_name || !profile.age) {
        if (this.router.url !== '/profile') {
          this.router.navigate(['/profile']);
        }
      } else {
        if (this.router.url !== '/') {
          this.router.navigate(['/']);
        }
      }
    }
  }
}
