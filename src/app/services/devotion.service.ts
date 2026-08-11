import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

export interface Devotion {
  id: string;
  created_at: string;
  notes: string;
  image_url?: string | null;
}

@Injectable({
  providedIn: 'root'
})
/** CRUD service for devotion entries. */
export class DevotionService {

  constructor(
    private supabaseService: SupabaseService,
    private authService: AuthService
  ) { }

  /** Fetch the user's devotion for today, if any. */
  async getTodaysDevotion(): Promise<Devotion | null> {
    const user = this.authService.currentUser();
    if (!user) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data, error } = await this.supabaseService.supabase
      .from('devotions')
      .select('*')
      .eq('user_id', user.id)
      .is('void_fl', null)
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString())
      .maybeSingle();

    if (error) {
      console.error('Error fetching today\'s devotion:', error);
      return null;
    }

    return data;
  }

  /** Fetch all devotions before today in descending order. */
  async getEarlierDevotions(): Promise<Devotion[]> {
    const user = this.authService.currentUser();
    if (!user) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await this.supabaseService.supabase
      .from('devotions')
      .select('*')
      .eq('user_id', user.id)
      .is('void_fl', null)
      .lt('created_at', today.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching earlier devotions:', error);
      return [];
    }

    return data || [];
  }

  /** Create a new devotion entry for the current user. */
  async addDevotion(notes: string, imageUrl?: string | null): Promise<Devotion | null> {
    const user = this.authService.currentUser();
    if (!user) return null;

    const insertData: { user_id: string; notes: string; image_url?: string | null } = {
      user_id: user.id,
      notes
    };
    if (imageUrl !== undefined) {
      insertData.image_url = imageUrl;
    }

    const { data, error } = await this.supabaseService.supabase
      .from('devotions')
      .insert([insertData])
      .select()
      .is('void_fl', null)
      .single();

    if (error) {
      console.error('Error adding devotion:', error);
      return null;
    }

    return data;
  }

  /** Update an existing devotion entry. */
  async updateDevotion(id: string, notes: string, imageUrl?: string | null): Promise<Devotion | null> {
    const updateData: { notes: string; image_url?: string | null } = { notes };
    if (imageUrl !== undefined) {
      updateData.image_url = imageUrl;
    }

    const { data, error } = await this.supabaseService.supabase
      .from('devotions')
      .update(updateData)
      .eq('id', id)
      .is('void_fl', null)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating devotion:', error);
      return null;
    }

    return data;
  }

  /** Compress image file using HTML5 canvas to max 1280px dimension and JPEG quality ~0.75 */
  async compressImage(file: File, maxDimension: number = 1280, quality: number = 0.75): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Canvas blob generation failed'));
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = (err) => {
        URL.revokeObjectURL(url);
        reject(err);
      };
      img.src = url;
    });
  }

  /** Upload compressed devotion image to user_devotions bucket */
  async uploadDevotionImage(file: File): Promise<string | null> {
    const user = this.authService.currentUser();
    if (!user) return null;

    try {
      const compressedBlob = await this.compressImage(file);
      const timeStamp = Date.now();
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `${user.id}/${timeStamp}_${cleanFileName}.jpg`;

      const { data, error } = await this.supabaseService.supabase
        .storage
        .from('user_devotions')
        .upload(filePath, compressedBlob, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (error) {
        console.error('Error uploading image to user_devotions bucket:', error);
        return null;
      }

      const { data: publicUrlData } = this.supabaseService.supabase
        .storage
        .from('user_devotions')
        .getPublicUrl(filePath);

      return publicUrlData.publicUrl;
    } catch (err) {
      console.error('Image compression or upload error:', err);
      return null;
    }
  }

  /** Delete devotion image from user_devotions bucket */
  async deleteDevotionImage(imageUrl: string): Promise<boolean> {
    if (!imageUrl) return false;
    try {
      const bucketName = 'user_devotions';
      const index = imageUrl.indexOf(`/${bucketName}/`);
      if (index === -1) return false;

      const filePath = imageUrl.substring(index + bucketName.length + 2);
      const { error } = await this.supabaseService.supabase
        .storage
        .from(bucketName)
        .remove([filePath]);

      if (error) {
        console.error('Error deleting image from storage:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Error deleting image:', err);
      return false;
    }
  }

  /** Fetch all devotions for the current user. */
  async getDevotions(): Promise<Devotion[]> {
    const user = this.authService.currentUser();
    if (!user) return [];

    return this.getDevotionsForUser(user.id);
  }

  /** Fetch all devotions for a specific user. */
  async getDevotionsForUser(userId: string): Promise<Devotion[]> {
    if (!userId) return [];

    const { data, error } = await this.supabaseService.supabase
      .from('devotions')
      .select('*')
      .eq('user_id', userId)
      .is('void_fl', null);

    if (error) {
      console.error('Error fetching devotions:', error);
      return [];
    }

    return data || [];
  }
}
