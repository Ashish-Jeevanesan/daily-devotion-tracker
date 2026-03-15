import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ProfileService } from '../../services/profile.service';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
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
    MatDatepickerModule,
    MatNativeDateModule,
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
      full_name: ['', Validators.required],
      age: [null, [Validators.required, Validators.min(1)]],
      dob: [null, Validators.required],
      phone_number: ['', Validators.required],
      church_name: ['', Validators.required],
      username: ['']
    });

    this.profileForm.get('dob')?.valueChanges.subscribe(value => {
      this.profileForm.patchValue(
        { age: this.calculateAge(value) },
        { emitEvent: false }
      );
    });
  }

  /** Load existing profile data into the form. */
  ngOnInit() {
    this.loading = true;
    this.profileService.getProfile().then(profile => {
      if (profile) {
        this.profileForm.patchValue({
          ...profile,
          dob: profile.dob ? new Date(profile.dob) : null,
          age: profile.dob ? this.calculateAge(profile.dob) : profile.age
        });
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
        const formValue = this.profileForm.getRawValue();
        await this.profileService.upsertProfile({
          ...formValue,
          age: this.calculateAge(formValue.dob),
          dob: this.formatDateForStorage(formValue.dob)
        });
        this.router.navigate(['/']);
      } catch (error) {
        console.error('Error updating profile', error);
      } finally {
        this.loading = false;
      }
    }
  }

  private calculateAge(value: string | Date | null): number | null {
    if (!value) return null;

    const dob = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(dob.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age -= 1;
    }

    return age >= 0 ? age : null;
  }

  private formatDateForStorage(value: string | Date | null): string | null {
    if (!value) return null;

    const dob = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(dob.getTime())) return null;

    const year = dob.getFullYear();
    const month = String(dob.getMonth() + 1).padStart(2, '0');
    const day = String(dob.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
