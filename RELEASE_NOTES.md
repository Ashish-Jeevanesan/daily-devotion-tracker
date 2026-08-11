# Release Notes — Devotion Tracker

---

## v1.2.0 — June 2026

### New Features

**Inline Bible Verse Preview**
When a scripture reference is selected in the devotion entry dialog, the corresponding KJV verse text is fetched and displayed inline below the selector as a scrollable italic card. No API key required; powered by bible-api.com.
- Mobile devices: preview shown for ranges up to 20 verses; a hint is shown beyond that
- Desktop: no verse-count cap; card scrolls up to 320 px
- Results are cached per session so repeated selections are instant

**Smart Verse Dropdown Limits**
The V.Start and V.End dropdowns now adjust dynamically to show only the actual verse count for the selected chapter — no more scrolling past verse 176 for a chapter that has 31 verses.
- Verse counts are fetched from a Supabase cache table on first access
- On a cache miss the count is resolved from bible-api.com and saved to the database asynchronously, so future users benefit without any delay
- Audit fields (`added_by_user_id`, `added_by_username`) record the first user to populate each entry; subsequent cache hits preserve the original author

---

### Bug Fixes

**Verse-Only Devotion Saves (Critical)**
Previously, saving a devotion with a scripture reference but no notes text caused the verse reference to be stored but displayed and re-opened as plain notes text. The edit dialog would show the reference in the notes textarea and leave the Book/Chapter/V.Start/V.End dropdowns empty.

Fixed across all four rendering points:

| Component | Change |
|---|---|
| `devotion-entry-dialog` | Constructor now detects verse-only strings and populates dropdowns correctly on re-open |
| `todays-devotion` | `bibleVerse()` and `devotionNotes()` computed signals handle the no-separator case |
| `earlier-devotions` | `getVerseReference()` and `getNotesContent()` handle the no-separator case |
| `devotion-detail-dialog` | Constructor parsing gets an `else if` branch for verse-only entries |

**Root cause:** The stored format for a verse+notes entry is `"John 3:16 - reflection"`. For verse-only entries the format is `"John 3:16"` (no separator). All parsing code previously required the ` - ` separator to identify a verse reference; without it, the entire string fell through as notes text.

**Fix approach:** A `refOnlyPattern` regex detects strings composed entirely of one or more Bible references (e.g. `"Genesis 3:5-19, Romans 6:23"`) and routes them to the reference parser, setting notes content to empty.

**Sticky Label Scroll Overlay**
The "Book · KJV" label inside the verse preview card was overlaying verse text when scrolling because `background: inherit` resolved to a semi-transparent value. Fixed by applying an explicit `color-mix(in srgb, var(--primary-color) 7%, var(--card-bg))` opaque background on both the card and the sticky label.

---

### Notes

- All changes are backward-compatible with existing devotion records
- No database migrations required (the `bible_verse_counts` table should be created once with the schema described in the project docs)
- Translation support (Tamil, Hindi) remains deferred — no free no-auth API currently provides these translations

---

## v1.1.0 — Prior Release

- Verse-only saves allowed (removed mandatory notes field)
- Progressive Web App (PWA) support
- Push notifications (VAPID)
- Admin analytics dashboard
- Progress calendar
- Church-scoped multi-tenant filtering
