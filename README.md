# Devotion Tracker

A web application for church members to track their daily devotions, including prayer and bible reading.

## Features

- Email & Password Authentication (Sign Up, Sign In)
- User Profiles (Name, Age)
- Daily Check-ins for Prayer and Bible Reading
- Detailed Devotion Note Entry
- History of Past Devotions
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
    - **(Optional for Testing)** To allow users to sign in immediately after signing up, you can disable email confirmation. Go to **Authentication > Providers** and turn off "Confirm email".

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