import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon'; // Added for password visibility toggle
import { NotificationService } from '../../services/notification.service'; // Re-added NotificationService import

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    MatTabsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  signInForm: FormGroup;
  signUpForm: FormGroup;
  errorMessage: string | null = null;
  loading = false;
  hideSignInPassword = true;
  hideSignUpPassword = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {
    this.signInForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });

    this.signUpForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  togglePasswordVisibility(form: 'signIn' | 'signUp') {
    if (form === 'signIn') {
      this.hideSignInPassword = !this.hideSignInPassword;
    } else {
      this.hideSignUpPassword = !this.hideSignUpPassword;
    }
  }

  signIn() {
    this.errorMessage = null;
    if (this.signInForm.valid) {
      this.loading = true;
      this.authService.signIn(this.signInForm.value.email, this.signInForm.value.password)
        .then(result => {
          if (result.error) {
            this.notificationService.show(result.error.message, 'error');
          }
          // The redirection logic is now handled in AuthService
        })
        .catch(error => {
          this.notificationService.show(error.message, 'error');
        })
        .finally(() => {
          this.loading = false;
        });
    }
  }

  async signUp() {
    this.errorMessage = null;
    if (this.signUpForm.valid) {
      this.loading = true;
      try {
        await this.authService.signUp(this.signUpForm.value.email, this.signUpForm.value.password);
        this.notificationService.show('Sign up successful! Please check your email for verification.', 'success');
      } catch (error: any) {
        this.errorMessage = error.message;
        this.notificationService.show(error.message, 'error');
      } finally {
        this.loading = false;
      }
    }
  }
}
