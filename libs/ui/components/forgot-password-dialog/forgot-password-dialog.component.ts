import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-forgot-password-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './forgot-password-dialog.component.html',
  styleUrls: ['./forgot-password-dialog.component.scss']
})
/** Dialog to collect an email for password reset. */
export class ForgotPasswordDialogComponent {
  email = new FormControl('', [Validators.required, Validators.email]);

  constructor(public dialogRef: MatDialogRef<ForgotPasswordDialogComponent>) {}

  /** Close the dialog without submitting. */
  onCancel(): void {
    this.dialogRef.close();
  }

  /** Submit the email if valid and close the dialog. */
  onSubmit(): void {
    if (this.email.valid) {
      this.dialogRef.close(this.email.value);
    }
  }
}
