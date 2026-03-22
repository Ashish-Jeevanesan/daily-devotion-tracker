import { Injectable } from '@angular/core';
import { ACCESS_CODES, AccessCode } from './access-codes';
import { AccessService } from './access.service';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

export interface Profile {
  id: string;
  full_name: string;
  age?: number;
  dob?: string;
  notification_enabled?: boolean;
  notification_timezone?: string | null;
  phone_number?: string;
  church_name?: string;
  report_preference?: 'WEEKLY' | 'MONTHLY';
  username?: string;
  role?: 'admin' | 'member';
}

@Injectable({
  providedIn: 'root'
})
/** Access and update profile records tied to auth users. */
export class ProfileService {

  constructor(
    private accessService: AccessService,
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
      .is('void_fl', null)
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
      .is('void_fl', null)
      .single();

    if (error) {
      console.error('Error upserting profile:', error);
      return null;
    }

    return data;
  }

  /** Fetch all profiles for permission-scoped user filtering. */
  async getAllProfiles(accessCode: AccessCode | string = ACCESS_CODES.ADMIN_REPORTS): Promise<Profile[]> {
    const currentProfile = await this.getProfile();
    const hasScopedAccess = await this.accessService.hasAccess(accessCode);

    let query = this.supabaseService.supabase
      .from('profiles')
      .select('id, full_name, username, role, church_name')
      .is('void_fl', null)
      .order('full_name', { ascending: true });

    if (hasScopedAccess && currentProfile?.church_name?.trim()) {
      query = query.eq('church_name', currentProfile.church_name.trim());
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching profiles:', error);
      return [];
    }

    return data || [];
  }

  /** Fetch distinct church names matching the current input. */
  async getChurchSuggestions(searchTerm = ''): Promise<string[]> {
    let query = this.supabaseService.supabase
      .from('profiles')
      .select('church_name')
      .not('church_name', 'is', null)
      .is('void_fl', null)
      .limit(20);

    const trimmedSearchTerm = searchTerm.trim();
    if (trimmedSearchTerm) {
      query = query.ilike('church_name', `%${trimmedSearchTerm}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching church suggestions:', error);
      return [];
    }

    return [...new Set(
      (data || [])
        .map(profile => profile.church_name?.trim())
        .filter((churchName): churchName is string => !!churchName)
    )].sort((left, right) => left.localeCompare(right));
  }
}
