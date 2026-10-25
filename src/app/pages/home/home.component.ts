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

import { TranslateModule } from '@ngx-translate/core';

import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatButtonModule } from '@angular/material/button';

import { MatDialog } from '@angular/material/dialog';
import { DevotionEntryDialogComponent } from '../../components/devotion-entry-dialog/devotion-entry-dialog.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    TodaysDevotionComponent,
    EarlierDevotionsComponent,
    ReactiveFormsModule,
    MatRadioModule,
    MatCardModule,
    CommonModule,
    MatIconModule,
    TranslateModule,
    MatButtonToggleModule,
    MatButtonModule
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
    private fb: FormBuilder,
    private dialog: MatDialog
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

  /** Open the entry dialog to create today's devotion. */
  openAddDevotionDialog(): void {
    const isMobile = window.innerWidth <= 600;
    
    const config = {
      width: isMobile ? '100%' : '80vw',
      maxWidth: isMobile ? '100vw' : '900px',
      height: isMobile ? '100%' : 'auto',
      panelClass: isMobile ? 'mobile-fullscreen' : '',
      autoFocus: 'dialog',
      data: { devotion: null }
    };
    (config as any).ariaModal = true;
    const dialogRef = this.dialog.open(DevotionEntryDialogComponent, config);

    dialogRef.afterClosed().subscribe((updatedDevotion: Devotion | undefined) => {
      if (updatedDevotion) {
        this.todayDevotion = updatedDevotion;
      }
    });
  }

  /** Receive devotion updates from the child component. */
  onDevotionUpdated(devotion: Devotion | null) {
    this.todayDevotion = devotion;
  }
}
