/**
 * Localized book-folder names for the wldeh/bible-api non-English versions.
 * Maps a canonical (English) book name -> { versionId -> wldeh folder name }.
 * English versions (en-*) are NOT listed here: their folder is computed as
 * bookName.toLowerCase().replace(/\s+/g, '') (e.g. "1 Samuel" -> "1samuel").
 *
 * Generated and verified against wldeh/bible-api: every entry's chapter count
 * matches the canonical chapter count for that book (0 mismatches).
 */
export const BIBLE_BOOK_FOLDERS: { [book: string]: { [versionId: string]: string } } = {
  "Genesis": { 'hi-IN-irvhin': 'उत्पत्ति', 'ta-IN-otcv': 'ஆதியாகமம்', 'ory-irvory': 'ଆଦିପୁସ୍ତକ' },
  "Exodus": { 'hi-IN-irvhin': 'निर्गमन', 'ta-IN-otcv': 'யாத்திராகமம்', 'ory-irvory': 'ଯାତ୍ରାପୁସ୍ତକ' },
  "Leviticus": { 'hi-IN-irvhin': 'लैव्यव्यवस्था', 'ta-IN-otcv': 'லேவியராகமம்', 'ory-irvory': 'ଲେବୀୟପୁସ୍ତକ' },
  "Numbers": { 'hi-IN-irvhin': 'गिनती', 'ta-IN-otcv': 'எண்ணாகமம்', 'ory-irvory': 'ଗଣନାପୁସ୍ତକ' },
  "Deuteronomy": { 'hi-IN-irvhin': 'व्यवस्थाविवरण', 'ta-IN-otcv': 'உபாகமம்', 'ory-irvory': 'ଦ୍ୱିତୀୟବିବରଣ' },
  "Joshua": { 'hi-IN-irvhin': 'यहोशू', 'ta-IN-otcv': 'யோசுவா', 'ory-irvory': 'ଯିହୋଶୂୟ' },
  "Judges": { 'hi-IN-irvhin': 'न्यायियों', 'ta-IN-otcv': 'நியாயாதிபதிகள்', 'ory-irvory': 'ବିଚାରକର୍ତ୍ତା' },
  "Ruth": { 'hi-IN-irvhin': 'रूत', 'ta-IN-otcv': 'ரூத்', 'ory-irvory': 'ରୂତ' },
  "1 Samuel": { 'hi-IN-irvhin': '1शमूएल', 'ta-IN-otcv': '1சாமுயேல்', 'ory-irvory': 'ପ୍ରଥମଶାମୁୟେଲ' },
  "2 Samuel": { 'hi-IN-irvhin': '2शमूएल', 'ta-IN-otcv': '2சாமுயேல்', 'ory-irvory': 'ଦ୍ୱିତୀୟଶାମୁୟେଲ' },
  "1 Kings": { 'hi-IN-irvhin': '1राजाओं', 'ta-IN-otcv': '1இராஜாக்கள்', 'ory-irvory': 'ପ୍ରଥମରାଜାବଳୀ' },
  "2 Kings": { 'hi-IN-irvhin': '2राजाओं', 'ta-IN-otcv': '2இராஜாக்கள்', 'ory-irvory': 'ଦ୍ୱିତୀୟରାଜାବଳୀ' },
  "1 Chronicles": { 'hi-IN-irvhin': '1इतिहास', 'ta-IN-otcv': '1நாளாகமம்', 'ory-irvory': 'ପ୍ରଥମବଂଶାବଳୀ' },
  "2 Chronicles": { 'hi-IN-irvhin': '2इतिहास', 'ta-IN-otcv': '2நாளாகமம்', 'ory-irvory': 'ଦ୍ବିତୀୟବଂଶାବଳୀ' },
  "Ezra": { 'hi-IN-irvhin': 'एज्रा', 'ta-IN-otcv': 'எஸ்றா', 'ory-irvory': 'ଏଜ୍ରା' },
  "Nehemiah": { 'hi-IN-irvhin': 'नहेम्याह', 'ta-IN-otcv': 'நெகேமியா', 'ory-irvory': 'ନିହିମୀୟା' },
  "Esther": { 'hi-IN-irvhin': 'एस्तेर', 'ta-IN-otcv': 'எஸ்தர்', 'ory-irvory': 'ଏଷ୍ଟର' },
  "Job": { 'hi-IN-irvhin': 'अय्यूब', 'ta-IN-otcv': 'யோபு', 'ory-irvory': 'ଆୟୁବ' },
  "Psalms": { 'hi-IN-irvhin': 'भजनसंहिता', 'ta-IN-otcv': 'சங்கீதம்', 'ory-irvory': 'ଗୀତସଂହିତା' },
  "Proverbs": { 'hi-IN-irvhin': 'नीतिवचन', 'ta-IN-otcv': 'நீதிமொழி', 'ory-irvory': 'ହିତୋପଦେଶ' },
  "Ecclesiastes": { 'hi-IN-irvhin': 'सभोपदेशक', 'ta-IN-otcv': 'பிரசங்கி', 'ory-irvory': 'ଉପଦେଶକ' },
  "Song of Solomon": { 'hi-IN-irvhin': 'श्रेष्ठगीत', 'ta-IN-otcv': 'உன்னதப்பாட்டு', 'ory-irvory': 'ପରମଗୀତ' },
  "Isaiah": { 'hi-IN-irvhin': 'यशायाह', 'ta-IN-otcv': 'ஏசாயா', 'ory-irvory': 'ଯିଶାଇୟ' },
  "Jeremiah": { 'hi-IN-irvhin': 'यिर्मयाह', 'ta-IN-otcv': 'எரேமியா', 'ory-irvory': 'ଯିରିମୀୟ' },
  "Lamentations": { 'hi-IN-irvhin': 'विलापगीत', 'ta-IN-otcv': 'புலம்பல்', 'ory-irvory': 'ବିଳାପ' },
  "Ezekiel": { 'hi-IN-irvhin': 'यहेजकेल', 'ta-IN-otcv': 'எசேக்கியேல்', 'ory-irvory': 'ଯିହିଜିକଲ' },
  "Daniel": { 'hi-IN-irvhin': 'दानिय्येल', 'ta-IN-otcv': 'தானியேல்', 'ory-irvory': 'ଦାନିୟେଲ' },
  "Hosea": { 'hi-IN-irvhin': 'होशे', 'ta-IN-otcv': 'ஓசியா', 'ory-irvory': 'ହୋଶେୟ' },
  "Joel": { 'hi-IN-irvhin': 'योएल', 'ta-IN-otcv': 'யோயேல்', 'ory-irvory': 'ଯୋୟେଲ' },
  "Amos": { 'hi-IN-irvhin': 'आमोस', 'ta-IN-otcv': 'ஆமோஸ்', 'ory-irvory': 'ଆମୋଷ' },
  "Obadiah": { 'hi-IN-irvhin': 'ओबद्याह', 'ta-IN-otcv': 'ஒபதியா', 'ory-irvory': 'ଓବଦୀୟ' },
  "Jonah": { 'hi-IN-irvhin': 'योना', 'ta-IN-otcv': 'யோனா', 'ory-irvory': 'ଯୂନସ' },
  "Micah": { 'hi-IN-irvhin': 'मीका', 'ta-IN-otcv': 'மீகா', 'ory-irvory': 'ମୀଖା' },
  "Nahum": { 'hi-IN-irvhin': 'नहूम', 'ta-IN-otcv': 'நாகூம்', 'ory-irvory': 'ନାହୂମ' },
  "Habakkuk": { 'hi-IN-irvhin': 'हबक्कूक', 'ta-IN-otcv': 'ஆபகூக்', 'ory-irvory': 'ହବକ୍‍କୂକ' },
  "Zephaniah": { 'hi-IN-irvhin': 'सपन्याह', 'ta-IN-otcv': 'செப்பனியா', 'ory-irvory': 'ସିଫନୀୟ' },
  "Haggai": { 'hi-IN-irvhin': 'हाग्गै', 'ta-IN-otcv': 'ஆகாய்', 'ory-irvory': 'ହାଗୟ' },
  "Zechariah": { 'hi-IN-irvhin': 'जकर्याह', 'ta-IN-otcv': 'சகரியா', 'ory-irvory': 'ଯିଖରୀୟ' },
  "Malachi": { 'hi-IN-irvhin': 'मलाकी', 'ta-IN-otcv': 'மல்கியா', 'ory-irvory': 'ମଲାଖି' },
  "Matthew": { 'hi-IN-irvhin': 'मत्ती', 'ta-IN-otcv': 'மத்தேயு', 'ory-irvory': 'ମାଥିଉ' },
  "Mark": { 'hi-IN-irvhin': 'मरकुस', 'ta-IN-otcv': 'மாற்கு', 'ory-irvory': 'ମାର୍କ' },
  "Luke": { 'hi-IN-irvhin': 'लूका', 'ta-IN-otcv': 'லூக்கா', 'ory-irvory': 'ଲୂକ' },
  "John": { 'hi-IN-irvhin': 'यूहन्ना', 'ta-IN-otcv': 'யோவான்', 'ory-irvory': 'ଯୋହନ' },
  "Acts": { 'hi-IN-irvhin': 'प्रेरितोंकेकाम', 'ta-IN-otcv': 'அப்போஸ்தலர்', 'ory-irvory': 'ପ୍ରେରିତ' },
  "Romans": { 'hi-IN-irvhin': 'रोमियों', 'ta-IN-otcv': 'ரோமர்', 'ory-irvory': 'ରୋମୀୟ' },
  "1 Corinthians": { 'hi-IN-irvhin': '1कुरिन्थियों', 'ta-IN-otcv': '1கொரிந்தியர்', 'ory-irvory': '୧କରିନ୍ଥୀୟ' },
  "2 Corinthians": { 'hi-IN-irvhin': '2कुरिन्थियों', 'ta-IN-otcv': '2கொரிந்தியர்', 'ory-irvory': '୨କରିନ୍ଥୀୟ' },
  "Galatians": { 'hi-IN-irvhin': 'गलातियों', 'ta-IN-otcv': 'கலாத்தியர்', 'ory-irvory': 'ଗାଲାତୀୟ' },
  "Ephesians": { 'hi-IN-irvhin': 'इफिसियों', 'ta-IN-otcv': 'எபேசியர்', 'ory-irvory': 'ଏଫିସୀୟ' },
  "Philippians": { 'hi-IN-irvhin': 'फिलिप्पियों', 'ta-IN-otcv': 'பிலிப்பியர்', 'ory-irvory': 'ଫିଲିପ୍‌ପୀୟ' },
  "Colossians": { 'hi-IN-irvhin': 'कुलुस्सियों', 'ta-IN-otcv': 'கொலோசேயர்', 'ory-irvory': 'କଲସୀୟ' },
  "1 Thessalonians": { 'hi-IN-irvhin': '1थिस्सलुनीकियों', 'ta-IN-otcv': '1தெசலோனிக்கேயர்', 'ory-irvory': '୧ଥେସଲନୀକୀୟ' },
  "2 Thessalonians": { 'hi-IN-irvhin': '2थिस्सलुनीकियों', 'ta-IN-otcv': '2தெசலோனிக்கேயர்', 'ory-irvory': '୨ଥେସଲନୀକୀୟ' },
  "1 Timothy": { 'hi-IN-irvhin': '1तीमुथियुस', 'ta-IN-otcv': '1தீமோத்தேயு', 'ory-irvory': '୧ତୀମଥି' },
  "2 Timothy": { 'hi-IN-irvhin': '2तीमुथियुस', 'ta-IN-otcv': '2தீமோத்தேயு', 'ory-irvory': '୨ତୀମଥି' },
  "Titus": { 'hi-IN-irvhin': 'तीतुस', 'ta-IN-otcv': 'தீத்து', 'ory-irvory': 'ତୀତସ' },
  "Philemon": { 'hi-IN-irvhin': 'फिलेमोन', 'ta-IN-otcv': 'பிலேமோன்', 'ory-irvory': 'ଫିଲୀମୋନ' },
  "Hebrews": { 'hi-IN-irvhin': 'इब्रानियों', 'ta-IN-otcv': 'எபிரெயர்', 'ory-irvory': 'ଏବ୍ରୀ' },
  "James": { 'hi-IN-irvhin': 'याकूब', 'ta-IN-otcv': 'யாக்கோபு', 'ory-irvory': 'ଯାକୁବ' },
  "1 Peter": { 'hi-IN-irvhin': '1पतरस', 'ta-IN-otcv': '1பேதுரு', 'ory-irvory': '୧ପିତର' },
  "2 Peter": { 'hi-IN-irvhin': '2पतरस', 'ta-IN-otcv': '2பேதுரு', 'ory-irvory': '୨ପିତର' },
  "1 John": { 'hi-IN-irvhin': '1यूहन्ना', 'ta-IN-otcv': '1யோவான்', 'ory-irvory': '୧ଯୋହନ' },
  "2 John": { 'hi-IN-irvhin': '2यूहन्ना', 'ta-IN-otcv': '2யோவான்', 'ory-irvory': '୨ଯୋହନ' },
  "3 John": { 'hi-IN-irvhin': '3यूहन्ना', 'ta-IN-otcv': '3யோவான்', 'ory-irvory': '୩ଯୋହନ' },
  "Jude": { 'hi-IN-irvhin': 'यहूदा', 'ta-IN-otcv': 'யூதா', 'ory-irvory': 'ଯିହୂଦା' },
  "Revelation": { 'hi-IN-irvhin': 'प्रकाशितवाक्य', 'ta-IN-otcv': 'வெளிப்படுத்தல்', 'ory-irvory': 'ପ୍ରକାଶିତ' },
};

/**
 * Resolve the wldeh folder name for a book in a given version.
 * English versions compute the folder; other versions use BIBLE_BOOK_FOLDERS,
 * falling back to the computed English folder if unmapped.
 */
export function resolveBookFolder(bookName: string, versionId: string): string {
  const computed = bookName.toLowerCase().replace(/\s+/g, '');
  if (versionId.startsWith('en-')) {
    return computed;
  }
  return BIBLE_BOOK_FOLDERS[bookName]?.[versionId] || computed;
}
