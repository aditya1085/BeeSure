import { SupportedLanguage } from './indianLanguages';

// Local storage prefix
const CACHE_PREFIX = 'beesure_trans_';

// In-memory runtime translation dictionary
const MEMORY_CACHE: Record<string, Record<string, string>> = {
  hi: {},
  bn: {},
  te: {},
  mr: {},
  ta: {},
  ur: {},
  gu: {},
  kn: {},
  ml: {},
  or: {},
  pa: {},
  as: {},
};

// Common word dictionary across major Indian languages
export const COMMON_WORDS: Record<string, Partial<Record<SupportedLanguage, string>>> = {
  'honey': {
    hi: 'शहद',
    bn: 'মধু',
    te: 'తేనె',
    mr: 'मध',
    ta: 'தேன்',
    ur: 'شہد',
    gu: 'મધ',
    kn: 'ಜೇನುತುಪ್ಪ',
    ml: 'തേൻ',
    or: 'ମହୁ',
    pa: 'ਸ਼ਹਿਦ',
    as: 'মৌ',
  },
  'pure': {
    hi: 'शुद्ध',
    bn: 'খাঁটি',
    te: 'స్వచ్ఛమైన',
    mr: 'शुद्ध',
    ta: 'தூய',
    ur: 'خالص',
    gu: 'શુદ્ધ',
    kn: 'ಶುದ್ಧ',
    ml: 'ശുദ്ധമായ',
    or: 'ଶୁଦ୍ଧ',
    pa: 'ਸ਼ੁੱਧ',
    as: 'বিশুদ্ধ',
  },
  'raw': {
    hi: 'कच्चा',
    bn: 'কাঁচা',
    te: 'ముడి',
    mr: 'कच्चा',
    ta: 'இயற்கை / கச்சா',
    ur: 'کچا',
    gu: 'કાચું',
    kn: 'ಹಸಿ / ಸಂಸ್ಕರಿಸದ',
    ml: 'സംസ്കരിക്കാത്ത',
    or: 'କଞ୍ଚା',
    pa: 'ਕੱਚਾ',
    as: 'কেঁচা',
  },
  'batch': {
    hi: 'बैच',
    bn: 'ব্যাচ',
    te: 'బ్యాచ్',
    mr: 'बॅच',
    ta: 'தொகுதி (Batch)',
    ur: 'بیچ',
    gu: 'બેચ',
    kn: 'ಬ್ಯಾಚ್',
    ml: 'ബാച്ച്',
    or: 'ବ୍ୟାଚ୍',
    pa: 'ਬੈਚ',
    as: 'বেচ',
  },
  'hive': {
    hi: 'छत्ता',
    bn: 'মৌচাক',
    te: 'తేనెటీగల తుట్టె',
    mr: 'पोळे',
    ta: 'தேன்கூடு',
    ur: 'چھتا',
    gu: 'મધપૂડો',
    kn: 'ಜೇನುಪೆಟ್ಟಿಗೆ',
    ml: 'തേൻകൂട്',
    or: 'ମହୁଫେଣା',
    pa: 'ਛੱਤਾ',
    as: 'মৌচাক',
  },
  'hives': {
    hi: 'छत्ते',
    bn: 'মৌচাকসমূহ',
    te: 'తేనెటీగల తుట్టెలు',
    mr: 'मधमाशी पोळी',
    ta: 'தேன்கூடுகள்',
    ur: 'چھتے',
    gu: 'મધપૂડા',
    kn: 'ಜೇನುಪೆಟ್ಟಿಗೆಗಳು',
    ml: 'തേൻകൂടുകൾ',
    or: 'ମହୁବାକ୍ସଗୁଡିକ',
    pa: 'ਛੱਤੇ',
    as: 'মৌচাকবোৰ',
  },
  'beekeeper': {
    hi: 'मधुमक्खी पालक',
    bn: 'মৌমাছি পালনকারী',
    te: 'తేనెటీగల పెంపకందారుడు',
    mr: 'मधमाशी पालक',
    ta: 'தேனீ வளர்ப்பாளர்',
    ur: 'شہد کی مکھیاں پالنے والا',
    gu: 'મધમાખી પાલક',
    kn: 'ಜೇನು ಕೃಷಿಕ',
    ml: 'തേനീച്ച കർഷകൻ',
    or: 'ମହୁଚାଷୀ',
    pa: 'ਮਧੂਮੱਖੀ ਪਾਲਕ',
    as: 'মৌপালক',
  },
  'harvest': {
    hi: 'फसल / निष्कर्षण',
    bn: 'ফসল / আহরণ',
    te: 'దిగుబడి / సేకరణ',
    mr: 'पीक / गोळा करणे',
    ta: 'அறுவடை',
    ur: 'پیداوار / کٹائی',
    gu: 'ઉત્પાદન / લણણી',
    kn: 'ಕೊಯ್ಲು / ಉತ್ಪಾದನೆ',
    ml: 'വിളവെടുപ്പ്',
    or: 'ଅମଳ',
    pa: 'ਵਾਢੀ / ਉਤਪਾਦਨ',
    as: 'উৎপাদন',
  },
  'lab': {
    hi: 'प्रयोगशाला',
    bn: 'পরীক্ষাগার',
    te: 'ప్రయోగశాల',
    mr: 'प्रयोगशाळा',
    ta: 'ஆய்வகம்',
    ur: 'لیبارٹری',
    gu: 'પ્રયોગશાળા',
    kn: 'ಪ್ರಯೋಗಾಲಯ',
    ml: 'ലാബ്',
    or: 'ପରୀକ୍ଷାଗାର',
    pa: 'ਪ੍ਰਯੋਗਸ਼ਾਲਾ',
    as: 'পৰীক্ষাগাৰ',
  },
  'verified': {
    hi: 'सत्यापित',
    bn: 'যাচাইকৃত',
    te: 'ధృవీకరించబడింది',
    mr: 'पडताळलेले',
    ta: 'சரிபார்க்கப்பட்டது',
    ur: 'تصدیق شدہ',
    gu: 'ચકાસાયેલ',
    kn: 'ಪರಿಶೀಲಿಸಲಾಗಿದೆ',
    ml: 'പരിശോധിച്ചു',
    or: 'ଯାଞ୍ଚ ହୋଇଛି',
    pa: 'ਤਸਦੀਕਸ਼ੁਦਾ',
    as: 'পৰীক্ষিত',
  },
  'cart': {
    hi: 'कार्ट',
    bn: 'কার্ট',
    te: 'కార్ట్',
    mr: 'कार्ट',
    ta: 'கூடை',
    ur: 'کارٹ',
    gu: 'કાર્ટ',
    kn: 'ಕಾರ್ಟ್',
    ml: 'കാർട്ട്',
    or: 'କାର୍ଟ',
    pa: 'ਕਾਰਟ',
    as: 'কাৰ্ট',
  },
  'orders': {
    hi: 'ऑर्डर्स',
    bn: 'অর্ডারসমূহ',
    te: 'ఆర్డర్లు',
    mr: 'ऑर्डर्स',
    ta: 'ஆர்டர்கள்',
    ur: 'آرڈرز',
    gu: 'ઓર્ડર્સ',
    kn: 'ಆರ್ಡರ್‌ಗಳು',
    ml: 'ഓർഡറുകൾ',
    or: 'ଅର୍ଡରସବୁ',
    pa: 'ਆਰਡਰ',
    as: 'অৰ্ডাৰসমূহ',
  },
  'price': {
    hi: 'मूल्य',
    bn: 'মূল্য',
    te: 'ధర',
    mr: 'किंमत',
    ta: 'விலை',
    ur: 'قیمت',
    gu: 'કિંમત',
    kn: 'ಬೆಲೆ',
    ml: 'വില',
    or: 'ମୂଲ୍ୟ',
    pa: 'ਕੀਮਤ',
    as: 'দাম',
  },
  'stock': {
    hi: 'स्टॉक',
    bn: 'মজুদ',
    te: 'స్టాక్',
    mr: 'साठा',
    ta: 'இருப்பு',
    ur: 'اسٹاک',
    gu: 'સ્ટોક',
    kn: 'ದಾಸ್ತಾನು',
    ml: 'സ്റ്റോക്ക്',
    or: 'ଷ୍ଟକ୍',
    pa: 'ਸਟਾਕ',
    as: 'মজুত',
  },
  'search': {
    hi: 'खोजें',
    bn: 'অনুসন্ধান',
    te: 'శోధించండి',
    mr: 'शोधा',
    ta: 'தேடுக',
    ur: 'تلاش کریں',
    gu: 'શોધો',
    kn: 'ಹುಡುಕಿ',
    ml: 'തിരയുക',
    or: 'ଖୋଜନ୍ତୁ',
    pa: 'ਖੋਜੋ',
    as: 'সন্ধান কৰক',
  },
  'filter': {
    hi: 'फ़िल्टर',
    bn: 'ফিল্টার',
    te: 'ఫిల్టర్',
    mr: 'फिल्टर',
    ta: 'வடிகட்டி',
    ur: 'فلٹر',
    gu: 'ફિલ્ટર',
    kn: 'ಫಿಲ್ಟರ್',
    ml: 'ഫിൽട്ടർ',
    or: 'ଫିଲ୍ଟର',
    pa: 'ਫਿਲਟਰ',
    as: 'ফিল্টাৰ',
  },
  'status': {
    hi: 'स्थिति',
    bn: 'অবস্থা',
    te: 'స్థితి',
    mr: 'स्थिती',
    ta: 'நிலை',
    ur: 'حیثیت',
    gu: 'સ્થિતિ',
    kn: 'ಸ್ಥಿತಿ',
    ml: 'അവസ്ഥ',
    or: 'ସ୍ଥିତି',
    pa: 'ਸਥਿਤੀ',
    as: 'স্থিতি',
  },
  'temperature': {
    hi: 'तापमान',
    bn: 'তাপমাত্রা',
    te: 'ఉష్ణోగ్రత',
    mr: 'तापमान',
    ta: 'வெப்பநிலை',
    ur: 'درجہ حرارت',
    gu: 'તાપમાન',
    kn: 'ತಾಪಮಾನ',
    ml: 'താപനില',
    or: 'ତାପମାତ୍ରା',
    pa: 'ਤਾਪਮਾਨ',
    as: 'উত্তাপ',
  },
  'humidity': {
    hi: 'आर्द्रता',
    bn: 'আর্দ্রতা',
    te: 'తేమ',
    mr: 'आर्द्रता',
    ta: 'ஈரப்பதம்',
    ur: 'نمی',
    gu: 'ભેજ',
    kn: 'ತೇವಾಂಶ',
    ml: 'ഈർപ്പം',
    or: 'ଆର୍ଦ୍ରତା',
    pa: 'ਨਮੀ',
    as: 'আৰ্দ্ৰতা',
  },
  'weight': {
    hi: 'वजन',
    bn: 'ওজন',
    te: 'బరువు',
    mr: 'वजन',
    ta: 'எடை',
    ur: 'وزن',
    gu: 'વજન',
    kn: 'ತೂಕ',
    ml: 'ഭാരം',
    or: 'ଓଜନ',
    pa: 'ਭਾਰ',
    as: 'ওজন',
  },
};

