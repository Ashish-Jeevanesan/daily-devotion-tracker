import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';
import { AccessCode } from './access-codes';

export interface AccessRule {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  is_active?: boolean;
}

interface ProfileAccessRuleRow {
  access_rule: AccessRule | AccessRule[] | null;
}

@Injectable({
  providedIn: 'root'
})
/** Loads and evaluates feature access for the current authenticated user. */
export class AccessService {
  private cachedUserId: string | null = null;
  private cachedRules: AccessRule[] | null = null;

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly authService: AuthService
  ) {}

  /** Return the current user's active access rules. */
  async getMyAccessRules(forceRefresh = false): Promise<AccessRule[]> {
    const user = this.authService.currentUser();
    if (!user) {
      this.cachedUserId = null;
      this.cachedRules = [];
      return [];
    }

    if (!forceRefresh && this.cachedUserId === user.id && this.cachedRules) {
      return this.cachedRules;
    }

    const { data, error } = await this.supabaseService.supabase
      .from('profile_access_rules')
      .select(`
        access_rule:access_rules (
          id,
          code,
          name,
          description,
          is_active
        )
      `)
      .eq('profile_id', user.id)
      .is('void_fl', null);

    if (error) {
      console.error('Error fetching access rules:', error);
      this.cachedUserId = user.id;
      this.cachedRules = [];
      return [];
    }

    const rules = (data || [])
      .flatMap(row => this.normalizeAccessRuleRow(row as ProfileAccessRuleRow))
      .filter(rule => rule.is_active !== false);

    this.cachedUserId = user.id;
    this.cachedRules = rules;
    return rules;
  }

  /** Check whether the current user has a specific access code. */
  async hasAccess(code: AccessCode | string, forceRefresh = false): Promise<boolean> {
    const rules = await this.getMyAccessRules(forceRefresh);
    return rules.some(rule => rule.code === code);
  }

  /** Clear any cached access rules for the current session. */
  clearCache() {
    this.cachedUserId = null;
    this.cachedRules = null;
  }

  private normalizeAccessRuleRow(row: ProfileAccessRuleRow): AccessRule[] {
    if (!row.access_rule) {
      return [];
    }

    return Array.isArray(row.access_rule) ? row.access_rule : [row.access_rule];
  }
}
