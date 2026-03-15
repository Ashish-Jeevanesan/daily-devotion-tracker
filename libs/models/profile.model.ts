export interface Profile {
  id: string;
  full_name: string;
  age?: number;
  username?: string;
  role?: 'admin' | 'member';
}
