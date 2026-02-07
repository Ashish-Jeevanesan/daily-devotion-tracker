import { Component, Inject, OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { Observable, of } from 'rxjs';
import { startWith, map } from 'rxjs/operators';
import { BibleService } from '../../services/bible.service';
import { BibleBook } from '../../data/bible-books';
import { Devotion, DevotionService } from '../../services/devotion.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-devotion-entry-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './devotion-entry-dialog.component.html',
  styleUrl: './devotion-entry-dialog.component.scss'
})
/** Dialog for creating or editing a devotion entry. */
export class DevotionEntryDialogComponent implements OnInit {
  form: FormGroup;
  bibleBooks: BibleBook[] = [];
  chapters: number[] = [];
  verses: number[] = Array.from({ length: 176 }, (_, i) => i + 1);
  filteredBooks!: Observable<BibleBook[]>;
  chapters$: { [key: number]: Observable<number[]> } = {};
  isSaving = false;

  private currentDevotion: Devotion | null;

  constructor(
    public dialogRef: MatDialogRef<DevotionEntryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { devotion: Devotion | null },
    private bibleService: BibleService,
    private devotionService: DevotionService,
    private snackBar: MatSnackBar
  ) {
    this.currentDevotion = data.devotion;
    const notes = this.currentDevotion?.notes || '';
    
    let content = notes;
    let references: any[] = [];
    const separatorIndex = notes.indexOf(' - ');

    if (separatorIndex > -1) {
      const referenceString = notes.substring(0, separatorIndex);
      content = notes.substring(separatorIndex + 3);
      
      const refStrings = referenceString.split(',').map(s => s.trim());
      const refRegex = /([1-3]?\s?[a-zA-Z\s]+)\s(\d+):(\d+)(?:-(\d+))?/;

      references = refStrings.map(refStr => {
        const match = refStr.match(refRegex);
        if (match) {
          return {
            book: match[1].trim(),
            chapter: parseInt(match[2]),
            verseStart: parseInt(match[3]),
            verseEnd: match[4] ? parseInt(match[4]) : ''
          };
        }
        return null;
      }).filter(r => r !== null);
    }

    this.form = new FormGroup({
      references: new FormArray(
        references.length > 0
          ? references.map(r => this.createReferenceGroup(r))
          : [this.createReferenceGroup()]
      ),
      notes: new FormControl(content, Validators.required)
    });
  }

  /** Load Bible data and initialize reference dropdowns. */
  ngOnInit() {
    this.bibleService.getBooks().subscribe(books => {
      this.bibleBooks = books;
    });

    this.references.controls.forEach((control, index) => {
      const bookName = control.get('book')?.value;
      if (bookName) {
        this.updateChapters(index, bookName);
      }
    });
  }

  /** Build a reference form group and wire book change handling. */
  createReferenceGroup(reference?: any): FormGroup {
    const group = new FormGroup({
      book: new FormControl(reference?.book || ''),
      chapter: new FormControl(reference?.chapter || ''),
      verseStart: new FormControl(reference?.verseStart || ''),
      verseEnd: new FormControl(reference?.verseEnd || '')
    });

    group.get('book')?.valueChanges.subscribe(bookName => {
      const index = this.references.controls.indexOf(group);
      if (index !== -1 && typeof bookName === 'string') {
        this.updateChapters(index, bookName);
        if (group.get('chapter')?.value) {
            group.get('chapter')?.setValue('');
        }
      } else if (index !== -1 && typeof bookName === 'object' && bookName?.name) {
          this.updateChapters(index, bookName.name);
          if (group.get('chapter')?.value) {
              group.get('chapter')?.setValue('');
          }
      }
    });

    return group;
  }

  /** Load chapter list for a selected Bible book. */
  updateChapters(index: number, bookName: string) {
    this.chapters$[index] = this.bibleService.getChapters(bookName);
  }

  /** Accessor for the references form array. */
  get references(): FormArray {
    return this.form.get('references') as FormArray;
  }

  /** Add an additional scripture reference entry. */
  addReference(): void {
    this.references.push(this.createReferenceGroup());
  }

  /** Remove a scripture reference entry. */
  removeReference(index: number): void {
    this.references.removeAt(index);
    delete this.chapters$[index];
  }

  /** Initialize book autocomplete for the given row. */
  onBookFocus(index: number) {
    this.filteredBooks = this.references.at(index).get('book')!.valueChanges.pipe(
      startWith(''),
      map(value => {
        const name = typeof value === 'string' ? value : value?.name;
        return name ? this._filterBooks(name) : this.bibleBooks.slice();
      })
    );
  }

  /** Filter Bible books for autocomplete. */
  private _filterBooks(value: string): BibleBook[] {
    const filterValue = value.toLowerCase();
    return this.bibleBooks.filter(book => book.name.toLowerCase().includes(filterValue));
  }
  
  /** Format selected book value for display. */
  displayBook(book: BibleBook | string): string {
      if (typeof book === 'string') return book;
      return book ? book.name : '';
  }

  /** Close the dialog without saving. */
  onCancel(): void {
    this.dialogRef.close();
  }

  /** Validate and persist the devotion, then close the dialog. */
  async onSave(): Promise<void> {
    if (this.form.invalid || this.isSaving) {
      return;
    }

    this.isSaving = true;

    try {
      const formValue = this.form.value;
      let referenceString = '';
      
      const refs = formValue.references.filter((r: any) => r.book && r.chapter && r.verseStart);
      
      if (refs.length > 0) {
        referenceString = refs.map((r: any) => {
          const bookName = typeof r.book === 'string' ? r.book : r.book.name;
          let ref = `${bookName} ${r.chapter}:${r.verseStart}`;
          if (r.verseEnd && r.verseEnd > r.verseStart) {
            ref += `-${r.verseEnd}`;
          }
          return ref;
        }).join(', ');
        
        referenceString += ' - ';
      }
      
      const finalNote = `${referenceString}${formValue.notes}`;
      
      let updatedDevotion: Devotion | null = null;
      if (this.currentDevotion) {
        updatedDevotion = await this.devotionService.updateDevotion(this.currentDevotion.id, finalNote);
      } else {
        updatedDevotion = await this.devotionService.addDevotion(finalNote);
      }
      
      this.snackBar.open('Devotion saved successfully!', 'Close', {
        duration: 3000,
        panelClass: 'success-snackbar'
      });
      this.dialogRef.close(updatedDevotion);

    } catch (error) {
      console.error('Error saving devotion', error);
      this.snackBar.open('Something went wrong. Please try again.', 'Close', {
        duration: 5000,
        panelClass: 'error-snackbar'
      });
    } finally {
      this.isSaving = false;
    }
  }
}
