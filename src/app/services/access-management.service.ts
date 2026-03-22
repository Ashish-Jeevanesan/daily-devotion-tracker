import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { AccessRule } from './access.service';
import { SupabaseService } from './supabase.service';

interface AccessRuleMappingRow {
  id: string;
  access_rule_id: string;
  access_rule: AccessRule | AccessRule[] | null;
}

@Injectable({
  providedIn: 'root'
})
/** Reads and updates profile access mappings for authorized administrators. */
export class AccessManagementService {
  constructor(
    private readonly authService: AuthService,
    private readonly supabaseService: SupabaseService
  ) {}

  /** Return all active access rules that can be assigned to users. */
  async getAvailableAccessRules(): Promise<AccessRule[]> {
    const { data, error } = await this.supabaseService.supabase
      .from('access_rules')
      .select('id, code, name, description, is_active')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching access rules:', error);
      return [];
    }

    return data || [];
  }

  /** Return active access-rule mappings for a target user. */
  async getUserAccessMappings(profileId: string): Promise<AccessRuleMappingRow[]> {
    if (!profileId) return [];

    const { data, error } = await this.supabaseService.supabase
      .from('profile_access_rules')
      .select(`
        id,
        access_rule_id,
        access_rule:access_rules (
          id,
          code,
          name,
          description,
          is_active
        )
      `)
      .eq('profile_id', profileId)
      .is('void_fl', null);

    if (error) {
      console.error('Error fetching user access mappings:', error);
      return [];
    }

    return (data || []) as AccessRuleMappingRow[];
  }

  /** Return active access codes for a target user. */
  async getUserAccessCodes(profileId: string): Promise<string[]> {
    const mappings = await this.getUserAccessMappings(profileId);

    return mappings
      .flatMap(mapping => {
        if (!mapping.access_rule) return [];
        return Array.isArray(mapping.access_rule) ? mapping.access_rule : [mapping.access_rule];
      })
      .filter(rule => rule.is_active !== false)
      .map(rule => rule.code);
  }

  /** Grant an access rule to a target user, reactivating a voided mapping if needed. */
  async grantAccess(profileId: string, accessRuleId: string): Promise<void> {
    const currentUserId = this.authService.currentUser()?.id;
    if (!profileId || !accessRuleId || !currentUserId) {
      throw new Error('Missing access-mapping context.');
    }

    const { data: existingMapping, error: existingError } = await this.supabaseService.supabase
      .from('profile_access_rules')
      .select('id, void_fl')
      .eq('profile_id', profileId)
      .eq('access_rule_id', accessRuleId)
      .limit(1)
      .maybeSingle();

    if (existingError) {
      throw new Error(existingError.message || 'Unable to inspect current access mapping.');
    }

    if (existingMapping) {
      const { error: updateError } = await this.supabaseService.supabase
        .from('profile_access_rules')
        .update({
          void_fl: null,
          granted_by: currentUserId,
          granted_at: new Date().toISOString()
        })
        .eq('id', existingMapping.id);

      if (updateError) {
        throw new Error(updateError.message || 'Unable to grant access.');
      }

      return;
    }

    const { error: insertError } = await this.supabaseService.supabase
      .from('profile_access_rules')
      .insert({
        profile_id: profileId,
        access_rule_id: accessRuleId,
        granted_by: currentUserId
      });

    if (insertError) {
      throw new Error(insertError.message || 'Unable to grant access.');
    }
  }

  /** Revoke an access rule from a target user by voiding the mapping. */
  async revokeAccess(profileId: string, accessRuleId: string): Promise<void> {
    if (!profileId || !accessRuleId) {
      throw new Error('Missing access-mapping context.');
    }

    const { error } = await this.supabaseService.supabase
      .from('profile_access_rules')
      .update({ void_fl: new Date().toISOString() })
      .eq('profile_id', profileId)
      .eq('access_rule_id', accessRuleId)
      .is('void_fl', null);

    if (error) {
      throw new Error(error.message || 'Unable to revoke access.');
    }
  }
}
