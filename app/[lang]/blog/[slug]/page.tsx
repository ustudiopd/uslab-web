import { getPostBySlug, getPostAlternates } from '@/lib/queries/posts';
import PostViewer from '@/components/blog/PostViewer';
import CommentSection from '@/components/blog/CommentSection';
import ThemeToggle from '@/components/blog/ThemeToggle';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { notFound } from 'next/navigation';
import type { Locale } from '@/lib/i18n/config';
import type { Metadata } from 'next';

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
  const { lang, slug } = await params;
  const post = await getPostBySlug(lang, slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen dark:bg-slate-950 bg-white">
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




