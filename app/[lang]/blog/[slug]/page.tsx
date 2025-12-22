import { getPostBySlug, getPostAlternates } from '@/lib/queries/posts';
import PostViewer from '@/components/blog/PostViewer';
import CommentSection from '@/components/blog/CommentSection';
import ThemeToggle from '@/components/blog/ThemeToggle';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { notFound } from 'next/navigation';
import type { Locale } from '@/lib/i18n/config';
import type { Metadata } from 'next';
import { extractTextFromContent, getPostThumbnail } from '@/lib/utils/blog';

interface BlogPostPageProps {
  params: Promise<{ lang: Locale; slug: string }>;
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { lang, slug } = await params;
  const post = await getPostBySlug(lang, slug);

  if (!post) {
    return {
      title: lang === 'ko' ? '포스트를 찾을 수 없습니다 | USLab.ai' : 'Post not found | USLab.ai',
    };
  }

  // 다른 언어 버전 찾기
  const alternates = post.canonical_id ? await getPostAlternates(post.canonical_id) : [];

  const alternateLanguages: Record<string, string> = {
    [lang]: `/${lang}/blog/${slug}`,
  };

  alternates.forEach((alt) => {
    if (alt.locale !== lang) {
      alternateLanguages[alt.locale] = `/${alt.locale}/blog/${alt.slug}`;
    }
  });

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://uslab.ai';
  const canonicalUrl = `${baseUrl}/${lang}/blog/${slug}`;

  // Description fallback: seo_description이 없으면 본문 첫 150자 사용
  const extractedDescription = extractTextFromContent(post.content, 150);
  const description = post.seo_description || extractedDescription || (lang === 'ko' ? 'USLab.ai 블로그 포스트' : 'USLab.ai blog post');
  const title = post.seo_title || post.title;
  
  // Open Graph 이미지 설정 (썸네일이 없으면 본문 첫 번째 이미지 사용)
  const thumbnailUrl = getPostThumbnail(post);
  let ogImage: string[] | undefined;
  if (thumbnailUrl) {
    // 이미 절대 URL인지 확인하고 절대 URL로 변환
    const imageUrl = thumbnailUrl.startsWith('http') 
      ? thumbnailUrl 
      : `${baseUrl}${thumbnailUrl.startsWith('/') ? '' : '/'}${thumbnailUrl}`;
    ogImage = [imageUrl];
  }

  // 메타데이터가 항상 생성되도록 보장
  return {
    title: title || (lang === 'ko' ? '블로그 포스트 | USLab.ai' : 'Blog Post | USLab.ai'),
    description: description,
    keywords: post.seo_keywords || undefined,
    alternates: {
      canonical: canonicalUrl,
      languages: alternateLanguages,
    },
    openGraph: {
      title: title,
      description: description,
      images: ogImage ? ogImage.map(img => ({
        url: img,
        width: 1200,
        height: 630,
        alt: title,
      })) : undefined,
      url: canonicalUrl,
      type: 'article',
      siteName: 'USLab.ai',
      locale: lang === 'ko' ? 'ko_KR' : 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: ogImage,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { lang, slug } = await params;
  const post = await getPostBySlug(lang, slug);

  if (!post) {
    notFound();
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://uslab.ai';
  const postUrl = `${baseUrl}/${lang}/blog/${slug}`;
  const publishedDate = post.published_at || post.created_at;
  const modifiedDate = post.updated_at || post.created_at;

  // Description fallback for JSON-LD (generateMetadata와 동일하게)
  const descriptionForJsonLd = post.seo_description || extractTextFromContent(post.content, 150);

  // JSON-LD 구조화 데이터
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.seo_title || post.title,
    description: descriptionForJsonLd,
    image: post.thumbnail_url ? [post.thumbnail_url] : undefined,
    datePublished: publishedDate,
    dateModified: modifiedDate,
    author: {
      '@type': 'Organization',
      name: 'USLab.ai',
      url: baseUrl,
    },
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
      '@id': postUrl,
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
        name: lang === 'ko' ? '블로그' : 'Blog',
        item: `${baseUrl}/${lang}/blog`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.title,
        item: postUrl,
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
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
      <div className="pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 테마 토글 버튼 (기능은 유지, UI만 숨김) */}
          {/* <div className="flex justify-end mb-6">
            <ThemeToggle lang={lang} />
          </div> */}
        </div>
        <PostViewer post={post} />
        <CommentSection postId={post.id} />
      </div>
      <Footer />
    </div>
  );
}




