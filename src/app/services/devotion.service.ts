import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

export interface Devotion {
  id: string;
  created_at: string;
  notes: string;
}

@Injectable({
  providedIn: 'root'
})
export class DevotionService {

  constructor(
    private supabaseService: SupabaseService,
    private authService: AuthService
  ) { }

  async getTodaysDevotion(): Promise<Devotion | null> {
    const user = this.authService.currentUser();
    if (!user) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data, error } = await this.supabaseService.supabase
      .from('devotions')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString())
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116: "exact one row expected, but 0 rows found"
      console.error('Error fetching today\'s devotion:', error);
      return null;
    }

    return data;
  }

  async getEarlierDevotions(): Promise<Devotion[]> {
    const user = this.authService.currentUser();
    if (!user) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await this.supabaseService.supabase
      .from('devotions')
      .select('*')
      .eq('user_id', user.id)
      .lt('created_at', today.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching earlier devotions:', error);
      return [];
    }

    return data || [];
  }

  async addDevotion(notes: string): Promise<Devotion | null> {
    const user = this.authService.currentUser();
    if (!user) return null;

    const { data, error } = await this.supabaseService.supabase
      .from('devotions')
      .insert([{ user_id: user.id, notes }])
      .select()
      .single();

    if (error) {
      console.error('Error adding devotion:', error);
      return null;
    }

    return data;
  }

  async updateDevotion(id: string, notes: string): Promise<Devotion | null> {
    const { data, error } = await this.supabaseService.supabase
      .from('devotions')
      .update({ notes })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating devotion:', error);
      return null;
    }

    return data;
  }

  async getDevotions(): Promise<Devotion[]> {
    const user = this.authService.currentUser();
    if (!user) return [];

    const { data, error } = await this.supabaseService.supabase
      .from('devotions')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching devotions:', error);
      return [];
    }

    return data || [];
  }
}
