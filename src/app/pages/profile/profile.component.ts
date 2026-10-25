import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { ProfileService } from '../../services/profile.service';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ACCESS_CODES } from '../../services/access-codes';
import { AccessRule, AccessService } from '../../services/access.service';
import { AccessManagementService } from '../../services/access-management.service';
import { NotificationService } from '../../services/notification.service';
import { Profile } from '../../services/profile.service';
import { UserReportJobResponse, UserReportJobService } from '../../services/user-report-job.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../services/language.service';

type ProfileSection = 'profile' | 'report-job' | 'manage-access';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatSelectModule,
    TranslateModule
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
/** Profile form for collecting user details after sign-in. */
export class ProfileComponent implements OnInit {
  readonly sections: { id: ProfileSection; label: string; icon: string }[] = [
    { id: 'profile', label: 'profile.title', icon: 'account_circle' },
    { id: 'report-job', label: 'profile.runReportJob', icon: 'play_circle' },
    { id: 'manage-access', label: 'profile.manageAccess', icon: 'admin_panel_settings' }
  ];
  readonly jobStatusMessages = [
    'profile.jobPreparing',
    'profile.jobFetching',
    'profile.jobSending',
    'profile.jobFinalizing'
  ];
  readonly reportPreferences: Array<'WEEKLY' | 'MONTHLY'> = ['WEEKLY', 'MONTHLY'];

  profileForm: FormGroup;
  churchSuggestions: string[] = [];
  availableAccessRules: AccessRule[] = [];
  canMapUserAccess = false;
  currentProfile: Profile | null = null;
  loading = false;
  activeSection: ProfileSection = 'profile';
  canRunUserReportJob = false;
  jobRunning = false;
  jobRunningMessage = this.jobStatusMessages[0];
  isMobileView = false;
  mobileSectionMenuVisible = true;
  mappingBusy = false;
  mappingLoading = false;
  selectedMappingUserId: string | null = null;
  mappingProfiles: Profile[] = [];
  mappedAccessCodes = new Set<string>();
  private churchLookupRequestId = 0;
  private jobStatusIntervalId: ReturnType<typeof setInterval> | null = null;

  constructor(
    private accessManagementService: AccessManagementService,
    private fb: FormBuilder,
    private accessService: AccessService,
    private notificationService: NotificationService,
    private profileService: ProfileService,
    private router: Router,
    private userReportJobService: UserReportJobService,
    private translate: TranslateService,
    public languageService: LanguageService
  ) {
    this.profileForm = this.fb.group({
      full_name: ['', Validators.required],
      age: [null, [Validators.required, Validators.min(1)]],
      dob: [null, Validators.required],
      phone_number: ['', Validators.required],
      church_name: ['', Validators.required],
      report_preference: ['MONTHLY', Validators.required],
      username: [''],
      language: ['en']
    });

    this.profileForm.get('dob')?.valueChanges.subscribe(value => {
      this.profileForm.patchValue(
        { age: this.calculateAge(value) },
        { emitEvent: false }
      );
    });

    this.profileForm.get('church_name')?.valueChanges.subscribe(value => {
      this.loadChurchSuggestions(typeof value === 'string' ? value : '');
    });
  }

  onLanguageChange(lang: string) {
    this.languageService.setLanguage(lang);
    this.profileService.updateLanguage(lang);
    this.profileForm.patchValue({ language: lang });
  }

  /** Load existing profile data into the form. */
  ngOnInit() {
    this.syncMobileView();
    this.loading = true;
    Promise.all([
      this.profileService.getProfile(),
      this.accessService.hasAccess(ACCESS_CODES.RUN_USER_REPORT_JOB),
      this.accessService.hasAccess(ACCESS_CODES.MAP_USER_ACCESS)
    ]).then(([profile, canRunUserReportJob, canMapUserAccess]) => {
      this.currentProfile = profile;
      this.canRunUserReportJob = canRunUserReportJob;
      this.canMapUserAccess = canMapUserAccess && profile?.role === 'admin';
      if (profile) {
        this.profileForm.patchValue({
          ...profile,
          dob: profile.dob ? new Date(profile.dob) : null,
          age: profile.dob ? this.calculateAge(profile.dob) : profile.age
        });
      }

      if (this.canMapUserAccess) {
        void this.loadAccessManagementData();
      }
    }).finally(() => {
      this.loading = false;
    });
  }

  /** Save profile changes and return to home. */
  async updateProfile() {
    if (this.profileForm.valid) {
      this.loading = true;
      try {
        const formValue = this.profileForm.getRawValue();
        await this.profileService.upsertProfile({
          ...formValue,
          age: this.calculateAge(formValue.dob),
          dob: this.formatDateForStorage(formValue.dob)
        });
        this.router.navigate(['/']);
      } catch (error) {
        console.error('Error updating profile', error);
      } finally {
        this.loading = false;
      }
    }
  }

  setActiveSection(section: ProfileSection) {
    if (section === 'report-job' && !this.canRunUserReportJob) {
      this.activeSection = 'profile';
      return;
    }

    if (section === 'manage-access' && !this.canMapUserAccess) {
      this.activeSection = 'profile';
      return;
    }

    this.activeSection = section;
    if (this.isMobileView) {
      this.mobileSectionMenuVisible = false;
    }
  }

  showMobileSectionMenu() {
    if (!this.isMobileView) {
      return;
    }

    this.mobileSectionMenuVisible = true;
  }