// Load saved translations from localStorage
export function getSavedTranslation(targetLang: SupportedLanguage, text: string): string | null {
  if (targetLang === 'en') return text;
  const key = `${CACHE_PREFIX}${targetLang}_${text.trim()}`;
  try {
    return localStorage.getItem(key) || MEMORY_CACHE[targetLang]?.[text.trim()] || null;
  } catch {
    return MEMORY_CACHE[targetLang]?.[text.trim()] || null;
  }
}

// Save translation into caches
export function saveTranslation(targetLang: SupportedLanguage, text: string, translated: string) {
  if (targetLang === 'en' || !text.trim()) return;
  const trimmed = text.trim();
  if (!MEMORY_CACHE[targetLang]) {
    MEMORY_CACHE[targetLang] = {};
  }
  MEMORY_CACHE[targetLang][trimmed] = translated;
  try {
    localStorage.setItem(`${CACHE_PREFIX}${targetLang}_${trimmed}`, translated);
  } catch (e) {
    // Ignore quota issues
  }
}

// Asynchronously request batch translations from server
const PENDING_TEXTS = new Set<string>();
let translationTimeout: any = null;

export function queueTranslation(
  targetLang: SupportedLanguage,
  texts: string[],
  onComplete?: () => void
) {
  if (targetLang === 'en') return;

  for (const t of texts) {
    if (t && t.trim().length > 1 && !getSavedTranslation(targetLang, t)) {
      PENDING_TEXTS.add(t.trim());
    }
  }

  if (PENDING_TEXTS.size === 0) {
    if (onComplete) onComplete();
    return;
  }

  if (translationTimeout) clearTimeout(translationTimeout);

  translationTimeout = setTimeout(async () => {
    const batch = Array.from(PENDING_TEXTS).slice(0, 40);
    PENDING_TEXTS.clear();

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texts: batch, targetLang }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.translations) {
          for (const [orig, trans] of Object.entries(data.translations)) {
            if (typeof trans === 'string' && trans !== orig) {
              saveTranslation(targetLang, orig, trans);
            }
          }
          if (onComplete) onComplete();
        }
      }
    } catch (err) {
      console.warn('Multilingual dynamic translation fetch warning:', err);
    }
  }, 300);
}

/**
 * Synchronous text translation using dictionaries and cache
 */
export function translateText(text: string, targetLang: SupportedLanguage): string {
  if (!text || targetLang === 'en') return text;
  const trimmed = text.trim();
  if (!trimmed) return text;

  // 1. Direct cache check
  const cached = getSavedTranslation(targetLang, trimmed);
  if (cached) {
    return text.replace(trimmed, cached);
  }

  // 2. Exact word check
  const lower = trimmed.toLowerCase();
  if (COMMON_WORDS[lower]?.[targetLang]) {
    return text.replace(trimmed, COMMON_WORDS[lower]![targetLang]!);
  }

  // 3. Queue for server translation if meaningful phrase (>3 chars)
  if (trimmed.length >= 3 && !/^\d+$/.test(trimmed)) {
    queueTranslation(targetLang, [trimmed]);
  }

  return text;
}
