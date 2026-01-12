# Project Summary: Devotion Tracker

This document provides a comprehensive overview of the Devotion Tracker application, including its features, technology stack, and setup instructions.

## 1. Project Overview

The Devotion Tracker is a web application designed for church members to record their daily personal devotions. It serves as a common platform to track prayer and bible reading habits, and to log personal notes and reflections.

## 2. Features

- **Authentication:** Users can create an account and sign in using their email and password.
- **User Profiles:** After signing up, users are prompted to complete their profile with their full name and age.
- **Daily Check-in:** A simple daily questionnaire on the home page asks users:
  - "Did you pray today?" (Yes/No)
  - "Did you read the bible today?" (Yes/No)
- **Conditional Devotion Notes:** The option to add detailed devotion notes only appears after the user confirms they have read the bible.
- **Focused Note Entry:** A dialog window provides a clean, focused interface for writing and saving devotion notes.
- **Devotion History:** The application displays a history of all past devotion notes, sorted by date.
- **Secure Backend:** All data is stored securely in a Supabase backend, with Row Level Security policies ensuring users can only access their own data.
- **Responsive UI:** The user interface is built with Angular Material to be responsive and work on both desktop and mobile browsers.

## 3. Technology Stack

- **Frontend:**
  - **Framework:** Angular
  - **UI Components:** Angular Material
- **Backend (BaaS):**
  - **Platform:** Supabase
  - **Services:** Authentication, PostgreSQL Database

## 4. Database Schema

The application uses three main tables in the Supabase database. The complete SQL for creating these tables and their security policies is in the `schema.sql` file.

- **`profiles`**: Stores public user information.
  - `id` (references `auth.users`)
  - `full_name`
  - `age`
  - `username`
- **`daily_check_ins`**: Stores the answers to the daily prayer/bible questions.
  - `id`
  - `user_id`
  - `date`
  - `prayed` (boolean)
  - `read_bible` (boolean)
- **`devotions`**: Stores the detailed notes from bible reading.
  - `id`
  - `user_id`
  - `created_at`
  - `notes`

## 5. Getting Started

### Prerequisites

- Node.js and npm
- Angular CLI (`npm install -g @angular/cli`)

### Supabase Setup

1.  **Create a Supabase Project:** Go to [supabase.com](https://supabase.com) and create a new project.
2.  **Get Credentials:** In your Supabase project dashboard, navigate to **Settings > API**. Find your **Project URL** and `anon` **public** key.
3.  **Update Environment File:** In the Angular project, find the `src/app/environments/environment.ts` file and update it with your Supabase credentials.
4.  **Run SQL Schema:** Navigate to the **SQL Editor** in your Supabase project dashboard. Copy the entire content of the `schema.sql` file from the project root and run it to create the tables and security policies.
5.  **Disable Email Confirmation (for testing):** Go to **Authentication > Providers** and disable the "Confirm email" setting if you want to sign up users without needing them to confirm their email address.

### Local Development

1.  **Install Dependencies:** Open a terminal in the project root (`DevotionTracker`) and run:
    ```bash
    npm install
    ```
2.  **Run the Application:** Run the following command to start the development server:
    ```bash
    npm start
    ```
3.  **Open in Browser:** Navigate to `http://localhost:4200`.

