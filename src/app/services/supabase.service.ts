import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  public supabase: SupabaseClient;
  loggedIn = false;

   constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey,
      {
        auth: {
          storage: window.localStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true
        },
      }
    );
    this.supabase.auth.onAuthStateChange((_event, session) =>{
      this.loggedIn = !!session;
    })
  }

isLoggedIn(){
  return this.loggedIn;
}

}


