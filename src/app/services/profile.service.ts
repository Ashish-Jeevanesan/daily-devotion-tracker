import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

export interface Profile {
  id: string;
  full_name: string;
  age?: number;
  username?: string;
  role?: 'admin' | 'member';
}

@Injectable({
  providedIn: 'root'
})
/** Access and update profile records tied to auth users. */
export class ProfileService {

  constructor(
    private supabaseService: SupabaseService,
    private authService: AuthService
  ) { }

  /** Fetch the current user's profile. */
  async getProfile(): Promise<Profile | null> {
    const user = this.authService.currentUser();
    if (!user) return null;

    const { data, error } = await this.supabaseService.supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching profile:', error);
      return null;
    }
    return data;
  }

  /** Create or update the current user's profile. */
  async upsertProfile(profile: Partial<Profile>): Promise<Profile | null> {
    const user = this.authService.currentUser();
    if (!user) return null;

    const { data, error } = await this.supabaseService.supabase
      .from('profiles')
      .upsert({ ...profile, id: user.id })
      .select()
      .single();

    if (error) {
      console.error('Error upserting profile:', error);
      return null;
    }

    return data;
  }

  /** Fetch all profiles for admin filtering. */
  async getAllProfiles(): Promise<Profile[]> {
    const { data, error } = await this.supabaseService.supabase
      .from('profiles')
      .select('id, full_name, username, role')
      .order('full_name', { ascending: true });

    if (error) {
      console.error('Error fetching profiles:', error);
      return [];
    }

    return data || [];
  }
}
