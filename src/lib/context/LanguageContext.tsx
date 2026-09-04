'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translations, type Language, type TranslationKey } from '../i18n/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('th');

  useEffect(() => {
    try {
      const savedLang = localStorage.getItem('stockhome_lang') as Language;
      if (savedLang === 'th' || savedLang === 'en') {
        setLanguageState(savedLang);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('stockhome_lang', lang);
      document.documentElement.lang = lang;
    } catch {
      // Ignore
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'th' ? 'en' : 'th');
  }, [language, setLanguage]);

  const t = useCallback(
    (key: TranslationKey): string => {
      const dict = translations[language] || translations.th;
      return dict[key] || translations.th[key] || String(key);
    },
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
