import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface WeeklyDevotionReportRow {
  user_id: string;
  full_name: string | null;
  devotion_days: number;
}

@Injectable({
  providedIn: 'root'
})
/** Data access layer for admin reporting RPCs. */
export class AdminReportsService {
  constructor(private supabaseService: SupabaseService) {}

  /** Fetch weekly (or arbitrary range) devotion report rows from Supabase. */
  async getWeeklyDevotionReport(weekStart: Date, weekEnd: Date): Promise<WeeklyDevotionReportRow[]> {
    const { data, error } = await this.supabaseService.supabase
      .rpc('weekly_devotion_report', {
        week_start: weekStart.toISOString(),
        week_end: weekEnd.toISOString()
      });

    if (error) {
      console.error('Error fetching weekly devotion report:', error);
      throw error;
    }

    return data || [];
  }
}
