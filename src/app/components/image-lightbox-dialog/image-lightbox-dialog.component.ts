import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-image-lightbox-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="lightbox-container">
      <div class="lightbox-header">
        <span class="lightbox-title">{{ data.title || 'Devotion Photo' }}</span>
        <div class="lightbox-actions">
          <a [href]="data.imageUrl" target="_blank" download class="mat-icon-button" mat-icon-button matTooltip="Open full size">
            <mat-icon>open_in_new</mat-icon>
          </a>
          <button mat-icon-button (click)="dialogRef.close()" matTooltip="Close">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </div>
      <div class="lightbox-body">
        <img [src]="data.imageUrl" [alt]="data.title || 'Devotion Photo'" class="lightbox-image" />
      </div>
    </div>
  `,
  styles: [`
    .lightbox-container {
      display: flex;
      flex-direction: column;
      max-width: 90vw;
      max-height: 90vh;
      background: var(--card-bg, #ffffff);
      color: var(--text-color, #333333);
      border-radius: 12px;
      overflow: hidden;
    }

    .lightbox-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    }

    .lightbox-title {
      font-weight: 600;
      font-size: 1.1rem;
    }

    .lightbox-actions {
      display: flex;
      gap: 8px;
    }

    .lightbox-body {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      overflow: auto;
      background: rgba(0, 0, 0, 0.03);
    }

    .lightbox-image {
      max-width: 100%;
      max-height: 75vh;
      object-fit: contain;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    }
  `]
})
/** Lightbox dialog for viewing full-screen devotion photos. */
export class ImageLightboxDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ImageLightboxDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { imageUrl: string; title?: string }
  ) {}
}
