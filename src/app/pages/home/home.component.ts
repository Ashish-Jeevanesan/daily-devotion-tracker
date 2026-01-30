import { Component, OnInit, signal } from '@angular/core';
import { TodaysDevotionComponent } from '../../components/todays-devotion/todays-devotion.component';
import { EarlierDevotionsComponent } from '../../components/earlier-devotions/earlier-devotions.component';
import { Profile, ProfileService } from '../../services/profile.service';
import { CheckIn, CheckInService } from '../../services/check-in.service';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatRadioModule } from '@angular/material/radio';
import { MatCardModule } from '@angular/material/card';
import { debounceTime } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { Devotion } from '../../services/devotion.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-home',
  imports: [
    TodaysDevotionComponent,
    EarlierDevotionsComponent,
    ReactiveFormsModule,
    MatRadioModule,
    MatCardModule,
    CommonModule,
    MatIconModule
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  profile = signal<Profile | null>(null);
  checkInForm: FormGroup;
  todayDevotion: Devotion | null = null;
  
  constructor(
    private profileService: ProfileService,
    private checkInService: CheckInService,
    private fb: FormBuilder
  ) {
    this.checkInForm = this.fb.group({
      prayed: [false],
      read_bible: [false]
    });

    this.checkInForm.valueChanges.pipe(
      debounceTime(500)
    ).subscribe(values => {
      this.checkInService.upsertCheckIn(values);
    });
  }

  ngOnInit() {
    this.profileService.getProfile().then(profile => {
      this.profile.set(profile);
    });

    this.checkInService.getTodaysCheckIn().then(checkIn => {
      if (checkIn) {
        this.checkInForm.patchValue(checkIn, { emitEvent: false });
      }
    });
  }

  onDevotionUpdated(devotion: Devotion | null) {
    this.todayDevotion = devotion;
  }
}