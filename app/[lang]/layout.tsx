import type { Metadata } from 'next';
import { LanguageProvider } from '@/lib/i18n/context';
import { getDictionary } from '@/lib/i18n/server';
import type { Locale } from '@/lib/i18n/config';

interface LangLayoutProps {
  children: React.ReactNode;
  params: Promise<{ lang: Locale }>;
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);

  return {
    title: dict.meta?.title || 'USlab.ai | AI 역량 강화',
    description: dict.meta?.description || 'AI 대전환(AX), 이제 모두를 위한 기술이 됩니다.',
    alternates: {
      languages: {
        ko: '/ko',
        en: '/en',
      },
    },
  };
}

export default async function LangLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);

  return (
    <LanguageProvider initialLang={lang as Locale} dict={dict}>
      {children}
    </LanguageProvider>
  );
}

