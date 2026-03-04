import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarModule, CalendarMonthViewDay } from 'angular-calendar';
import { CheckIn, CheckInService } from '../../services/check-in.service';
import { Devotion, DevotionService } from '../../services/devotion.service';
import { addMonths, startOfDay } from 'date-fns';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DevotionDetailDialogComponent } from '../../components/devotion-detail-dialog/devotion-detail-dialog.component';
import { Subject } from 'rxjs';
import { Profile, ProfileService } from '../../services/profile.service';
import { AuthService } from '../../services/auth.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [
    CommonModule,
    CalendarModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './progress.component.html',
  styleUrls: ['./progress.component.scss']
})
/** Calendar view showing historical devotions and check-ins. */
export class ProgressComponent implements OnInit {
  viewDate: Date = new Date();
  devotions: Devotion[] = [];
  checkIns: CheckIn[] = [];
  refresh: Subject<void> = new Subject();
  isAdmin = false;
  profiles: Profile[] = [];
  selectedUserId: string | null = null;
  loadingCalendar = false;

  constructor(
    private checkInService: CheckInService,
    private devotionService: DevotionService,
    private dialog: MatDialog,
    private profileService: ProfileService,
    private authService: AuthService
  ) {}

  /** Load role/profile context and calendar data. */
  async ngOnInit() {
    const profile = await this.profileService.getProfile();
    this.isAdmin = profile?.role === 'admin';

    if (this.isAdmin) {
      const currentUserId = this.authService.currentUser()?.id;
      const allProfiles = await this.profileService.getAllProfiles();
      this.profiles = allProfiles.filter(p => p.id !== currentUserId);
    }

    await this.loadCalendarData();
  }

  /** Handle admin user filter changes for calendar data. */
  async onUserSelectionChange(userId: string | null) {
    this.selectedUserId = userId;
    await this.loadCalendarData();
  }

  changeMonth(offset: number): void {
    this.viewDate = addMonths(this.viewDate, offset);
  }

  beforeMonthViewRender({ body }: { body: CalendarMonthViewDay[] }): void {
    const today = startOfDay(new Date());
    body.forEach(day => {
      // Robust comparison using local date strings
      const checkIn = this.checkIns.find(c => {
        const checkInDate = new Date(c.date);
        return checkInDate.getFullYear() === day.date.getFullYear() &&
               checkInDate.getMonth() === day.date.getMonth() &&
               checkInDate.getDate() === day.date.getDate();
      });

      const devotion = this.devotions.find(d => {
        const devotionDate = new Date(d.created_at);
        return devotionDate.getFullYear() === day.date.getFullYear() &&
               devotionDate.getMonth() === day.date.getMonth() &&
               devotionDate.getDate() === day.date.getDate();
      });

      day.meta = {
        checkIn,
        devotion,
        isFuture: day.date > today
      };

      if (checkIn) {
        if (checkIn.prayed && checkIn.read_bible) {
          day.cssClass = 'both';
        } else if (checkIn.prayed || checkIn.read_bible) {
          day.cssClass = 'one';
        } else {
          day.cssClass = 'missed';
        }
      } else if (day.date < today) {
         day.cssClass = 'missed';
      }
    });
  }

  /** Open the detail dialog for a selected day. */
  dayClicked({ date }: { date: Date }): void {
    const devotion = this.devotions.find(
      d => startOfDay(new Date(d.created_at)).getTime() === startOfDay(date).getTime()
    );
    const checkIn = this.checkIns.find(
      c => startOfDay(new Date(c.date)).getTime() === startOfDay(date).getTime()
    );

    this.dialog.open(DevotionDetailDialogComponent, {
      data: { devotion, checkIn, date }
    });
  }

  /** Fetch calendar data for current user or selected admin target user. */
  private async loadCalendarData() {
    this.loadingCalendar = true;
    const currentUserId = this.authService.currentUser()?.id;
    const targetUserId = this.isAdmin
      ? (this.selectedUserId || currentUserId || null)
      : (currentUserId || null);

    if (!targetUserId) {
      this.checkIns = [];
      this.devotions = [];
      this.loadingCalendar = false;
      this.refresh.next();
      return;
    }

    try {
      const [checkIns, devotions] = await Promise.all([
        this.checkInService.getCheckInsForUser(targetUserId),
        this.devotionService.getDevotionsForUser(targetUserId)
      ]);

      this.checkIns = checkIns;
      this.devotions = devotions;
    } finally {
      this.loadingCalendar = false;
      this.refresh.next();
    }
  }
}
