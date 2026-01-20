# Notification System Plan

## Objective
Implement a notification system to remind users to read their bible and pray.

## Features
1.  **Daily Reminders:** Configurable time for daily reminders.
2.  **Missed Devotion Alerts:** Notify user if they haven't checked in by a certain time.
3.  **In-App Notifications:** Toast/Snackbar notifications for actions (already partially implemented).
4.  **Push Notifications:** Browser push notifications (PWA) for reminders even when the app is closed.

## Technical Approach

### 1. PWA & Service Workers
-   Enable PWA support in Angular (`@angular/service-worker`).
-   Use `SwPush` service to subscribe to push notifications.
-   Service Worker handles incoming push events.

### 2. Backend (Supabase)
-   **Triggering Notifications:**
    -   Use Supabase Edge Functions to run a cron job (e.g., every hour).
    -   Check users who have enabled notifications and haven't checked in.
    -   Send push payload via a provider (e.g., VAPID keys directly or FCM/OneSignal).
    -   Since Supabase Edge Functions are Deno-based, we can use `web-push` library.

### 3. User Preferences
-   Store notification settings in `profiles` table:
    -   `notification_enabled` (boolean)
    -   `notification_time` (time)
    -   `push_subscription` (jsonb) - to store the endpoint and keys.

## Implementation Steps
1.  **Add PWA:** `ng add @angular/pwa`
2.  **Update Profile Schema:** Add columns for notification preferences.
3.  **Frontend Logic:**
    -   Request permission (`Notification.requestPermission()`).
    -   Get subscription token (`SwPush.requestSubscription()`).
    -   Save subscription to Supabase `profiles`.
4.  **Backend Logic (Edge Function):**
    -   Create a function `send-reminders`.
    -   Query users with `notification_enabled = true` and `notification_time` matching current time window.
    -   Send push notification.
5.  **Testing:** Test on real devices/browsers supporting Push API.

## Alternatives
-   **Email Reminders:** Easier to implement via Supabase Auth emails or SMTP, but less "real-time" and potentially annoying.
-   **Local Notifications:** Only work if the tab is open (using `setTimeout` or `setInterval`). Not reliable for "reminders".

## Recommendation
Proceed with **PWA Push Notifications** via Supabase Edge Functions.