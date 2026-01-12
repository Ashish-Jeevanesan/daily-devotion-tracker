import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

export interface CheckIn {
  id?: string;
  user_id?: string;
  date: string;
  prayed: boolean;
  read_bible: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CheckInService {

  constructor(
    private supabaseService: SupabaseService,
    private authService: AuthService
  ) { }

  async getTodaysCheckIn(): Promise<CheckIn | null> {
    const user = this.authService.currentUser();
    if (!user) return null;

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const { data, error } = await this.supabaseService.supabase
      .from('daily_check_ins')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching today\'s check-in:', error);
      return null;
    }

    return data;
  }

  async upsertCheckIn(checkInData: Partial<CheckIn>): Promise<CheckIn | null> {
    const user = this.authService.currentUser();
    if (!user) return null;

    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await this.supabaseService.supabase
      .from('daily_check_ins')
      .upsert({ ...checkInData, user_id: user.id, date: today }, {
        onConflict: 'user_id,date'
      })
      .select()
      .single();

    if (error) {
      console.error('Error upserting check-in:', error);
      return null;
    }

    return data;
  }
}
