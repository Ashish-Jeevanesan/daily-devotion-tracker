# Devotion Tracker — Coding Standards (for implementation agents)

This file is the contract for anyone (human or AI) changing this codebase. Read it
before every task. Orion maintains it; Juno implements against it. Keep changes
**minimal, scoped, and root-cause** — never broad rewrites.

## 0. Golden rules
1. **Do exactly one task per request.** Do not touch files or lines outside the task scope.
2. **Root cause, not patch.** Fix where the problem originates; avoid `!important` and
   `::ng-deep` unless there is no alternative (Material internals).
3. **Preserve behavior and architecture.** No new dependencies, no framework upgrades,
   no reformatting of untouched code, no renaming.
4. **After every change, the build must pass:** `npm run build` (from `DevotionTracker/`).
   Report the exact result.
5. **Report the diff you made** (files + a short summary per file). Do not claim success
   without building.

## 1. Project shape
- **Framework:** Angular 19, standalone components, signals where already used.
- **UI:** Angular Material (M3 theme in `src/styles.scss`), warm devotional palette via
  CSS variables on `:root` / `body.dark-theme`.
- **Backend:** Supabase (`src/app/services/*.service.ts`). Never put keys in code.
- **i18n:** `@ngx-translate`. All user-facing strings go through `translate` — never
  hardcode display text; add keys to the translation JSON files if a new string is needed.
- **App code lives under** `DevotionTracker/src/app/`. The working dir for commands is
  `DevotionTracker/`.

## 2. Styling rules
- **Design tokens only.** Use the CSS variables in `src/styles.scss` (`--primary-color`,
  `--text-color`, `--bg-color`, `--card-bg`, `--border-color`, `--background-alt`, etc.).
  Do not hardcode hex colors in component SCSS.
- **Fonts:** headings = the theme brand family (Lora / Cormorant Garamond, serif);
  body = Inter. Fonts are loaded in `src/index.html`. If you reference a font family in
  CSS, it MUST be loaded in `index.html` first.
- **Box model:** any element with `width: 100%` **and** padding/border must also set
  `box-sizing: border-box`.
- **Responsive breakpoint is 600/601px** for mobile vs desktop (see the `@media` blocks
  and `.mobile-only` / `.desktop-only` classes). Any new JS width check must use the
  **same** boundary (`<= 600` = mobile) to stay consistent.
- **No horizontal overflow** at 390px, 768px, or 1440px. Fixed/sticky bars must not
  exceed the viewport width.

## 3. TypeScript / Angular rules
- Keep existing method signatures and public APIs unless the task is to change them.
- Services return `null`/`[]` on error and `console.error` the Supabase `error` — follow
  the existing pattern in `devotion.service.ts`.
- Prefer narrow, well-named private helpers over inlined complexity.
- Do not remove existing JSDoc `/** ... */` comments; update them if behavior changes.

## 4. Accessibility
- Interactive controls need an accessible name (visible label or `aria-label`).
- Modals: background inert/`aria-hidden`, focus trapped, focus restored on close, Escape
  closes. Do not regress these.
- Maintain ≥44px touch targets for primary actions.

## 5. Data integrity (devotions)
- **One devotion per user per calendar day.** Creating a devotion when one already exists
  for today must **update** the existing row, not insert a second.
- Reads for "today" must tolerate legacy duplicate rows (never throw): order by
  `created_at desc` and take the most recent.

## 5a. Editing discipline (avoid fuzzy-match damage)
- Match the EXACT text given in the task. Do not add/remove logic branches, guard
  clauses, or `else if` cases that were not requested, and do not reword JSDoc or
  comments outside the specified change.
- If your edit tool fuzzy-matches and alters an ADJACENT method/line, **stop and report
  it** — do not "fix" it by rewriting the method from memory. Re-read the file and apply
  a precise, minimal edit instead.
- When done, re-read the changed region and confirm ONLY the intended lines differ.
- Example of a real mistake to avoid: while adding a config property to `dialog.open()`,
  do not also add an `else if (x === null)` branch to the `afterClosed()` handler.

## 6. Definition of done (per task)
- [ ] Only the intended files changed.
- [ ] Design tokens / fonts / box-sizing / breakpoint rules above respected.
- [ ] `npm run build` passes (paste the tail of the output).
- [ ] Short report: files touched + what changed + why.
- [ ] No unrelated reformatting or scope creep.
