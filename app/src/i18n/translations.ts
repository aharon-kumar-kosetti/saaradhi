import type { Language, ScamLabel } from '@/types/notice';

// English is the key source of truth: a missing key in te/hi fails the type check.
const en = {
  'app.name': 'Saaradhi',
  'common.back': 'Back',
  'common.settings': 'Settings',

  'language.title': 'Choose your language',
  'language.subtitle': 'You can change this at any time',

  'consent.title': 'Your privacy matters',
  'consent.body':
    'We use your notice photo only to read it. We never submit anything for you.',
  'consent.point1': 'A photo leaves your phone only when you allow it',
  'consent.point2': 'Without login, data stays on this phone and is deleted after 90 days',
  'consent.point3': 'We never submit forms or payments',
  'consent.agree': 'I understand and agree',
  'consent.later': 'Not now',
  'consent.needed': 'Allow privacy terms before scanning',

  'home.scan': 'Scan a notice',
  'home.gallery': 'From gallery',
  'home.pdf': 'Pick a PDF',
  'home.recent': 'Recent notices',
  'home.empty': 'No notices yet',
  'home.demo': 'Sample data',

  'notice.amount': 'Amount',
  'notice.dueDate': 'Due date',
  'notice.reference': 'Reference number',
  'notice.department': 'Department',
  'notice.category': 'Type',
  'notice.whatToNotice': 'What to notice',
  'notice.demoBanner': 'This is a sample notice. Reading your own notice comes in the next step.',
  'notice.cameraOff': 'Camera permission is off. Turn it on in phone settings.',

  'reading.title': 'Notice selected',
  'reading.body': 'Reading the notice comes in the next step. Nothing was uploaded.',

  'scam.safe': 'Safe',
  'scam.suspicious': 'Suspicious',
  'scam.dangerous': 'Dangerous',
  'scam.unsure': 'Not sure',
  'scam.safeNote': 'Consistent with official patterns. This is not a guarantee.',

  'settings.title': 'Settings',
  'settings.language': 'Language',
  'settings.privacy': 'Privacy',
  'settings.privacyBody':
    'Without login, your data stays on this phone and is deleted automatically after 90 days.',
  'settings.deleteData': 'Delete my data',
  'settings.deleteTitle': 'Delete all data?',
  'settings.deleteBody': 'This cannot be undone.',
  'settings.delete': 'Delete',
  'settings.cancel': 'Cancel',
  'settings.version': 'Version',

  'disclaimer': 'Document comprehension, not legal advice.',

  'category.health_insurance': 'Health insurance',
  'category.financial_utility': 'Bill / utility',
  'category.community_service': 'Government service',
  'category.scam_fraud': 'Scam',
  'category.other': 'Other',
} as const;

export type TKey = keyof typeof en;

const te: Record<TKey, string> = {
  'app.name': 'సారథి',
  'common.back': 'వెనుకకు',
  'common.settings': 'సెట్టింగ్‌లు',

  'language.title': 'మీ భాషను ఎంచుకోండి',
  'language.subtitle': 'మీరు ఎప్పుడైనా మార్చుకోవచ్చు',

  'consent.title': 'మీ గోప్యత ముఖ్యం',
  'consent.body': 'మీ నోటీసు ఫోటోను చదవడానికి మాత్రమే వాడతాము. మేము ఏదీ సబ్మిట్ చేయము.',
  'consent.point1': 'మీరు అనుమతిస్తేనే ఫోటో మీ ఫోన్ నుండి వెళ్తుంది',
  'consent.point2': 'లాగిన్ చేయకపోతే డేటా ఈ ఫోన్‌లోనే ఉంటుంది, 90 రోజుల తర్వాత తొలగిపోతుంది',
  'consent.point3': 'మేము ఫారమ్‌లు లేదా పేమెంట్‌లు సబ్మిట్ చేయము',
  'consent.agree': 'అర్థమైంది, అంగీకరిస్తున్నాను',
  'consent.later': 'ఇప్పుడు కాదు',
  'consent.needed': 'స్కాన్ చేయాలంటే ముందు గోప్యతా అనుమతి ఇవ్వండి',

  'home.scan': 'నోటీసు స్కాన్ చేయండి',
  'home.gallery': 'గ్యాలరీ నుండి',
  'home.pdf': 'PDF ఎంచుకోండి',
  'home.recent': 'ఇటీవలి నోటీసులు',
  'home.empty': 'ఇంకా నోటీసులు లేవు',
  'home.demo': 'నమూనా డేటా',

  'notice.amount': 'మొత్తం',
  'notice.dueDate': 'చివరి తేదీ',
  'notice.reference': 'రెఫరెన్స్ నంబర్',
  'notice.department': 'శాఖ',
  'notice.category': 'రకం',
  'notice.whatToNotice': 'గమనించవలసినవి',
  'notice.demoBanner': 'ఇది నమూనా నోటీసు. మీ నోటీసు చదవడం తదుపరి దశలో వస్తుంది.',
  'notice.cameraOff': 'కెమెరా అనుమతి లేదు. ఫోన్ సెట్టింగ్‌లో ఆన్ చేయండి.',

  'reading.title': 'నోటీసు ఎంచుకోబడింది',
  'reading.body': 'నోటీసు చదవడం తదుపరి దశలో వస్తుంది. ఏదీ అప్‌లోడ్ చేయలేదు.',

  'scam.safe': 'సురక్షితం',
  'scam.suspicious': 'అనుమానాస్పదం',
  'scam.dangerous': 'ప్రమాదకరం',
  'scam.unsure': 'నిర్ధారించలేము',
  'scam.safeNote': 'అధికారిక నమూనాలతో సరిపోతుంది. ఇది హామీ కాదు.',

  'settings.title': 'సెట్టింగ్‌లు',
  'settings.language': 'భాష',
  'settings.privacy': 'గోప్యత',
  'settings.privacyBody':
    'లాగిన్ చేయకపోతే, మీ డేటా ఈ ఫోన్‌లోనే ఉంటుంది. 90 రోజుల తర్వాత ఆటోమేటిక్‌గా తొలగిపోతుంది.',
  'settings.deleteData': 'నా డేటాను తొలగించండి',
  'settings.deleteTitle': 'మొత్తం డేటా తొలగించాలా?',
  'settings.deleteBody': 'ఇది వెనక్కి తీసుకోలేము.',
  'settings.delete': 'తొలగించు',
  'settings.cancel': 'వద్దు',
  'settings.version': 'వెర్షన్',

  'disclaimer': 'పత్రం అర్థం చేసుకోవడం కోసం మాత్రమే, చట్టపరమైన సలహా కాదు.',

  'category.health_insurance': 'ఆరోగ్య బీమా',
  'category.financial_utility': 'బిల్లు, యూటిలిటీ',
  'category.community_service': 'ప్రభుత్వ సేవ',
  'category.scam_fraud': 'మోసం',
  'category.other': 'ఇతర',
};

