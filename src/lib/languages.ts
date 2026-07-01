export interface Language {
  code: string
  label: string   // full native name
  short: string   // pill button label
  ttsLang: string // BCP-47 tag — used only when no audio file exists (English)
  hasAudio: boolean
}

export const LANGUAGES: Language[] = [
  { code: 'en', label: 'English',   short: 'EN',  ttsLang: 'en-IN', hasAudio: false },
  { code: 'hi', label: 'हिन्दी',    short: 'हि',  ttsLang: 'hi-IN', hasAudio: true  },
  { code: 'te', label: 'తెలుగు',    short: 'తె',  ttsLang: 'te-IN', hasAudio: true  },
  { code: 'ta', label: 'தமிழ்',     short: 'த',   ttsLang: 'ta-IN', hasAudio: true  },
  { code: 'kn', label: 'ಕನ್ನಡ',    short: 'ಕ',   ttsLang: 'kn-IN', hasAudio: true  },
  { code: 'ml', label: 'മലയാളം',   short: 'മ',   ttsLang: 'ml-IN', hasAudio: true  },
  { code: 'mr', label: 'मराठी',     short: 'मर',  ttsLang: 'mr-IN', hasAudio: true  },
  { code: 'bn', label: 'বাংলা',     short: 'বা',  ttsLang: 'bn-IN', hasAudio: true  },
  { code: 'gu', label: 'ગુજરાતી',  short: 'ગ',   ttsLang: 'gu-IN', hasAudio: true  },
  { code: 'pa', label: 'ਪੰਜਾਬੀ',   short: 'ਪੰ',  ttsLang: 'pa-IN', hasAudio: true  },
  { code: 'as', label: 'অসমীয়া',   short: 'অস',  ttsLang: 'as-IN', hasAudio: true  },
  { code: 'or', label: 'ଓଡ଼ିଆ',     short: 'ଓ',   ttsLang: 'or-IN', hasAudio: true  },
]
