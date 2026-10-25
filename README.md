# Devotion Tracker

A web application for church members to track their daily devotions, including prayer and bible reading.

## Features

- Email & Password Authentication (Sign Up, Sign In)
- User Profiles (Name, Age)
- Incomplete profile auto-redirect applies to members, but admins are exempt
- Access-rule based feature authorization via `access_rules` and `profile_access_rules`
- Daily Check-ins for Prayer and Bible Reading
- Visual Progress Calendar with Daily Status
- Detailed Devotion Note Entry with live scripture preview
- Selectable Bible translations per language (English: KJV / WEB / ASV; Hindi / Tamil / Odia versions) sourced from [wldeh/bible-api](https://github.com/wldeh/bible-api)
- Canonical, language-accurate verse text (home verse and encouragements use real Bible-translation wording)
- History of Past Devotions with incremental "Show more" loading
- Profile Center with mobile-friendly section navigation
- Profile report frequency selection (`WEEKLY` / `MONTHLY`) stored in `profiles.report_preference`
- Profile notification settings for browser reminders (`notification_enabled`, timezone)
- Profile Center access-management screen for assigning access rules
- Admin Reports dashboard gated by `admin_reports` access instead of profile role
- Progress calendar user-switching gated by `calender_admin_view`
- Supabase Edge Function integration for monthly report execution
- Angular service worker + per-browser push subscription registration for notification Phase 1
- Multilanguage support — English, Hindi (हिन्दी), Odia (ଓଡ଼ିଆ), Tamil (தமிழ்) — with a per-user language preference stored in `profiles.language`
- In-app language switcher (globe menu on desktop, overflow menu on mobile)
- Mobile-optimized UI — bottom navigation, floating add button, full-screen devotion entry, segmented daily check-ins
- Favicon-based blue brand theme with light & dark mode
- Secure Backend with Supabase

## Tech Stack

- **Frontend:** Angular 19, Angular Material (M3), ngx-translate (i18n), angular-calendar, ngx-charts
- **Backend:** Supabase (Authentication & PostgreSQL Database)
- **Scripture:** [wldeh/bible-api](https://github.com/wldeh/bible-api) (public-domain / open-license translations) served via the jsDelivr CDN

## Internationalization

The application supports multiple languages, with UI strings localized and managed inside JSON files located in `public/i18n/<lang>.json` (`en`, `hi`, `or`, `ta`).
- The default/fallback language is **English**.
- Each user's language preference is persisted in `profiles.language` on Supabase, and is applied automatically upon login.

## Bible Versions

Scripture text is fetched on demand from [wldeh/bible-api](https://github.com/wldeh/bible-api) through the jsDelivr CDN (no API key required).

- The version registry lives in `src/app/data/bible-versions.ts`; localized book-folder maps for non-English versions live in `src/app/data/bible-version-books.ts`.
- **English** offers King James Version (KJV), World English Bible (WEB), and American Standard Version (ASV), chosen from a dropdown in the verse-preview card. NKJV and ESV are not offered because they are not open-licensed.
- **Hindi, Tamil, and Odia** each use their respective open translation (IRV Hindi, Tamil Contemporary, IRV Odia); additional per-language versions can be added to the registry once their book-folder maps are verified.
- Only public-domain / open-license translations are available through this source.

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- [Node.js and npm](https://nodejs.org/en/)
- [Angular CLI](https://angular.dev/tools/cli): `npm install -g @angular/cli`

### Installation and Setup

1.  **Clone the repository**
    ```bash
    git clone <repository-url>
    cd DevotionTracker
    ```

2.  **Set up Supabase**
    - Go to [supabase.com](https://supabase.com), create a new project.
    - In your Supabase project dashboard, go to **Settings > API**.
    - Find your **Project URL** and `anon` **public** key.
    - Update the `src/app/environments/environment.ts` file with your URL and key.
    - Go to the **SQL Editor** in your Supabase dashboard.
    - Copy the entire content of `schema.sql` from the project root and run it to create your database tables and policies.
    - Seed `profile_access_rules` for users who should receive feature access such as `admin_reports`, `run_user_report_job`, `calender_admin_view`, or `map_user_access`.
    - For notification Phase 1, also provide a browser push VAPID public key to the frontend (`NG_APP_VAPID_PUBLIC_KEY` in production, `environment.ts` for local development).
    - **(Optional for Testing)** To allow users to sign in immediately after signing up, you can disable email confirmation. Go to **Authentication > Providers** and turn off "Confirm email".
    - If you deploy the monthly report edge function, keep gateway JWT verification off and use the function's custom auth/access check logic.

3.  **Install Dependencies**
    ```bash
    npm install
    ```

4.  **Run the Development Server**
    ```bash
    npm start
    ```
    The application will be available at `http://localhost:4200/`.

## Build for Production

To create a production-ready build of the application, run:

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.