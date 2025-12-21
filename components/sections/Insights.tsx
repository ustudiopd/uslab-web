import Link from 'next/link';
import { getPublishedPosts } from '@/lib/queries/posts';
import type { Locale } from '@/lib/i18n/config';
import { getPostThumbnail } from '@/lib/utils/blog';
import Image from 'next/image';

interface InsightsProps {
  lang: Locale;
}

export default async function Insights({ lang }: InsightsProps) {
  // 최신 블로그 포스트 3개 가져오기
  const { posts } = await getPublishedPosts(lang, { page: 1, limit: 3 });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <section
      id="insights"
      className="py-12 sm:py-16 lg:py-24 dark:bg-slate-950 bg-white border-t dark:border-slate-900 border-slate-200/60"
    >
      <div className="w-full max-w-1160 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 sm:mb-16">
          <h2 className="text-[10px] font-mono text-blue-600 mb-1 uppercase tracking-wider">
            {lang === 'ko' ? 'USLab AI 인사이트' : 'USLab AI Insights'}
          </h2>
          <div className="flex justify-between items-end">
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold dark:text-white text-slate-900 leading-tight">
              {lang === 'ko' ? '최신 인사이트' : 'Latest Insights'}
              <br className="md:hidden" />
              <span className="md:ml-2 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 bg-clip-text text-transparent">
                {lang === 'ko' ? '를 확인하세요' : ''}
              </span>
            </h3>
            <Link
              href={`/${lang}/blog`}
              className="hidden md:inline-flex items-center gap-2 text-blue-600 font-bold hover:text-blue-800 transition-colors group"
            >
              {lang === 'ko' ? '전체 아티클 보기' : 'View All Articles'}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 group-hover:translate-x-1 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </Link>
          </div>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-400 dark:text-slate-400 text-slate-600 text-lg">
              {lang === 'ko' ? '아직 발행된 포스트가 없습니다.' : 'No published posts yet.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {posts.map((post) => {
              const thumbnailUrl = getPostThumbnail(post);
              return (
                <Link
                  key={post.id}
                  href={`/${lang}/blog/${post.slug}`}
                  className="group block bg-white border border-slate-200/60 rounded-2xl overflow-hidden hover:border-blue-300/50 transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:-translate-y-1 hover:shadow-blue-glow h-full flex flex-col relative"
                >
                  {thumbnailUrl && (
                    <div className="aspect-video w-full overflow-hidden bg-slate-100 relative">
                      <Image
                        src={thumbnailUrl}
                        alt={post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                  )}
                  <div className="p-7 flex-1 flex flex-col">
                    <div className="mb-5 flex items-center justify-between">
                      <span className="inline-flex items-center bg-blue-50 text-blue-600 text-xs px-3 py-1.5 rounded-full font-bold group-hover:bg-blue-100 transition-colors">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2" />
                        {post.seo_keywords && post.seo_keywords.length > 0
                          ? post.seo_keywords[0]
                          : lang === 'ko'
                          ? '아티클'
                          : 'Article'}
                      </span>
                      <span className="text-slate-400 text-sm font-medium">
                        {formatDate(post.published_at)}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-4 leading-snug group-hover:text-blue-700 transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    {post.seo_description && (
                      <p className="text-slate-600 mb-8 leading-relaxed line-clamp-3 flex-grow">
                        {post.seo_description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 pt-5 border-t border-slate-100">
                      <div className="w-9 h-9 rounded-full bg-slate-200 ring-2 ring-white flex items-center justify-center text-slate-500 text-sm font-bold">
                        US
                      </div>
                      <div>
                        <span className="text-sm font-bold text-slate-900 block">
                          {lang === 'ko' ? 'USLab Team' : 'USLab Team'}
                        </span>
                        <span className="text-xs text-slate-500">
                          {lang === 'ko' ? '아티클' : 'Article'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-0 translate-x-1/2 -translate-y-1/2" />
                </Link>
              );
            })}
          </div>
        )}

        <div className="mt-10 text-center md:hidden">
          <Link
            href={`/${lang}/blog`}
            className="inline-flex items-center gap-2 text-blue-600 font-bold hover:text-blue-800 transition-colors"
          >
            {lang === 'ko' ? '전체 아티클 보기 →' : 'View All Articles →'}
          </Link>
        </div>
      </div>
    </section>
  );
}

