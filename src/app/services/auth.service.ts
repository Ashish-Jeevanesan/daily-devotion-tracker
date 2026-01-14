import { Injectable, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { User } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  currentUser = signal<User | null | undefined>(undefined);

  constructor(private readonly supabaseService: SupabaseService) {
    this.getSession();
    this.supabaseService.supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        this.currentUser.set(session?.user ?? null);
      }
      if (event === 'SIGNED_OUT') {
        this.currentUser.set(null);
      }
    });
  }

  async signUp(email: string, password: string, fullName: string, age: number) {
    const { data, error } = await this.supabaseService.supabase.auth.signUp({
      email: email,
      password: password,
    });
    if (error) {
      throw new Error(error.message);
    }
    if (data.user) {
      const { error: profileError } = await this.supabaseService.supabase
        .from('profiles')
        .insert([
          { id: data.user.id, full_name: fullName, age: age },
        ]);
      if (profileError) {
        throw new Error(profileError.message);
      }
    }
    return data.user;
  }

  async signIn(email: string, password: string) {
    const { error } = await this.supabaseService.supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
    if (error) {
      throw new Error(error.message);
    }
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
    } else {
      this.currentUser.set(null);
    }
    return data.session;
  }
}
