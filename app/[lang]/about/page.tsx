import { getAboutByLocale } from '@/lib/queries/about';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import type { Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/server';
import type { Metadata } from 'next';
import AboutViewer from '@/components/about/AboutViewer';
import { notFound } from 'next/navigation';
import { generateContentHTML } from '@/lib/utils/generate-html';
import { extractTextFromContent } from '@/lib/utils/blog';
import { extractFirstImageUrl } from '@/lib/utils/blog';

interface AboutPageProps {
  params: Promise<{ lang: Locale }>;
}

export async function generateMetadata({ params }: AboutPageProps): Promise<Metadata> {
  const { lang } = await params;
  const about = await getAboutByLocale(lang);

  if (!about) {
    return {
      title: lang === 'ko' ? '소개 | USLab.ai' : 'About | USLab.ai',
      description: lang === 'ko' ? 'USLab.ai 소개' : 'About USLab.ai',
    };
  }

  // 다른 언어 버전 찾기
  const koAbout = lang === 'ko' ? about : await getAboutByLocale('ko');
  const enAbout = lang === 'en' ? about : await getAboutByLocale('en');

  const alternateLanguages: Record<string, string> = {};
  if (koAbout) alternateLanguages['ko'] = '/ko/about';
  if (enAbout) alternateLanguages['en'] = '/en/about';

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://uslab.ai';
  const canonicalUrl = `${baseUrl}/${lang}/about`;

  // Description fallback: seo_description이 없으면 본문 첫 150자 사용
  const extractedDescription = extractTextFromContent(about.content, 150);
  const description = about.seo_description || extractedDescription || (lang === 'ko' ? 'USLab.ai 소개' : 'About USLab.ai');
  const title = about.seo_title || (lang === 'ko' ? '소개 | USLab.ai' : 'About | USLab.ai');
  
  // 첫 번째 이미지를 OG 이미지로 사용
  const ogImage = extractFirstImageUrl(about.content) ? [extractFirstImageUrl(about.content)!] : undefined;

  // 메타데이터가 항상 생성되도록 보장
  return {
    title: title,
    description: description,
    keywords: about.seo_keywords || undefined,
    alternates: {
      canonical: canonicalUrl,
      languages: alternateLanguages,
    },
    openGraph: {
      title: title,
      description: description,
      images: ogImage,
      url: canonicalUrl,
      type: 'website',
      siteName: 'USLab.ai',
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: ogImage,
    },
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

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://uslab.ai';
  const pageUrl = `${baseUrl}/${lang}/about`;
  const modifiedDate = about.updated_at || about.created_at;

  // Description fallback for JSON-LD (generateMetadata와 동일하게)
  const descriptionForJsonLd = about.seo_description || extractTextFromContent(about.content, 150);

  // AboutPage JSON-LD 구조화 데이터
  const aboutPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: about.seo_title || (lang === 'ko' ? '소개 | USLab.ai' : 'About | USLab.ai'),
    description: descriptionForJsonLd,
    image: extractFirstImageUrl(about.content) ? [extractFirstImageUrl(about.content)!] : undefined,
    dateModified: modifiedDate,
    publisher: {
      '@type': 'Organization',
      name: 'USLab.ai',
      url: baseUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/img/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': pageUrl,
    },
  };

  // BreadcrumbList JSON-LD
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: lang === 'ko' ? '홈' : 'Home',
        item: `${baseUrl}/${lang}`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: lang === 'ko' ? '소개' : 'About',
        item: pageUrl,
      },
    ],
  };

  // Organization JSON-LD (사이트 전체)
  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'USLab.ai',
    url: baseUrl,
    logo: `${baseUrl}/img/logo.png`,
    sameAs: [
      // 소셜 미디어 링크가 있다면 추가
    ],
  };

  return (
    <div className="min-h-screen dark:bg-slate-950 bg-white">
      {/* JSON-LD 구조화 데이터 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutPageJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />

      <Navbar />
      <div className="pt-16 sm:pt-20">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-8 sm:py-12 lg:py-16">
          {/* 본문 */}
          <AboutViewer about={about} htmlContent={htmlContent} />
        </div>
      </div>
      <Footer />
    </div>
  );
}

