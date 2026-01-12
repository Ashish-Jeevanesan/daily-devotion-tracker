import { Component, OnInit, signal } from '@angular/core';
import { Devotion, DevotionService } from '../../services/devotion.service';
import { MatCardModule } from '@angular/material/card';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-earlier-devotions',
  imports: [MatCardModule, DatePipe],
  templateUrl: './earlier-devotions.component.html',
  styleUrl: './earlier-devotions.component.scss'
})
export class EarlierDevotionsComponent implements OnInit {
  earlierDevotions = signal<Devotion[]>([]);

  constructor(private devotionService: DevotionService) {}

  ngOnInit() {
    this.devotionService.getEarlierDevotions().then(devotions => {
      this.earlierDevotions.set(devotions);
    });
  }
}
