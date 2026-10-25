# Changelog

All notable changes to Devotion Tracker are documented here. Loosely follows Keep a Changelog and Semantic Versioning.

## [Unreleased] - 2026-09-14

### Added
- **Multilanguage support (i18n)** across all screens via `@ngx-translate/core`: English, Hindi (हिन्दी), Odia (ଓଡ଼ିଆ), Tamil (தமிழ்). Translation files in `public/i18n/{en,hi,or,ta}.json`.
- **Per-user language preference** persisted in Supabase (`profiles.language`, default `en`): applied on login, saved on change, with a language dropdown on the Profile page.
- **In-app language switcher** — globe-icon menu on desktop, 3-dot overflow menu on mobile — with native-script labels.
- Locale-aware date pipes, progress calendar (`angular-calendar`), and report charts (`ngx-charts`).
- **Header logo** using the app favicon next to the "Devotion Tracker" wordmark.
- **Mobile bottom navigation bar** (Home / Progress / Profile / Admin) and a top-right overflow menu for language, theme, and sign-out.
- **Sticky "+" floating action button** to add a devotion on mobile.
- **Camera capture** ("Take Photo") in the devotion photo upload, alongside gallery selection.

### Changed
- **Rebranded theme** to match the app favicon: blue primary (`#2F62E6` light / `#6BA0F5` dark), warm cream background, gold accent, serif headings (Lora) with Inter body.
- Migrated theming to the **Angular Material M3 API** (`mat.define-theme`).
- **Daily check-in** now uses segmented pill toggles instead of radio buttons.
- **Devotion cards** unified into one consistent layout; single-column on mobile with long notes truncated behind a "Read more" action.
- **Add Devotion dialog** is full-screen on mobile with a top bar, auto-growing notes field, and a sticky Save button.
- Toolbar/header actions cleaned up and consistently right-aligned with tooltips.

### Fixed
- Devotion card pluralization ("X days missed") no longer shows raw template text.
- Book autocomplete in the Add Devotion dialog now selects, displays the chosen book, and closes the panel.
- Verse auto-preview (KJV) loads for the selected reference.
- Mobile viewport no longer shifts horizontally when opening the chapter/verse selects.
- Add Devotion dialog no longer clips the Book field under the header or the notes/upload below the sticky Save on mobile.
- Restored `angular-calendar` styles on the Progress page; fixed an undefined CSS variable.

### Database
- Added a `language` column to the `profiles` table (default `en`); included in `schema.sql`.
