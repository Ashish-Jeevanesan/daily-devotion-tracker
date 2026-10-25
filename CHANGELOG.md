# Changelog

All notable changes to Devotion Tracker are documented here. Loosely follows Keep a Changelog and Semantic Versioning.

## [Unreleased] - 2026-10-25

### Added
- **Selectable Bible translations**, fetched from [wldeh/bible-api](https://github.com/wldeh/bible-api) via the jsDelivr CDN:
  - **English:** King James Version (KJV), World English Bible (WEB), American Standard Version (ASV) — switchable from a dropdown in the verse-preview card. (NKJV/ESV are not available — they are not open-licensed.)
  - **Indian languages:** Hindi IRV, Tamil Contemporary (OTCV), Odia IRV — shown per selected app language.
  - Verified book → localized-folder maps for every non-English version (`bible-version-books.ts`), validated against canonical chapter counts.
- **Earlier Devotions pagination** — the history now loads 10 entries at a time behind a "Show more" control instead of rendering everything at once.
- **Unsaved-changes guard** on the Add/Edit Devotion dialog — closing via Escape, backdrop, or Cancel confirms before discarding edits.
- `CODING_STANDARDS.md` and this `CHANGELOG.md`.

### Changed
- **Verse source migrated to wldeh/bible-api.** Verse text is de-duplicated and cleaned of translator footnote/pilcrow artifacts; the preview badge now reflects the chosen translation instead of a hard-coded "KJV".
- **Canonical scripture in every language.** The hardcoded home verse and the four "encouragement" verses now use the actual Bible-translation wording (IRV Hindi/Odia, Tamil Contemporary) instead of paraphrases translated from English.
- **One devotion per day** — saving when today's entry already exists now updates it rather than creating a duplicate.
- Headings now load **Cormorant Garamond** and body text uses **Inter** (both were previously declared but not loaded/applied).
- Desktop dialogs get rounded corners; Home content is width-capped and centered on wide screens; the dialog's mobile breakpoint is aligned to 600px.

### Fixed
- **Today's devotion no longer fails to load** when more than one entry exists for the day (previously a `PGRST116` error left the panel stuck on the empty state).
- Mobile "Save" bar no longer overflows the viewport (box-sizing fix).
- Dialog now reports `aria-modal="true"`; the Book autocomplete no longer auto-opens on dialog launch; chapter/verse selects expose clearer accessible names.

### Accessibility
- `aria-modal`, accessible names for the compact verse selects, and focus/escape behavior verified on the devotion dialog.

## 2026-09-14

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
