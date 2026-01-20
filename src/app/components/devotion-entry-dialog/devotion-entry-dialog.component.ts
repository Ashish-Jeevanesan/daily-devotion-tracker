import { Component, Inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { BIBLE_BOOKS } from '../../data/bible-books';

@Component({
  selector: 'app-devotion-entry-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule
  ],
  templateUrl: './devotion-entry-dialog.component.html',
  styleUrl: './devotion-entry-dialog.component.scss'
})
export class DevotionEntryDialogComponent {
  form: FormGroup;
  bibleBooks = BIBLE_BOOKS;
  chapters: number[] = Array.from({length: 150}, (_, i) => i + 1); // Simple max chapters for now
  verses: number[] = Array.from({length: 176}, (_, i) => i + 1); // Simple max verses for now

  constructor(
    public dialogRef: MatDialogRef<DevotionEntryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { notes: string }
  ) {
    // Parse existing notes to try and extract book/chapter/verse if possible?
    // For now, let's just assume we are appending or creating new.
    // Ideally we would split the 'notes' into parts if we stored them structured.
    // But since we store as string, we'll just have the user enter them.

    const notes = data?.notes || '';
    let book = '';
    let chapter = '';
    let verse = '';
    let content = notes;

    // Try to extract existing reference: "John 3:16 - content"
    const regex = /^([1-3]?\s?[a-zA-Z]+)\s(\d+):(\d+)\s-\s(.*)/s;
    const match = notes.match(regex);

    if (match) {
      book = match[1];
      chapter = match[2];
      verse = match[3];
      content = match[4];
    }
    
    this.form = new FormGroup({
      book: new FormControl(book),
      chapter: new FormControl(chapter ? parseInt(chapter) : ''),
      verse: new FormControl(verse ? parseInt(verse) : ''),
      notes: new FormControl(content, Validators.required)
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.form.valid) {
      const formValue = this.form.value;
      let finalNote = formValue.notes;
      
      if (formValue.book && formValue.chapter && formValue.verse) {
        finalNote = `${formValue.book} ${formValue.chapter}:${formValue.verse} - ${finalNote}`;
      }
      
      this.dialogRef.close(finalNote);
    }
  }
}
