export const ACCESS_CODES = {
  ADMIN_REPORTS: 'admin_reports',
  CALENDER_ADMIN_VIEW: 'calender_admin_view',
  MAP_USER_ACCESS: 'map_user_access',
  RUN_USER_REPORT_JOB: 'run_user_report_job'
} as const;

export type AccessCode = typeof ACCESS_CODES[keyof typeof ACCESS_CODES];