  async runUserReportJob() {
    if (this.jobRunning || !this.canRunUserReportJob) {
      return;
    }

    this.jobRunning = true;
    this.startJobStatusAnimation();

    const monthlyRange = this.getCurrentMonthRange();

    try {
      const result = await this.userReportJobService.runUserReportJob({
        range: 'monthly',
        rangeStart: monthlyRange.start.toISOString(),
        rangeEnd: monthlyRange.end.toISOString(),
        selectedUserId: null
      });

      this.notificationService.show(this.getJobPopupMessage(result), result.ok === false ? 'error' : 'success');
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : this.translate.instant('profile.runReportJobError');

      this.notificationService.show(message, 'error');
    } finally {
      this.stopJobStatusAnimation();
      this.jobRunning = false;
    }
  }

  async loadChurchSuggestions(searchTerm = '') {
    const requestId = ++this.churchLookupRequestId;
    const suggestions = await this.profileService.getChurchSuggestions(searchTerm);

    if (requestId !== this.churchLookupRequestId) {
      return;
    }

    const currentValue = (this.profileForm.get('church_name')?.value ?? '').toString().trim().toLowerCase();
    this.churchSuggestions = suggestions.filter(churchName =>
      churchName.toLowerCase() !== currentValue
    );
  }

  async onMappingUserChange(profileId: string | null) {
    this.selectedMappingUserId = profileId;
    await this.loadSelectedUserMappings();
  }

  hasMappedAccess(code: string) {
    return this.mappedAccessCodes.has(code);
  }

  async toggleMappedAccess(rule: AccessRule) {
    if (!this.selectedMappingUserId || this.mappingBusy) {
      return;
    }

    this.mappingBusy = true;

    try {
      if (this.hasMappedAccess(rule.code)) {
        await this.accessManagementService.revokeAccess(this.selectedMappingUserId, rule.id);
        this.notificationService.show(this.translate.instant('profile.revokeAccessSuccess', { ruleName: rule.name }), 'success');
      } else {
        await this.accessManagementService.grantAccess(this.selectedMappingUserId, rule.id);
        this.notificationService.show(this.translate.instant('profile.grantAccessSuccess', { ruleName: rule.name }), 'success');
      }

      await this.loadSelectedUserMappings();
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : this.translate.instant('profile.updateAccessError');
      this.notificationService.show(message, 'error');
    } finally {
      this.mappingBusy = false;
    }
  }

  private startJobStatusAnimation() {
    this.stopJobStatusAnimation();
    let currentIndex = 0;
    this.jobRunningMessage = this.jobStatusMessages[currentIndex];

    this.jobStatusIntervalId = setInterval(() => {
      currentIndex = (currentIndex + 1) % this.jobStatusMessages.length;
      this.jobRunningMessage = this.jobStatusMessages[currentIndex];
    }, 1800);
  }

  private stopJobStatusAnimation() {
    if (this.jobStatusIntervalId) {
      clearInterval(this.jobStatusIntervalId);
      this.jobStatusIntervalId = null;
    }

    this.jobRunningMessage = this.jobStatusMessages[0];
  }

  private getCurrentMonthRange() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    start.setHours(0, 0, 0, 0);

    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    end.setHours(0, 0, 0, 0);

    return { start, end };
  }

  private async loadAccessManagementData() {
    this.mappingLoading = true;

    try {
      const [profiles, rules] = await Promise.all([
        this.profileService.getAllProfiles(ACCESS_CODES.MAP_USER_ACCESS),
        this.accessManagementService.getAvailableAccessRules()
      ]);

      this.mappingProfiles = profiles;
      this.availableAccessRules = rules;
    } finally {
      this.mappingLoading = false;
    }
  }

  private async loadSelectedUserMappings() {
    if (!this.selectedMappingUserId) {
      this.mappedAccessCodes = new Set<string>();
      return;
    }

    this.mappingLoading = true;

    try {
      const codes = await this.accessManagementService.getUserAccessCodes(this.selectedMappingUserId);
      this.mappedAccessCodes = new Set(codes);
    } finally {
      this.mappingLoading = false;
    }
  }

  private getJobPopupMessage(result: UserReportJobResponse) {
    if (result.message?.trim()) {
      return result.message;
    }

    const summary = result.summary;
    if (!summary) {
      return result.ok === false
        ? this.translate.instant('profile.jobError')
        : this.translate.instant('profile.jobSuccess');
    }

    return [
      result.ok === false ? this.translate.instant('profile.jobFinishedWithErrors') : this.translate.instant('profile.jobSuccess'),
      `${this.translate.instant('profile.totalUsers')}: ${summary.totalUsers ?? 0}`,
      `${this.translate.instant('profile.processedUsers')}: ${summary.processedUsers ?? 0}`,
      `${this.translate.instant('profile.sentCount')}: ${summary.sentCount ?? 0}`,
      `${this.translate.instant('profile.skippedCount')}: ${summary.skippedCount ?? 0}`,
      `${this.translate.instant('profile.errorCount')}: ${summary.errorCount ?? 0}`
    ].join('\n');
  }

  private calculateAge(value: string | Date | null): number | null {
    if (!value) return null;

    const dob = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(dob.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age -= 1;
    }

    return age >= 0 ? age : null;
  }

  private formatDateForStorage(value: string | Date | null): string | null {
    if (!value) return null;

    const dob = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(dob.getTime())) return null;

    const year = dob.getFullYear();
    const month = String(dob.getMonth() + 1).padStart(2, '0');
    const day = String(dob.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  @HostListener('window:resize')
  private syncMobileView() {
    const nextIsMobileView = window.innerWidth <= 768;
    const breakpointChanged = nextIsMobileView !== this.isMobileView;

    this.isMobileView = nextIsMobileView;

    if (!breakpointChanged) {
      return;
    }

    this.mobileSectionMenuVisible = nextIsMobileView;
  }
}
