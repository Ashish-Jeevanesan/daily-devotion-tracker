import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { Observable, Subscription, combineLatest, of } from 'rxjs';
import { catchError, debounceTime, map, startWith, switchMap } from 'rxjs/operators';
import { BibleService, VersePreview } from '../../services/bible.service';
import { BibleBook } from '../../data/bible-books';
import { Devotion, DevotionService } from '../../services/devotion.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

interface VersePreviewState {
  status: 'idle' | 'loading' | 'loaded' | 'too-long';
  reference?: string;
  verses?: Array<{ verse: number; text: string }>;
}

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
export class DevotionEntryDialogComponent implements OnInit, OnDestroy {
  form: FormGroup;
  bibleBooks: BibleBook[] = [];
  chapters: number[] = [];
  verses: number[] = Array.from({ length: 176 }, (_, i) => i + 1);
  filteredBooks!: Observable<BibleBook[]>;
  chapters$: { [key: number]: Observable<number[]> } = {};
  verseCounts$: { [key: number]: Observable<number[]> } = {};
  isSaving = false;
  selectedFile: File | null = null;
  imagePreviewUrl: string | null = null;
  existingImageUrl: string | null = null;
  removeImageRequested = false;
  isUploadingImage = false;
  imageError: string | null = null;

  private previewSubscriptions = new Map<FormGroup, Subscription>();
  private previewStates = new Map<FormGroup, VersePreviewState>();
  private currentDevotion: Devotion | null;

  constructor(
    public dialogRef: MatDialogRef<DevotionEntryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { devotion: Devotion | null },
    private bibleService: BibleService,
    private devotionService: DevotionService,
    private snackBar: MatSnackBar
  ) {
    this.currentDevotion = data.devotion;
    this.existingImageUrl = this.currentDevotion?.image_url || null;
    this.imagePreviewUrl = this.existingImageUrl;
    const notes = this.currentDevotion?.notes || '';
    
    let content = notes;
    let references: any[] = [];
    const separatorIndex = notes.indexOf(' - ');

    const refRegex = /([1-3]?\s?[a-zA-Z\s]+)\s(\d+):(\d+)(?:-(\d+))?/;
    const parseRefString = (str: string): any[] => str.split(',').map(s => s.trim()).map(s => {
      const m = s.match(refRegex);
      return m ? { book: m[1].trim(), chapter: parseInt(m[2]), verseStart: parseInt(m[3]), verseEnd: m[4] ? parseInt(m[4]) : '' } : null;
    }).filter(r => r !== null);

    if (separatorIndex > -1) {
      content = notes.substring(separatorIndex + 3);
      references = parseRefString(notes.substring(0, separatorIndex));
    } else {
      // Verse-only save: the stored string is entirely composed of reference(s) with no notes text.
      // Matches formats like "John 3:16" or "Genesis 3:5-19, Romans 6:23" but not free-form sentences.
      const refOnlyPattern = /^(?:[1-3]?\s?[a-zA-Z]+(?:\s[a-zA-Z]+)*\s\d+:\d+(?:-\d+)?(?:,\s*)?)+$/;
      if (refOnlyPattern.test(notes.trim())) {
        references = parseRefString(notes);
        content = '';
      }
    }

    this.form = new FormGroup({
      references: new FormArray(
        references.length > 0
          ? references.map(r => this.createReferenceGroup(r))
          : [this.createReferenceGroup()]
      ),
      notes: new FormControl(content)
    }, { validators: this.devotionContentValidator });
  }

