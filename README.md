# Devotion Tracker

A web application for church members to track their daily devotions, including prayer and bible reading.

## Features

- Email & Password Authentication (Sign Up, Sign In)
- User Profiles (Name, Age)
- Incomplete profile auto-redirect applies to members, but admins are exempt
- Access-rule based feature authorization via `access_rules` and `profile_access_rules`
- Daily Check-ins for Prayer and Bible Reading
- Visual Progress Calendar with Daily Status
- Detailed Devotion Note Entry
- History of Past Devotions
- Profile Center with mobile-friendly section navigation
- Profile report frequency selection (`WEEKLY` / `MONTHLY`) stored in `profiles.report_preference`
- Profile notification settings for browser reminders (`notification_enabled`, timezone)
- Profile Center access-management screen for assigning access rules
- Admin Reports dashboard gated by `admin_reports` access instead of profile role
- Progress calendar user-switching gated by `calender_admin_view`
- Supabase Edge Function integration for monthly report execution
- Angular service worker + per-browser push subscription registration for notification Phase 1
- Dark Mode Support
- Secure Backend with Supabase

## Tech Stack

- **Frontend:** Angular, Angular Material
- **Backend:** Supabase (Authentication & PostgreSQL Database)

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
