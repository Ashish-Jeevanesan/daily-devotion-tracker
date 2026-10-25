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
import { ImageLightboxDialogComponent } from '../image-lightbox-dialog/image-lightbox-dialog.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-todays-devotion',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatIconModule,
    ClipboardModule,
    MatSnackBarModule,
    TranslateModule
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
    if (separatorIndex > -1) return notes.substring(0, separatorIndex);
    const refOnly = /^(?:[1-3]?\s?[a-zA-Z]+(?:\s[a-zA-Z]+)*\s\d+:\d+(?:-\d+)?(?:,\s*)?)+$/;
    return refOnly.test(notes.trim()) ? notes.trim() : '';
  });
  devotionNotes = computed(() => {
    const notes = this.todaysDevotion()?.notes;
    if (!notes) return '';
    const separatorIndex = notes.indexOf(' - ');
    if (separatorIndex > -1) return notes.substring(separatorIndex + 3);
    const refOnly = /^(?:[1-3]?\s?[a-zA-Z]+(?:\s[a-zA-Z]+)*\s\d+:\d+(?:-\d+)?(?:,\s*)?)+$/;
    return refOnly.test(notes.trim()) ? '' : notes;
  });

  today = new Date();
  loading = false;

  constructor(
    private devotionService: DevotionService,
    public dialog: MatDialog,
    private snackBar: MatSnackBar,
    private translate: TranslateService
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

  /** Open full-screen lightbox for devotion photo. */
  openImageLightbox(imageUrl: string): void {
    if (!imageUrl) return;
    this.dialog.open(ImageLightboxDialogComponent, {
      data: { imageUrl, title: this.translate.instant('todaysDevotion.photoTitle') }
    });
  }

  /** Open the entry dialog to create or edit today's devotion. */
  openDevotionDialog(): void {
    const currentDevotion = this.todaysDevotion();
    const isMobile = window.innerWidth <= 600;

    const config = {
      width: isMobile ? '100%' : '80vw',
      maxWidth: isMobile ? '100vw' : '900px',
      height: isMobile ? '100%' : 'auto',
      panelClass: isMobile ? 'mobile-fullscreen' : '',
      autoFocus: 'dialog',
      data: { devotion: currentDevotion }
    };
    (config as any).ariaModal = true;
    const dialogRef = this.dialog.open(DevotionEntryDialogComponent, config);

    dialogRef.afterClosed().subscribe((updatedDevotion: Devotion | undefined) => {
      if (updatedDevotion) {
        this.todaysDevotion.set(updatedDevotion);
        this.devotionUpdated.emit(updatedDevotion);
      }
    });
  }

  /** Show snackbar confirmation when devotion notes are copied. */
  copyDevotion(): void {
    const devotion = this.todaysDevotion();
    if (devotion?.notes) {
      // Logic handled by cdkCopyToClipboard directive, but we can show a snackbar
      this.snackBar.open(this.translate.instant('todaysDevotion.copied'), this.translate.instant('common.close'), {
        duration: 3000
      });
    }
  }
}
