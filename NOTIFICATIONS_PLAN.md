# Notification System Plan

## Objective
Implement browser push notifications for devotion reminders in a way that works reliably with this Angular + Supabase web app.

## What This Means In Practice

For this project, notifications will be delivered through the browser, which means:

- On desktop Chrome, notifications appear as Chrome/system notifications.
- On Android Chrome, notifications can appear similarly to app push notifications.
- Notification permission is required per browser/device.
- The app must be served over HTTPS in production.
- A service worker is required.
- Push will not work just because the user logged in once. The browser must explicitly subscribe.

This should be treated as:

- Phase 1 target: desktop Chrome and Android Chrome
- Non-goal for first release: full parity on all iPhone/mobile browser combinations

## Current Project Constraints

- Frontend is Angular.
- Backend is Supabase.
- The app already uses Supabase Edge Functions.
- The app already has profile data and access-controlled features.
- The app already has a custom in-app notification popup, but that is different from browser push.

## Recommended Architecture

### 1. Notification Preferences

Store user-level reminder preferences on `profiles`:

- `notification_enabled boolean not null default false`
- `notification_time time null`
- `notification_timezone text null`

Notes:

- `notification_timezone` is required for correct reminder timing.
- Do not rely on server timezone for reminder scheduling.
- If timezone is missing, reminders should not be sent until it is captured.

### 2. Push Subscription Storage

Do not store a single `push_subscription` JSON object on `profiles`.

Use a dedicated table instead, for example `push_subscriptions`:

- `id uuid primary key default gen_random_uuid()`
- `user_id uuid not null references auth.users(id) on delete cascade`
- `endpoint text not null`
- `p256dh_key text not null`
- `auth_key text not null`
- `user_agent text null`
- `device_label text null`
- `created_at timestamptz not null default now()`
- `last_seen_at timestamptz not null default now()`
- `void_fl timestamptz null`

Why:

- users may enable notifications on multiple devices
- browser subscriptions can expire or change
- dead subscriptions need to be voided without losing history

### 3. Reminder Execution

Use a Supabase Edge Function triggered by cron:

- function name example: `send-reminders`
- schedule example: every 15 minutes

The function should:

1. find users with `notification_enabled = true`
2. find active subscriptions for those users
3. compare current UTC time against each user's `notification_time` and `notification_timezone`
4. check whether a reminder was already sent in the current reminder window
5. check whether the user already completed devotion/check-in for that day
6. send push payload only when needed

### 4. Delivery Logging

Add a delivery table, for example `notification_log`:

- `id uuid primary key default gen_random_uuid()`
- `user_id uuid not null`
- `subscription_id uuid null`
- `notification_type text not null`
- `scheduled_for timestamptz not null`
- `sent_at timestamptz null`
- `status text not null`
- `error_message text null`
- `created_at timestamptz not null default now()`

Purpose:

- prevent duplicate reminders
- track failures
- support debugging and analytics

### 5. Subscription Lifecycle

The system must handle invalid subscriptions.

When the push provider returns a permanent failure such as expired or gone:

- mark the matching `push_subscriptions` row with `void_fl`
- stop trying to send to it

The frontend should also periodically refresh the subscription record by updating `last_seen_at`.

## Frontend Implementation Plan

### 1. Enable PWA / Service Worker

Add Angular PWA support:

```bash
ng add @angular/pwa
```

This gives the app a service worker, which is required for browser push.

### 2. Add Notification Settings To Profile Center

In the profile form, add fields for:

- enable notifications
- preferred reminder time
- timezone

Behavior:

- if the user enables notifications, request browser permission
- if permission is denied, keep `notification_enabled = false`
- if permission is granted, create/update a push subscription

### 3. Register Browser Push Subscription

Frontend flow:

1. call `Notification.requestPermission()`
2. use Angular `SwPush` to subscribe
3. save the subscription details to `push_subscriptions`

The frontend should:

- create one row per active browser/device
- update existing subscription row if endpoint already exists

### 4. Add Device Resync Logic

When the user logs in and notifications are enabled:

- check whether a current subscription exists in the browser
- upsert it into `push_subscriptions`
- update `last_seen_at`

## Backend Implementation Plan

### 1. Edge Function Responsibilities

The reminder function should:

- run on a schedule
- determine eligible users by timezone-aware time matching
- skip users who already completed the expected devotion activity
- skip users already notified in the same time window
- send web push payloads
- write success/failure to `notification_log`

### 2. Timezone Handling

Timezone must be explicit.

Recommended rule:

- store timezone as an IANA string, for example `Asia/Kolkata`
- convert current UTC time into the user timezone
- compare local time to `notification_time`

Without this, reminders will fire at the wrong hour.

### 3. Reminder Types

Start with one simple reminder type:

- daily devotion reminder

Later add:

- missed devotion reminder
- weekly encouragement summary

Do not implement multiple reminder types in the first pass unless needed.

## Security And RLS

### Profiles

Users should only manage their own notification preferences.

### Push Subscriptions

Recommended rules:

- users can insert/update/select only their own subscriptions
- admins do not need broad subscription access unless explicitly required

### Notification Log

Recommended rules:

- users may read only their own log entries if the UI needs it
- write access should come only from privileged backend code

## Delivery Caveats

This is important for expectations:

- browser push is per device/browser
- clearing site data can remove the subscription
- denying permission blocks delivery entirely
- Chrome support is good; iPhone/browser behavior is more limited
- notifications may be throttled by the browser or OS in some cases

## Recommended Scope For First Release

### Phase 1

- desktop Chrome support
- Android Chrome support
- one daily reminder type
- profile settings for enable/time/timezone
- push subscription table
- cron-driven edge function
- delivery log

### Phase 2

- missed devotion reminders
- multi-device management UI
- notification history UI
- retry handling and analytics

## Execution To-Do

### Database

1. Add `notification_enabled`, `notification_time`, and `notification_timezone` to `profiles`.
2. Create `push_subscriptions` table.
3. Create `notification_log` table.
4. Add RLS policies for `push_subscriptions`.
5. Add RLS policies for `notification_log`.

### Frontend

1. Enable Angular PWA/service worker support.
2. Add notification settings to Profile Center.
3. Request browser notification permission when notifications are enabled.
4. Register browser push subscription using `SwPush`.
5. Upsert subscription into `push_subscriptions`.
6. Add login-time subscription resync logic.
7. Add error handling for denied permission and expired subscriptions.

### Backend

1. Create `send-reminders` edge function.
2. Add timezone-aware reminder selection logic.
3. Add devotion/check-in completion check before sending.
4. Add duplicate-send protection using `notification_log`.
5. Add push delivery handling and error logging.
6. Void dead subscriptions on permanent delivery failure.
7. Add cron schedule for the reminder function.

### Testing

1. Test permission flow in desktop Chrome.
2. Test subscription creation and DB persistence.
3. Test scheduled reminder delivery to an active subscription.
4. Test duplicate prevention in the same reminder window.
5. Test dead subscription cleanup.
6. Test Android Chrome behavior separately.

## Recommendation

Proceed with browser push notifications, but implement them as a proper multi-device subscription system with timezone-aware scheduling and delivery logging.

Do not use a single `push_subscription` field on `profiles` for production.
