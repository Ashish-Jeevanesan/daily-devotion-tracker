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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ForgotPasswordDialogComponent } from '../../components/forgot-password-dialog/forgot-password-dialog.component';

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
    MatIconModule,
    MatDialogModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
/** Login and registration page with password reset dialog. */
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
    private notificationService: NotificationService,
    private dialog: MatDialog
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

  /** Toggle visibility for sign-in/sign-up password fields. */
  togglePasswordVisibility(form: 'signIn' | 'signUp') {
    if (form === 'signIn') {
      this.hideSignInPassword = !this.hideSignInPassword;
    } else {
      this.hideSignUpPassword = !this.hideSignUpPassword;
    }
  }

  /** Submit sign-in credentials and handle auth errors. */
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

  /** Create a new account and prompt email verification. */
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

  /** Open reset dialog and trigger password reset email. */
  forgotPassword() {
    const dialogRef = this.dialog.open(ForgotPasswordDialogComponent, {
      width: '400px'
    });

    dialogRef.afterClosed().subscribe(async (email) => {
      if (email) {
        this.loading = true;
        try {
          await this.authService.resetPassword(email);
          this.notificationService.show('Password reset link sent to your email.', 'success');
        } catch (error: any) {
          this.notificationService.show(error.message, 'error');
        } finally {
          this.loading = false;
        }
      }
    });
  }
}
