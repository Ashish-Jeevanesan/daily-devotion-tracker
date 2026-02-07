import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarModule, CalendarMonthViewDay, CalendarMonthViewBeforeRenderEvent } from 'angular-calendar';
import { CheckIn, CheckInService } from '../../services/check-in.service';
import { Devotion, DevotionService } from '../../services/devotion.service';
import { startOfDay, isSameDay } from 'date-fns';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DevotionDetailDialogComponent } from '../../components/devotion-detail-dialog/devotion-detail-dialog.component';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [
    CommonModule,
    CalendarModule,
    MatDialogModule
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

  constructor(
    private checkInService: CheckInService,
    private devotionService: DevotionService,
    private dialog: MatDialog
  ) {}

  /** Load check-ins and devotions for the calendar. */
  async ngOnInit() {
    this.checkIns = await this.checkInService.getCheckIns();
    this.devotions = await this.devotionService.getDevotions();
    this.refresh.next();
  }

  /** Populate calendar cells with devotion/check-in metadata and styles. */
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
}
