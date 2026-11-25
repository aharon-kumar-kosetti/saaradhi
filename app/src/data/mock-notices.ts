import type { Notice } from '@/types/notice';

/** Sample data for the M1 shell. Every registry entry is still verified:false, so no sample is "safe". */
function inDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export const MOCK_NOTICES: Notice[] = [
  {
    id: 'demo-bill',
    category: 'financial_utility',
    department: 'APSPDCL',
    amount: 1850,
    dueDate: inDays(6),
    referenceNumber: 'SAMPLE/2026/0041827',
    title: {
      te: 'విద్యుత్ బిల్లు — చెల్లించాలి',
      hi: 'बिजली बिल — भुगतान बाकी',
      en: 'Electricity bill — payment due',
    },
    scam: {
      label: 'unsure',
      reasons: {
        te: ['ఈ శాఖ ఇంకా అధికారికంగా నిర్ధారించబడలేదు', 'నోటీసుపై అధికారిక లింక్ లేదు'],
        hi: ['यह विभाग अभी आधिकारिक रूप से सत्यापित नहीं है', 'नोटिस पर कोई आधिकारिक लिंक नहीं है'],
        en: ['This department is not verified in the trusted registry yet', 'No official link on this notice'],
      },
    },
  },
  {
    id: 'demo-health',
    category: 'health_insurance',
    department: 'Health department (sample)',
    dueDate: inDays(21),
    title: {
      te: 'ఆరోగ్య బీమా పునరుద్ధరణ',
      hi: 'स्वास्थ्य बीमा नवीनीकरण',
      en: 'Health insurance renewal',
    },
    scam: {
      label: 'unsure',
      reasons: {
        te: ['గడువు, రుసుము వివరాలు ఇంకా నిర్ధారించబడలేదు', 'అధికారిక లింక్ లేదు'],
        hi: ['समय-सीमा और शुल्क की पुष्टि नहीं हुई है', 'कोई आधिकारिक लिंक नहीं है'],
        en: ['Deadline and fee details are not confirmed yet', 'No official link to check'],
      },
    },
  },
  {
    id: 'demo-scam',
    category: 'scam_fraud',
    department: 'Unknown sender',
    amount: 4999,
    title: {
      te: 'ఈరోజే చెల్లించండి — లేకపోతే కనెక్షన్ కట్',
      hi: 'आज ही भुगतान करें — वरना कनेक्शन कट',
      en: 'Pay today or the connection will be cut',
    },
    scam: {
      label: 'dangerous',
      reasons: {
        te: [
          'చిన్న లింక్ (bit.ly) ఉంది — అధికారిక లింక్ కాదు',
          'తక్షణమే చెల్లించమని భయపెడుతోంది',
          'ఈ డొమైన్ రిజిస్ట్రీలో లేదు',
        ],
        hi: [
          'छोटा लिंक (bit.ly) है — आधिकारिक लिंक नहीं',
          'तुरंत भुगतान के लिए डराया जा रहा है',
          'यह डोमेन रजिस्ट्री में नहीं है',
        ],
        en: [
          'Contains a shortened link (bit.ly) — not an official link',
          'Uses urgency and threats to make you pay now',
          'This domain is not in the trusted registry',
        ],
      },
    },
  },
];

export function findMockNotice(id: string): Notice | undefined {
  return MOCK_NOTICES.find((notice) => notice.id === id);
}
