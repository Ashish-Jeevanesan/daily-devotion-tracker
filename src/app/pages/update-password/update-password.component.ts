import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NotificationService } from '../../services/notification.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-update-password',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    CommonModule
  ],
  templateUrl: './update-password.component.html',
  styleUrl: './update-password.component.scss'
})
/** Password reset page used after Supabase email reset link. */
export class UpdatePasswordComponent {
  updatePasswordForm: FormGroup;
  hidePassword = true;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {
    this.updatePasswordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  /** Toggle password visibility in the form field. */
  togglePasswordVisibility() {
    this.hidePassword = !this.hidePassword;
  }

  /** Submit the new password and redirect on success. */
  async updatePassword() {
    if (this.updatePasswordForm.valid) {
      this.loading = true;
      try {
        await this.authService.updatePassword(this.updatePasswordForm.value.password);
        this.notificationService.show('Password updated successfully. Please sign in.', 'success');
        this.router.navigate(['/login']);
      } catch (error: any) {
        this.notificationService.show(error.message, 'error');
      } finally {
        this.loading = false;
      }
    }
  }
}
