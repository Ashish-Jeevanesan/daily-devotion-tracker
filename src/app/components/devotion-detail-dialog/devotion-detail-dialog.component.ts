import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { Devotion } from '../../services/devotion.service';
import { CheckIn } from '../../services/check-in.service';
import { MatIconModule } from '@angular/material/icon';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-devotion-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    ClipboardModule,
    MatSnackBarModule
  ],
  templateUrl: './devotion-detail-dialog.component.html',
  styleUrls: ['./devotion-detail-dialog.component.scss']
})
/** Dialog showing devotion and check-in details for a day. */
export class DevotionDetailDialogComponent {
  bibleVerse: string | null = null;
  devotionNotes: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<DevotionDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { devotion: Devotion | undefined, checkIn: CheckIn | undefined, date: Date },
    private snackBar: MatSnackBar
  ) {
    if (data.devotion?.notes) {
      const notes = data.devotion.notes;
      const separatorIndex = notes.indexOf(' - ');

      if (separatorIndex > -1) {
        this.bibleVerse = notes.substring(0, separatorIndex);
        this.devotionNotes = notes.substring(separatorIndex + 3);
      } else {
        this.devotionNotes = notes;
      }
    }
  }

  /** Close the details dialog. */
  onClose(): void {
    this.dialogRef.close();
  }

  /** Notify user when devotion text is copied. */
  copyDevotion(): void {
    if (this.data.devotion?.notes) {
      this.snackBar.open('Devotion copied to clipboard!', 'Close', {
        duration: 3000
      });
    }
  }
}
