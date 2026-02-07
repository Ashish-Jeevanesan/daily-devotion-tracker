import { Component, OnInit, signal } from '@angular/core';
import { Devotion, DevotionService } from '../../services/devotion.service';
import { MatCardModule } from '@angular/material/card';
import { CommonModule, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

// Define a new interface that extends Devotion
export interface DevotionTimelineItem extends Devotion {
  isMissedDay: false;
}

// Define the structure for a missed day
export interface MissedDay {
  isMissedDay: true;
  startDate: Date;
  endDate: Date;
  missedDays: number;
  encouragement: Encouragement;
}

// Define a type for the items in the timeline
export type TimelineItem = DevotionTimelineItem | MissedDay;

// Define the structure for an encouragement message
export interface Encouragement {
  verse: string;
  message: string;
}

@Component({
  selector: 'app-earlier-devotions',
  imports: [
    MatCardModule,
    DatePipe,
    MatButtonModule,
    MatIconModule,
    ClipboardModule,
    MatSnackBarModule,
    CommonModule
  ],
  templateUrl: './earlier-devotions.component.html',
  styleUrls: ['./earlier-devotions.component.scss']
})
/** Timeline of previous devotions with gaps highlighted as missed days. */
export class EarlierDevotionsComponent implements OnInit {
  timeline = signal<TimelineItem[]>([]);

  private encouragements: Encouragement[] = [
    {
      verse: 'The steadfast love of the Lord never ceases; his mercies never come to an end; they are new every morning; great is your faithfulness. - Lamentations 3:22-23',
      message: 'His mercies are new every morning.'
    },
    {
      verse: 'Come to me, all who labor and are heavy laden, and I will give you rest. - Matthew 11:28',
      message: 'Find rest in Him.'
    },
    {
      verse: 'For I know the plans I have for you, declares the Lord, plans for welfare and not for evil, to give you a future and a hope. - Jeremiah 29:11',
      message: 'He has a plan for you.'
    },
    {
      verse: 'I can do all things through him who strengthens me. - Philippians 4:13',
      message: 'You are stronger than you think.'
    }
  ];

  constructor(
    private devotionService: DevotionService,
    private snackBar: MatSnackBar
  ) {}

  /** Load earlier devotions and build the timeline. */
  ngOnInit() {
    this.devotionService.getEarlierDevotions().then(devotions => {
      this.buildTimeline(devotions);
    });
  }

  /** Build timeline entries with missed-day segments and devotions. */
  private buildTimeline(devotions: Devotion[]): void {
    if (devotions.length === 0) {
      this.timeline.set([]);
      return;
    }

    const newTimeline: TimelineItem[] = [];
    let lastDevotionDate = new Date(); // Today

    devotions.forEach(devotion => {
      const devotionDate = new Date(devotion.created_at);
      const differenceInDays = this.getDateDifference(lastDevotionDate, devotionDate);

      if (differenceInDays > 1) {
        const encouragement = this.getRandomEncouragement();
        newTimeline.push({
          isMissedDay: true,
          startDate: new Date(devotionDate.getTime() + 86400000),
          endDate: new Date(lastDevotionDate.getTime() - 86400000),
          missedDays: differenceInDays - 1,
          encouragement
        });
      }

      newTimeline.push({ ...devotion, isMissedDay: false });
      lastDevotionDate = devotionDate;
    });

    this.timeline.set(newTimeline);
  }

  /** Calculate whole-day difference between two dates. */
  private getDateDifference(date1: Date, date2: Date): number {
    const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
    const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
    const differenceInTime = d1.getTime() - d2.getTime();
    return Math.floor(differenceInTime / (1000 * 3600 * 24));
  }

  /** Pick a random encouragement for missed-day gaps. */
  private getRandomEncouragement(): Encouragement {
    return this.encouragements[Math.floor(Math.random() * this.encouragements.length)];
  }

  /** Notify user when devotion text is copied. */
  copyDevotion(notes: string): void {
    if (notes) {
      this.snackBar.open('Devotion copied to clipboard!', 'Close', {
        duration: 3000
      });
    }
  }

  /** Extract verse reference from a devotion note. */
  getVerseReference(notes: string): string {
    const separatorIndex = notes.indexOf(' - ');
    if (separatorIndex > -1) {
      return notes.substring(0, separatorIndex);
    }
    return '';
  }

  /** Extract the notes content after the verse reference. */
  getNotesContent(notes: string): string {
    const separatorIndex = notes.indexOf(' - ');
    if (separatorIndex > -1) {
      return notes.substring(separatorIndex + 3);
    }
    return notes;
  }
}
