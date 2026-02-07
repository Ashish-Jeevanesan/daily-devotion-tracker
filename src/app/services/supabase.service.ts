import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
/** Initializes the Supabase client and tracks auth state. */
export class SupabaseService {
  public supabase: SupabaseClient;
  loggedIn = false;

   /** Create the Supabase client and subscribe to auth changes. */
   constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey,
      {
        auth: {
          storage: window.localStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          lock: async (_name, _acquireTimeout, fn) => await fn()
        },
      }
    );
    this.supabase.auth.onAuthStateChange((_event, session) =>{
      this.loggedIn = !!session;
    })
  }

/** Simple boolean flag for auth state used by the shell. */
isLoggedIn(){
  return this.loggedIn;
}

}