  /** Handle photo file selection and validation. */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.imageError = null;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      this.imageError = 'Please select a valid image (.jpg, .png, .webp).';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.imageError = 'Image size must be under 5MB.';
      return;
    }

    this.selectedFile = file;
    this.removeImageRequested = false;
    this.imagePreviewUrl = URL.createObjectURL(file);
  }

  /** Remove attached image before saving. */
  removeSelectedImage(): void {
    this.selectedFile = null;
    this.imagePreviewUrl = null;
    this.removeImageRequested = true;
    this.imageError = null;
  }

  /** Load Bible data and initialize reference dropdowns. */
  ngOnInit() {
    this.bibleService.getBooks().subscribe(books => {
      this.bibleBooks = books;
    });

    this.references.controls.forEach((control, index) => {
      const bookName = control.get('book')?.value;
      const chapter = control.get('chapter')?.value;
      if (bookName) {
        this.updateChapters(index, bookName);
      }
      if (bookName && chapter) {
        this.updateVerseCounts(index, bookName, chapter);
      }
      this.watchReferenceForPreview(control as FormGroup);
    });
  }

  ngOnDestroy(): void {
    this.previewSubscriptions.forEach(sub => sub.unsubscribe());
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

  /** Load verse list for a selected book + chapter. */
  updateVerseCounts(index: number, bookName: string, chapter: number) {
    this.verseCounts$[index] = this.bibleService.getChapterVerses(bookName, chapter);
  }

  /** Accessor for the references form array. */
  get references(): FormArray {
    return this.form.get('references') as FormArray;
  }

  /** Add an additional scripture reference entry. */
  addReference(): void {
    const group = this.createReferenceGroup();
    this.references.push(group);
    this.watchReferenceForPreview(group);
  }

  /** Remove a scripture reference entry. */
  removeReference(index: number): void {
    const group = this.references.at(index) as FormGroup;
    this.previewSubscriptions.get(group)?.unsubscribe();
    this.previewSubscriptions.delete(group);
    this.previewStates.delete(group);
    this.references.removeAt(index);
    delete this.chapters$[index];
    delete this.verseCounts$[index];
  }

  /** Return the verse preview state for a given reference row. */
  getPreviewState(index: number): VersePreviewState {
    const group = this.references.at(index) as FormGroup;
    return this.previewStates.get(group) ?? { status: 'idle' };
  }

  get isMobile(): boolean {
    return window.innerWidth < 768;
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

  /** Subscribe to a reference row's field changes and update its verse preview state. */
  private watchReferenceForPreview(group: FormGroup): void {
    // Reset verse fields and reload verse count whenever the chapter changes.
    const chapterSub = group.get('chapter')!.valueChanges.subscribe(chapter => {
      const index = this.references.controls.indexOf(group);
      if (index === -1) return;
      group.get('verseStart')?.setValue('');
      group.get('verseEnd')?.setValue('');
      if (!chapter) {
        delete this.verseCounts$[index];
        return;
      }
      const book = group.get('book')?.value;
      const bookName = typeof book === 'object' && book?.name ? book.name : (book as string || '');
      if (bookName) this.updateVerseCounts(index, bookName, chapter);
    });

    const val = (ctrl: string) => group.get(ctrl)!.valueChanges.pipe(startWith(group.get(ctrl)!.value));

    const previewSub = combineLatest([val('book'), val('chapter'), val('verseStart'), val('verseEnd')]).pipe(
      debounceTime(400),
      switchMap(([book, chapter, verseStart, verseEnd]) => {
        const bookName = typeof book === 'object' && book?.name ? book.name : (book as string || '');
        if (!bookName || !chapter || !verseStart) {
          return of<VersePreviewState>({ status: 'idle' });
        }
        const range = verseEnd && verseEnd !== '' ? Number(verseEnd) - Number(verseStart) : 0;
        if (range < 0) return of<VersePreviewState>({ status: 'idle' });
        const isMobile = window.innerWidth < 768;
        if (isMobile && range > 20) return of<VersePreviewState>({ status: 'too-long' });

        return this.bibleService.getVerseText(bookName, chapter, verseStart, verseEnd || null).pipe(
          map((result: VersePreview | null) => result
            ? <VersePreviewState>{ status: 'loaded', reference: result.reference, verses: result.verses }
            : <VersePreviewState>{ status: 'idle' }
          ),
          catchError(() => of<VersePreviewState>({ status: 'idle' })),
          startWith<VersePreviewState>({ status: 'loading' })
        );
      })
    ).subscribe(state => this.previewStates.set(group, state));

    const combined = new Subscription();
    combined.add(chapterSub);
    combined.add(previewSub);
    this.previewSubscriptions.set(group, combined);
  }

  /** Require at least one complete verse reference, non-empty notes, or attached photo. */
  private devotionContentValidator = (group: AbstractControl): ValidationErrors | null => {
    const notes = (group.get('notes')?.value || '').trim();
    const references = group.get('references') as FormArray;
    const hasValidRef = references?.controls.some(ctrl =>
      ctrl.get('book')?.value && ctrl.get('chapter')?.value && ctrl.get('verseStart')?.value
    );
    const hasImage = !!this.imagePreviewUrl;
    return notes || hasValidRef || hasImage ? null : { noContent: true };
  };

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
      let finalImageUrl: string | null | undefined = this.existingImageUrl;

      if (this.selectedFile) {
        this.isUploadingImage = true;
        const uploadedUrl = await this.devotionService.uploadDevotionImage(this.selectedFile);
        if (!uploadedUrl) {
          this.snackBar.open('Failed to upload image. Please try again.', 'Close', {
            duration: 5000,
            panelClass: 'error-snackbar'
          });
          this.isSaving = false;
          this.isUploadingImage = false;
          return;
        }
        if (this.existingImageUrl && this.existingImageUrl !== uploadedUrl) {
          await this.devotionService.deleteDevotionImage(this.existingImageUrl);
        }
        finalImageUrl = uploadedUrl;
      } else if (this.removeImageRequested) {
        if (this.existingImageUrl) {
          await this.devotionService.deleteDevotionImage(this.existingImageUrl);
        }
        finalImageUrl = null;
      }

      const formValue = this.form.value;
      let referenceString = '';
      
      const refs = formValue.references.filter((r: any) => r.book && r.chapter && r.verseStart);
      const notesText = (formValue.notes || '').trim();

      if (refs.length > 0) {
        referenceString = refs.map((r: any) => {
          const bookName = typeof r.book === 'string' ? r.book : r.book.name;
          let ref = `${bookName} ${r.chapter}:${r.verseStart}`;
          if (r.verseEnd && r.verseEnd > r.verseStart) {
            ref += `-${r.verseEnd}`;
          }
          return ref;
        }).join(', ');
      }

      const finalNote = refs.length > 0 && notesText
        ? `${referenceString} - ${notesText}`
        : refs.length > 0 ? referenceString : notesText;
      
      let updatedDevotion: Devotion | null = null;
      if (this.currentDevotion) {
        updatedDevotion = await this.devotionService.updateDevotion(this.currentDevotion.id, finalNote, finalImageUrl);
      } else {
        updatedDevotion = await this.devotionService.addDevotion(finalNote, finalImageUrl);
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
      this.isUploadingImage = false;
    }
  }
}