const hi: Record<TKey, string> = {
  'app.name': 'सारथी',
  'common.back': 'वापस',
  'common.settings': 'सेटिंग्स',

  'language.title': 'अपनी भाषा चुनें',
  'language.subtitle': 'आप इसे कभी भी बदल सकते हैं',

  'consent.title': 'आपकी गोपनीयता ज़रूरी है',
  'consent.body': 'हम आपका नोटिस फ़ोटो सिर्फ़ पढ़ने के लिए उपयोग करते हैं। हम कुछ भी जमा नहीं करते।',
  'consent.point1': 'फ़ोटो आपकी अनुमति से ही आपके फ़ोन से जाती है',
  'consent.point2': 'बिना लॉगिन, डेटा इस फ़ोन पर ही रहता है और 90 दिन बाद मिट जाता है',
  'consent.point3': 'हम फ़ॉर्म या भुगतान जमा नहीं करते',
  'consent.agree': 'समझ गया, मैं सहमत हूँ',
  'consent.later': 'अभी नहीं',
  'consent.needed': 'स्कैन करने के लिए पहले गोपनीयता की अनुमति दें',

  'home.scan': 'नोटिस स्कैन करें',
  'home.gallery': 'गैलरी से',
  'home.pdf': 'PDF चुनें',
  'home.recent': 'हाल के नोटिस',
  'home.empty': 'अभी कोई नोटिस नहीं',
  'home.demo': 'नमूना डेटा',

  'notice.amount': 'राशि',
  'notice.dueDate': 'अंतिम तिथि',
  'notice.reference': 'संदर्भ संख्या',
  'notice.department': 'विभाग',
  'notice.category': 'प्रकार',
  'notice.whatToNotice': 'ध्यान देने योग्य बातें',
  'notice.demoBanner': 'यह एक नमूना नोटिस है। आपका नोटिस पढ़ना अगले चरण में आएगा।',
  'notice.cameraOff': 'कैमरा अनुमति बंद है। फ़ोन सेटिंग्स में चालू करें।',

  'reading.title': 'नोटिस चुना गया',
  'reading.body': 'नोटिस पढ़ना अगले चरण में आएगा। कुछ भी अपलोड नहीं हुआ।',

  'scam.safe': 'सुरक्षित',
  'scam.suspicious': 'संदिग्ध',
  'scam.dangerous': 'खतरनाक',
  'scam.unsure': 'पक्का नहीं',
  'scam.safeNote': 'यह आधिकारिक पैटर्न से मेल खाता है। यह गारंटी नहीं है।',

  'settings.title': 'सेटिंग्स',
  'settings.language': 'भाषा',
  'settings.privacy': 'गोपनीयता',
  'settings.privacyBody':
    'बिना लॉगिन, आपका डेटा इस फ़ोन पर ही रहता है और 90 दिन बाद अपने आप मिट जाता है।',
  'settings.deleteData': 'मेरा डेटा हटाएँ',
  'settings.deleteTitle': 'सारा डेटा हटाएँ?',
  'settings.deleteBody': 'इसे वापस नहीं लाया जा सकता।',
  'settings.delete': 'हटाएँ',
  'settings.cancel': 'रद्द करें',
  'settings.version': 'संस्करण',

  'disclaimer': 'दस्तावेज़ समझने के लिए, कानूनी सलाह नहीं।',

  'category.health_insurance': 'स्वास्थ्य बीमा',
  'category.financial_utility': 'बिल, यूटिलिटी',
  'category.community_service': 'सरकारी सेवा',
  'category.scam_fraud': 'धोखाधड़ी',
  'category.other': 'अन्य',
};

export const translations: Record<Language, Record<TKey, string>> = { te, hi, en };

export function translate(language: Language, key: TKey): string {
  return translations[language][key] ?? translations.en[key];
}

export const SCAM_LABEL_KEY: Record<ScamLabel, TKey> = {
  safe: 'scam.safe',
  suspicious: 'scam.suspicious',
  dangerous: 'scam.dangerous',
  unsure: 'scam.unsure',
};

/** Endonyms: people recognise their own script before the English name. */
export const LANGUAGE_NAMES: Record<Language, string> = {
  te: 'తెలుగు',
  hi: 'हिन्दी',
  en: 'English',
};
