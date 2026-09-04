'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { translations, type Language, type TranslationKey } from '../i18n/translations';
import { translateDynamic, translateDynamicList } from '../utils/dynamicTranslator';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey) => string;
  tDynamic: (textTh?: string, textEn?: string) => string;
  tDynamicList: (listTh?: string[], listEn?: string[]) => string[];
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

  const tDynamic = useCallback(
    (textTh?: string, textEn?: string): string => {
      return translateDynamic(textTh, textEn, language);
    },
    [language]
  );

  const tDynamicList = useCallback(
    (listTh?: string[], listEn?: string[]): string[] => {
      return translateDynamicList(listTh || [], listEn, language);
    },
    [language]
  );

  const contextValue = useMemo(
    () => ({
      language,
      setLanguage,
      toggleLanguage,
      t,
      tDynamic,
      tDynamicList,
    }),
    [language, setLanguage, toggleLanguage, t, tDynamic, tDynamicList]
  );

  return <LanguageContext.Provider value={contextValue}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
