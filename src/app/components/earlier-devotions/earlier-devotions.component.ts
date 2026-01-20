import { Component, OnInit, signal } from '@angular/core';
import { Devotion, DevotionService } from '../../services/devotion.service';
import { MatCardModule } from '@angular/material/card';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-earlier-devotions',
  imports: [
    MatCardModule,
    DatePipe,
    MatButtonModule,
    MatIconModule,
    ClipboardModule,
    MatSnackBarModule
  ],
  templateUrl: './earlier-devotions.component.html',
  styleUrl: './earlier-devotions.component.scss'
})
export class EarlierDevotionsComponent implements OnInit {
  earlierDevotions = signal<Devotion[]>([]);

  constructor(
    private devotionService: DevotionService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.devotionService.getEarlierDevotions().then(devotions => {
      this.earlierDevotions.set(devotions);
    });
  }

  copyDevotion(notes: string): void {
    if (notes) {
      this.snackBar.open('Devotion copied to clipboard!', 'Close', {
        duration: 3000
      });
    }
  }
}
