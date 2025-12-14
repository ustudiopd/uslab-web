import { getAboutByLocale } from '@/lib/queries/about';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import type { Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/server';
import type { Metadata } from 'next';
import AboutViewer from '@/components/about/AboutViewer';
import { notFound } from 'next/navigation';
import { generateContentHTML } from '@/lib/utils/generate-html';

interface AboutPageProps {
  params: Promise<{ lang: Locale }>;
}

export async function generateMetadata({ params }: AboutPageProps): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return {
    title: lang === 'ko' ? '소개 | USlab.ai' : 'About | USlab.ai',
    description: lang === 'ko' 
      ? 'USlab.ai 소개'
      : 'About USlab.ai',
  };
}

export default async function AboutPage({ params }: AboutPageProps) {
  const { lang } = await params;
  const about = await getAboutByLocale(lang);
  const dict = await getDictionary(lang);

  if (!about) {
    notFound();
  }

  // 서버에서 HTML 생성 (hydration mismatch 방지)
  const htmlContent = generateContentHTML(about.content);

  return (
    <div className="min-h-screen dark:bg-slate-950 bg-white">
      <Navbar />
      <div className="pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* 본문 */}
          <AboutViewer about={about} htmlContent={htmlContent} />
        </div>
      </div>
      <Footer />
    </div>
  );
}
