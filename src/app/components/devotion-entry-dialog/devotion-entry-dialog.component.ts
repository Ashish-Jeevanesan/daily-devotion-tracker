import { Component, Inject } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-devotion-entry-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './devotion-entry-dialog.component.html',
  styleUrl: './devotion-entry-dialog.component.scss'
})
export class DevotionEntryDialogComponent {
  notes: FormControl;

  constructor(
    public dialogRef: MatDialogRef<DevotionEntryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { notes: string }
  ) {
    this.notes = new FormControl(data?.notes || '', Validators.required);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.notes.valid) {
      this.dialogRef.close(this.notes.value);
    }
  }
}
