export interface BibleBook {
  id: number;
  name: string;
  chapters: number;
  testament: 'OT' | 'NT';
}
