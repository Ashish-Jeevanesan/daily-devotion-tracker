import { Injectable } from '@angular/core';
import { ACCESS_CODES } from './access-codes';
import { AccessService } from './access.service';
import { SupabaseService } from './supabase.service';

export interface UserReportJobPayload {
  range: 'daily' | 'weekly' | 'monthly';
  rangeStart: string;
  rangeEnd: string;
  selectedUserId?: string | null;
}

export interface UserReportJobResponse {
  ok?: boolean;
  summary?: {
    totalUsers?: number;
    processedUsers?: number;
    sentCount?: number;
    skippedCount?: number;
    errorCount?: number;
  };
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
/** Invokes the Supabase edge function responsible for the user report job. */
export class UserReportJobService {
  constructor(
    private readonly accessService: AccessService,
    private readonly supabaseService: SupabaseService
  ) {}

  /** Run the report job after confirming the current user has access. */
  async runUserReportJob(payload: UserReportJobPayload): Promise<UserReportJobResponse> {
    console.log('[UserReportJob] invoke requested', {
      functionName: 'monthlt-report-api',
      payload
    });

    const hasAccess = await this.accessService.hasAccess(ACCESS_CODES.RUN_USER_REPORT_JOB);
    console.log('[UserReportJob] access check result', {
      requiredAccess: ACCESS_CODES.RUN_USER_REPORT_JOB,
      hasAccess
    });

    if (!hasAccess) {
      throw new Error('You do not have access to run this report job.');
    }

    const { data: sessionData, error: sessionError } = await this.supabaseService.supabase.auth.getSession();
    console.log('[UserReportJob] session lookup', {
      hasSession: !!sessionData.session,
      userId: sessionData.session?.user?.id ?? null,
      supabaseUrl: this.supabaseService.supabaseUrl,
      accessTokenPreview: sessionData.session?.access_token
        ? `${sessionData.session.access_token.slice(0, 16)}...`
        : null
    });

    if (sessionError) {
      console.error('[UserReportJob] session lookup failed', sessionError);
      throw new Error('Unable to verify your session. Please sign in again.');
    }

    if (!sessionData.session?.access_token) {
      throw new Error('Your session has expired. Please sign in again.');
    }

    const { data: refreshedSessionData, error: refreshError } =
      await this.supabaseService.supabase.auth.refreshSession();

    console.log('[UserReportJob] session refresh result', {
      refreshed: !!refreshedSessionData.session,
      userId: refreshedSessionData.session?.user?.id ?? null,
      accessTokenPreview: refreshedSessionData.session?.access_token
        ? `${refreshedSessionData.session.access_token.slice(0, 16)}...`
        : null
    });

    if (refreshError) {
      console.error('[UserReportJob] session refresh failed', refreshError);
      throw new Error('Unable to refresh your session. Please sign in again.');
    }

    if (!refreshedSessionData.session?.access_token) {
      throw new Error('Your session has expired. Please sign in again.');
    }

    const accessToken = refreshedSessionData.session.access_token;

    console.log('Invoking user report job with payload:', payload);
    const { data, error } = await this.supabaseService.supabase.functions.invoke(
      'monthlt-report-api',
      {
        body: payload,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          apikey: this.supabaseService.supabaseKey,
        }
      }
    );

    console.log('[UserReportJob] invoke response', {
      data,
      error
    });

    if (error) {
      if (error.message?.toLowerCase().includes('invalid jwt')) {
        throw new Error('Your session is no longer valid. Please sign in again.');
      }
      throw new Error(error.message || 'Failed to start the user report job.');
    }

    return (data || {}) as UserReportJobResponse;
  }
}
