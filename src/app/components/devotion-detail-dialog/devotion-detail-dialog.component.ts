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
export class DevotionDetailDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<DevotionDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { devotion: Devotion | undefined, checkIn: CheckIn | undefined, date: Date },
    private snackBar: MatSnackBar
  ) {}

  onClose(): void {
    this.dialogRef.close();
  }

  copyDevotion(): void {
    if (this.data.devotion?.notes) {
      this.snackBar.open('Devotion copied to clipboard!', 'Close', {
        duration: 3000
      });
    }
  }
}
