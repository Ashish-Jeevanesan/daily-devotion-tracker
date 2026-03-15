export interface WeeklyDevotionReportRow {
  user_id: string;
  full_name: string | null;
  devotion_days: number;
}

export interface UserDevotionNote {
  id: string;
  created_at: string;
  notes: string | null;
}
