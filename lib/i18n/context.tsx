'use client';

import { createContext, useContext, useMemo, ReactNode } from 'react';
import type { Locale } from './config';
import { defaultLocale } from './config';
import type { Translations } from './server';

interface LanguageContextType {
  locale: Locale;
  t: (key: string) => string;
  getArray: (key: string) => string[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
  initialLang: Locale;
  dict: Translations;
}

export function LanguageProvider({ children, initialLang, dict }: LanguageProviderProps) {
  // URL에서 받은 locale을 사용 (Source of Truth)
  const currentLocale = initialLang;

  // 클라이언트에서 html lang 속성 업데이트
  if (typeof window !== 'undefined') {
    document.documentElement.lang = currentLocale;
    // localStorage에 저장 (미들웨어에서 활용)
    localStorage.setItem('locale', currentLocale);
    // 쿠키에도 저장 (미들웨어에서 활용)
    document.cookie = `locale=${currentLocale}; path=/; max-age=31536000`; // 1년
  }

  // Memoize translation functions
  const { t, getArray } = useMemo(() => {
    const getValue = (key: string): any => {
      const keys = key.split('.');
      let value: any = dict;

      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
          return null; // Return null if translation not found
        }
      }

      return value;
    };

    const t = (key: string): string => {
      const value = getValue(key);
      return typeof value === 'string' ? value : key;
    };

    const getArray = (key: string): string[] => {
      const value = getValue(key);
      return Array.isArray(value) ? value : [];
    };

    return { t, getArray };
  }, [dict]);

  const contextValue = useMemo(
    () => ({ locale: currentLocale, t, getArray }),
    [currentLocale, t, getArray]
  );

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}



