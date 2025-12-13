'use client';

import Link from 'next/link';
import type { UslabPost } from '@/lib/types/blog';
import type { Locale } from '@/lib/i18n/config';
import { getPostThumbnail } from '@/lib/utils/blog';

interface PostCardProps {
  post: UslabPost;
  lang: Locale;
  variant?: 'card' | 'list';
}

export default function PostCard({ post, lang, variant = 'card' }: PostCardProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const thumbnailUrl = getPostThumbnail(post);

  // 리스트형 레이아웃
  if (variant === 'list') {
    return (
      <Link
        href={`/${lang}/blog/${post.slug}`}
        className="group flex gap-6 bg-slate-900/50 dark:bg-slate-900/50 bg-white border border-slate-800 dark:border-slate-800 border-slate-200 rounded-lg overflow-hidden hover:border-cyan-500/50 transition-all duration-300"
      >
        {thumbnailUrl && (
          <div className="w-48 h-32 flex-shrink-0 overflow-hidden bg-slate-800 dark:bg-slate-800 bg-slate-200">
            <img
              src={thumbnailUrl}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
        <div className="flex-1 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-400 dark:text-slate-400 text-slate-600 mb-3">
              <span>{formatDate(post.published_at)}</span>
              {post.seo_keywords && post.seo_keywords.length > 0 && (
                <>
                  <span>•</span>
                  <span className="text-cyan-500">{post.seo_keywords[0]}</span>
                </>
              )}
            </div>
            <h3 className="text-xl font-bold dark:text-white text-slate-900 mb-2 group-hover:text-cyan-400 transition-colors">
              {post.title}
            </h3>
            {post.seo_description && (
              <p className="text-slate-400 dark:text-slate-400 text-slate-600 text-sm line-clamp-2 mb-4">
                {post.seo_description}
              </p>
            )}
          </div>
          <div className="flex items-center text-cyan-500 text-sm font-medium group-hover:text-cyan-400">
            {lang === 'ko' ? '자세히 보기' : 'Read more'}
            <i className="fas fa-arrow-right ml-2 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </Link>
    );
  }

  // 카드형 레이아웃 (기본)
  return (
    <Link
      href={`/${lang}/blog/${post.slug}`}
      className="group block bg-slate-900/50 dark:bg-slate-900/50 bg-white border border-slate-800 dark:border-slate-800 border-slate-200 rounded-lg overflow-hidden hover:border-cyan-500/50 transition-all duration-300"
    >
      {thumbnailUrl && (
        <div className="aspect-video w-full overflow-hidden bg-slate-800 dark:bg-slate-800 bg-slate-200">
          <img
            src={thumbnailUrl}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      <div className="p-6">
        <div className="flex items-center gap-2 text-sm text-slate-400 dark:text-slate-400 text-slate-600 mb-3">
          <span>{formatDate(post.published_at)}</span>
          {post.seo_keywords && post.seo_keywords.length > 0 && (
            <>
              <span>•</span>
              <span className="text-cyan-500">{post.seo_keywords[0]}</span>
            </>
          )}
        </div>
        <h3 className="text-xl font-bold text-white dark:text-white text-slate-900 mb-2 group-hover:text-cyan-400 transition-colors">
          {post.title}
        </h3>
        {post.seo_description && (
          <p className="text-slate-400 dark:text-slate-400 text-slate-600 text-sm line-clamp-2 mb-4">
            {post.seo_description}
          </p>
        )}
        <div className="flex items-center text-cyan-500 text-sm font-medium group-hover:text-cyan-400">
          {lang === 'ko' ? '자세히 보기' : 'Read more'}
          <i className="fas fa-arrow-right ml-2 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
}











