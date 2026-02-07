import { Component, OnInit, signal, computed, Output, EventEmitter } from '@angular/core';
import { Devotion, DevotionService } from '../../services/devotion.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DevotionEntryDialogComponent } from '../devotion-entry-dialog/devotion-entry-dialog.component';
import { MatIconModule } from '@angular/material/icon';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-todays-devotion',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatIconModule,
    ClipboardModule,
    MatSnackBarModule
  ],
  templateUrl: './todays-devotion.component.html',
  styleUrl: './todays-devotion.component.scss'
})
/** Card showing today's devotion with edit and copy actions. */
export class TodaysDevotionComponent implements OnInit {
  @Output() devotionUpdated = new EventEmitter<Devotion | null>();
  todaysDevotion = signal<Devotion | null>(null);
  bibleVerse = computed(() => {
    const notes = this.todaysDevotion()?.notes;
    if (!notes) return '';
    const separatorIndex = notes.indexOf(' - ');
    return separatorIndex > -1 ? notes.substring(0, separatorIndex) : '';
  });
  devotionNotes = computed(() => {
    const notes = this.todaysDevotion()?.notes;
    if (!notes) return '';
    const separatorIndex = notes.indexOf(' - ');
    return separatorIndex > -1 ? notes.substring(separatorIndex + 3) : notes;
  });

  today = new Date();
  loading = false;

  constructor(
    private devotionService: DevotionService,
    public dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  /** Load today's devotion and emit changes to parent. */
  ngOnInit() {
    this.loading = true;
    this.devotionService.getTodaysDevotion().then(devotion => {
      this.todaysDevotion.set(devotion);
      this.devotionUpdated.emit(devotion);
    }).finally(() => {
      this.loading = false;
    });
  }

  /** Open the entry dialog to create or edit today's devotion. */
  openDevotionDialog(): void {
    const currentDevotion = this.todaysDevotion();
    
    const dialogRef = this.dialog.open(DevotionEntryDialogComponent, {
      width: '80vw',
      maxWidth: '900px',
      data: { devotion: currentDevotion }
    });

    dialogRef.afterClosed().subscribe((updatedDevotion: Devotion | undefined) => {
      if (updatedDevotion) {
        this.todaysDevotion.set(updatedDevotion);
        this.devotionUpdated.emit(updatedDevotion);
      }
    });
  }

  /** Notify user when devotion text is copied. */
  copyDevotion(): void {
    const devotion = this.todaysDevotion();
    if (devotion?.notes) {
      // Logic handled by cdkCopyToClipboard directive, but we can show a snackbar
      this.snackBar.open('Devotion copied to clipboard!', 'Close', {
        duration: 3000
      });
    }
  }
}
