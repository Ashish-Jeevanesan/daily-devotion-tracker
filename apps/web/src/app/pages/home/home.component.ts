import { Component, OnInit, signal } from '@angular/core';
import { TodaysDevotionComponent } from '@ui/components/todays-devotion/todays-devotion.component';
import { EarlierDevotionsComponent } from '@ui/components/earlier-devotions/earlier-devotions.component';
import { ProfileService } from '@services/profile.service';
import { CheckInService } from '@services/check-in.service';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatRadioModule } from '@angular/material/radio';
import { MatCardModule } from '@angular/material/card';
import { debounceTime } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { Devotion } from '@models/devotion.model';
import { MatIconModule } from '@angular/material/icon';
import { Profile } from '@models/profile.model';

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
/** Main dashboard showing today's devotion and recent history. */
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

  /** Load profile data and today's check-in state. */
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

  /** Receive devotion updates from the child component. */
  onDevotionUpdated(devotion: Devotion | null) {
    this.todayDevotion = devotion;
  }
}
