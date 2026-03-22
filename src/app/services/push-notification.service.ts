import { Injectable } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';

interface PushSubscriptionPayload {
  auth_key: string;
  endpoint: string;
  p256dh_key: string;
  user_agent: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class PushNotificationService {
  private lastSyncedEndpoint: string | null = null;
  private lastSyncedUserId: string | null = null;

  constructor(
    private readonly authService: AuthService,
    private readonly supabaseService: SupabaseService,
    private readonly swPush: SwPush
  ) {}

  getBrowserTimezone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  }

  isSupported(): boolean {
    return typeof window !== 'undefined'
      && 'Notification' in window
      && 'serviceWorker' in navigator
      && this.swPush.isEnabled;
  }

  isConfigured(): boolean {
    return !!environment.vapidPublicKey?.trim();
  }

  async getCurrentPermission(): Promise<NotificationPermission | 'unsupported'> {
    if (!this.isSupported()) {
      return 'unsupported';
    }

    return Notification.permission;
  }

  async ensureSubscription(): Promise<PushSubscription> {
    if (!this.isSupported()) {
      throw new Error('Browser push notifications are not supported in this browser.');
    }

    if (!this.isConfigured()) {
      throw new Error('Push notifications are not configured yet. Add the VAPID public key first.');
    }

    if (Notification.permission === 'denied') {
      throw new Error('Browser notifications are blocked for this site. Enable them in the browser settings and try again.');
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission was not granted.');
    }

    const existingSubscription = await this.getExistingSubscription();
    if (existingSubscription) {
      return existingSubscription;
    }

    return this.swPush.requestSubscription({
      serverPublicKey: environment.vapidPublicKey
    });
  }

  async upsertSubscription(subscription: PushSubscription): Promise<void> {
    const user = this.authService.currentUser();
    if (!user) {
      throw new Error('You must be signed in to register browser notifications.');
    }

    const payload = this.toPayload(subscription);
    const { error } = await this.supabaseService.supabase
      .from('push_subscriptions')
      .upsert({
        user_id: user.id,
        ...payload,
        last_seen_at: new Date().toISOString(),
        void_fl: null
      }, {
        onConflict: 'endpoint'
      });

    if (error) {
      throw new Error(error.message);
    }

    this.lastSyncedEndpoint = payload.endpoint;
    this.lastSyncedUserId = user.id;
  }

  async disableCurrentBrowserSubscription(): Promise<void> {
    const user = this.authService.currentUser();
    if (!user) {
      return;
    }

    const subscription = await this.getExistingSubscription();
    if (subscription) {
      const payload = this.toPayload(subscription);
      const { error } = await this.supabaseService.supabase
        .from('push_subscriptions')
        .update({
          void_fl: new Date().toISOString(),
          last_seen_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('endpoint', payload.endpoint)
        .is('void_fl', null);

      if (error) {
        throw new Error(error.message);
      }

      await subscription.unsubscribe();
    }

    this.lastSyncedEndpoint = null;
    this.lastSyncedUserId = null;
  }

  async syncCurrentBrowserSubscription(): Promise<void> {
    const user = this.authService.currentUser();
    if (!user || !this.isSupported() || !this.isConfigured()) {
      return;
    }

    if (Notification.permission !== 'granted') {
      return;
    }

    const subscription = await this.getExistingSubscription();
    if (!subscription) {
      return;
    }

    const payload = this.toPayload(subscription);
    if (this.lastSyncedUserId === user.id && this.lastSyncedEndpoint === payload.endpoint) {
      return;
    }

    await this.upsertSubscription(subscription);
  }

  private async getExistingSubscription(): Promise<PushSubscription | null> {
    if (!this.isSupported()) {
      return null;
    }

    const registration = await navigator.serviceWorker.ready;
    return registration.pushManager.getSubscription();
  }

  private toPayload(subscription: PushSubscription): PushSubscriptionPayload {
    const subscriptionJson = subscription.toJSON();
    const p256dhKey = subscriptionJson.keys?.['p256dh'];
    const authKey = subscriptionJson.keys?.['auth'];

    if (!subscription.endpoint || !p256dhKey || !authKey) {
      throw new Error('The browser did not return a complete push subscription.');
    }

    return {
      endpoint: subscription.endpoint,
      p256dh_key: p256dhKey,
      auth_key: authKey,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null
    };
  }
}
