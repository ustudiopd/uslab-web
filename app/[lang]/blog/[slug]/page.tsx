import { getPostBySlug, getPostAlternates } from '@/lib/queries/posts';
import PostViewer from '@/components/blog/PostViewer';
import { notFound } from 'next/navigation';
import type { Locale } from '@/lib/i18n/config';
import type { Metadata } from 'next';

interface BlogPostPageProps {
  params: { lang: Locale; slug: string };
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { lang, slug } = params;
  const post = await getPostBySlug(lang, slug);

  if (!post) {
    return {
      title: lang === 'ko' ? '포스트를 찾을 수 없습니다 | USlab.ai' : 'Post not found | USlab.ai',
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

  return {
    title: post.seo_title || post.title,
    description: post.seo_description || undefined,
    keywords: post.seo_keywords || undefined,
    alternates: {
      languages: alternateLanguages,
    },
    openGraph: {
      title: post.seo_title || post.title,
      description: post.seo_description || undefined,
      images: post.thumbnail_url ? [post.thumbnail_url] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { lang, slug } = params;
  const post = await getPostBySlug(lang, slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-950 pt-20">
      <PostViewer post={post} />
    </div>
  );
}

