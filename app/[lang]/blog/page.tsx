import { getPublishedPosts } from '@/lib/queries/posts';
import PostList from '@/components/blog/PostList';
import ThemeToggle from '@/components/blog/ThemeToggle';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import type { Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/server';
import type { Metadata } from 'next';

interface BlogPageProps {
  params: Promise<{ lang: Locale }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return {
    title: lang === 'ko' ? '블로그 | USlab.ai' : 'Blog | USlab.ai',
    description: lang === 'ko' 
      ? 'AI 연구 인사이트 및 기술 아티클'
      : 'AI research insights and technical articles',
  };
}

export default async function BlogPage({ params, searchParams }: BlogPageProps) {
  const { lang } = await params;
  const { page: pageParam } = await searchParams;
  const page = parseInt(pageParam || '1', 10);
  const limit = 12;

  const { posts, total, totalPages } = await getPublishedPosts(lang, { page, limit });
  const dict = await getDictionary(lang);

  return (
    <div className="min-h-screen dark:bg-slate-950 bg-white">
      <Navbar />
      <div className="pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* 헤더 및 테마 전환 */}
          <div className="mb-12 flex justify-between items-start">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold dark:text-white text-slate-900 mb-4">
                {lang === 'ko' ? '블로그' : 'Blog'}
              </h1>
              <p className="text-slate-400 dark:text-slate-400 text-slate-600 dark:text-slate-600 text-lg">
                {lang === 'ko' 
                  ? 'AI 연구 인사이트 및 기술 아티클'
                  : 'AI research insights and technical articles'}
              </p>
            </div>
            {/* 테마 토글 버튼 (기능은 유지, UI만 숨김) */}
            {/* <ThemeToggle lang={lang} /> */}
          </div>

          {/* 포스트 목록 */}
          <PostList posts={posts} lang={lang} />

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="mt-12 flex justify-center items-center gap-4">
              {page > 1 && (
                <a
                  href={`/${lang}/blog?page=${page - 1}`}
                  className="px-4 py-2 bg-slate-800 dark:bg-slate-800 bg-slate-100 border border-slate-700 dark:border-slate-700 border-slate-300 text-white dark:text-white text-slate-900 rounded hover:border-cyan-500 transition-colors"
                >
                  {lang === 'ko' ? '이전' : 'Previous'}
                </a>
              )}
              <span className="text-slate-400 dark:text-slate-400 text-slate-600">
                {lang === 'ko' ? `페이지 ${page} / ${totalPages}` : `Page ${page} / ${totalPages}`}
              </span>
              {page < totalPages && (
                <a
                  href={`/${lang}/blog?page=${page + 1}`}
                  className="px-4 py-2 bg-slate-800 dark:bg-slate-800 bg-slate-100 border border-slate-700 dark:border-slate-700 border-slate-300 text-white dark:text-white text-slate-900 rounded hover:border-cyan-500 transition-colors"
                >
                  {lang === 'ko' ? '다음' : 'Next'}
                </a>
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}




