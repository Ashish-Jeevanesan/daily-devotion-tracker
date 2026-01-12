import { Component, OnInit, signal } from '@angular/core';
import { Devotion, DevotionService } from '../../services/devotion.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { DatePipe } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DevotionEntryDialogComponent } from '../devotion-entry-dialog/devotion-entry-dialog.component';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-todays-devotion',
  imports: [
    MatCardModule,
    MatButtonModule,
    DatePipe,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatIconModule
  ],
  templateUrl: './todays-devotion.component.html',
  styleUrl: './todays-devotion.component.scss'
})
export class TodaysDevotionComponent implements OnInit {
  todaysDevotion = signal<Devotion | null>(null);
  today = new Date();
  loading = false;

  constructor(
    private devotionService: DevotionService,
    public dialog: MatDialog
  ) {}

  ngOnInit() {
    this.loading = true;
    this.devotionService.getTodaysDevotion().then(devotion => {
      this.todaysDevotion.set(devotion);
    }).finally(() => {
      this.loading = false;
    });
  }

  openDevotionDialog(): void {
    const currentDevotion = this.todaysDevotion();
    
    const dialogRef = this.dialog.open(DevotionEntryDialogComponent, {
      width: '80vw',
      maxWidth: '600px',
      data: { notes: currentDevotion?.notes || '' }
    });

    dialogRef.afterClosed().subscribe(async (result: string | undefined) => {
      if (result) {
        this.loading = true;
        try {
          let updatedDevotion: Devotion | null = null;
          if (currentDevotion) {
            updatedDevotion = await this.devotionService.updateDevotion(currentDevotion.id, result);
          } else {
            updatedDevotion = await this.devotionService.addDevotion(result);
          }
          
          if (updatedDevotion) {
            this.todaysDevotion.set(updatedDevotion);
          }
        } catch (error) {
          console.error('Error saving devotion', error);
        } finally {
          this.loading = false;
        }
      }
    });
  }
}
