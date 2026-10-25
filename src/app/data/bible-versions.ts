/** A selectable Bible translation, keyed by its wldeh/bible-api version id. */
export interface BibleVersion {
  /** wldeh/bible-api version id, e.g. "en-kjv" — used in the CDN path. */
  id: string;
  /** Full display name, e.g. "King James Version". */
  label: string;
  /** Short badge shown next to the reference, e.g. "KJV". */
  abbrev: string;
}

/** Available versions per app language code (en/hi/or/ta). Only public-domain /
 *  open-license translations exist in wldeh (no NKJV/ESV). */
export const BIBLE_VERSIONS: { [lang: string]: BibleVersion[] } = {
  en: [
    { id: 'en-kjv', label: 'King James Version', abbrev: 'KJV' },
    { id: 'en-web', label: 'World English Bible', abbrev: 'WEB' },
    { id: 'en-asv', label: 'American Standard Version', abbrev: 'ASV' }
  ],
  hi: [
    { id: 'hi-IN-irvhin', label: 'Indian Revised Version (Hindi)', abbrev: 'IRV' }
  ],
  ta: [
    { id: 'ta-IN-otcv', label: 'Tamil Contemporary Version', abbrev: 'OTCV' }
  ],
  or: [
    { id: 'ory-irvory', label: 'Indian Revised Version (Odia)', abbrev: 'IRV' }
  ]
};

/** The default version id for each language (used until the user picks another). */
export const DEFAULT_VERSION: { [lang: string]: string } = {
  en: 'en-kjv',
  hi: 'hi-IN-irvhin',
  ta: 'ta-IN-otcv',
  or: 'ory-irvory'
};

/** Return the versions available for a language, falling back to English. */
export function versionsForLang(lang: string): BibleVersion[] {
  return BIBLE_VERSIONS[lang] || BIBLE_VERSIONS['en'];
}

/** Return the default version id for a language, falling back to KJV. */
export function defaultVersionForLang(lang: string): string {
  return DEFAULT_VERSION[lang] || 'en-kjv';
}
