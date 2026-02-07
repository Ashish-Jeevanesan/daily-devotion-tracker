import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProfileService } from '../../services/profile.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-profile',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
/** Profile form for collecting user details after sign-in. */
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService,
    private router: Router
  ) {
    this.profileForm = this.fb.group({
      full_name: [''],
      age: [''],
      username: ['']
    });
  }

  /** Load existing profile data into the form. */
  ngOnInit() {
    this.loading = true;
    this.profileService.getProfile().then(profile => {
      if (profile) {
        this.profileForm.patchValue(profile);
      }
    }).finally(() => {
      this.loading = false;
    });
  }

  /** Save profile changes and return to home. */
  async updateProfile() {
    if (this.profileForm.valid) {
      this.loading = true;
      try {
        await this.profileService.upsertProfile(this.profileForm.value);
        this.router.navigate(['/']);
      } catch (error) {
        console.error('Error updating profile', error);
      } finally {
        this.loading = false;
      }
    }
  }
}
