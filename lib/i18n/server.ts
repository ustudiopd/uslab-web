import type { Locale } from './config';
import { defaultLocale } from './config';
import koTranslations from './translations/ko.json';
import enTranslations from './translations/en.json';

export type Translations = typeof koTranslations;

const translations: Record<Locale, Translations> = {
  ko: koTranslations,
  en: enTranslations,
};

/**
 * 서버 컴포넌트에서 사용하는 번역 딕셔너리 로더
 * @param locale - 언어 코드 ('ko' | 'en')
 * @returns 해당 언어의 번역 객체
 */
export async function getDictionary(locale: Locale = defaultLocale): Promise<Translations> {
  return translations[locale] || translations[defaultLocale];
}

