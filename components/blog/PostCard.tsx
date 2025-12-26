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
        className="group flex gap-6 bg-white border border-slate-200/60 rounded-2xl overflow-hidden hover:border-blue-300/50 transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:-translate-y-1 hover:shadow-blue-glow"
      >
        {thumbnailUrl && (
          <div className="w-48 h-32 flex-shrink-0 overflow-hidden bg-slate-100">
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
                  <span className="text-blue-600">{post.seo_keywords[0]}</span>
                </>
              )}
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-4 leading-snug group-hover:text-blue-700 transition-colors">
              {post.title}
            </h3>
            {post.seo_description && (
              <p className="text-slate-600 mb-8 leading-relaxed line-clamp-3 flex-grow">
                {post.seo_description}
              </p>
            )}
          </div>
          <div className="flex items-center text-blue-600 text-sm font-medium group-hover:text-blue-800">
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
      className="group block bg-white border border-slate-200/60 rounded-2xl overflow-hidden hover:border-blue-300/50 transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:-translate-y-1 hover:shadow-blue-glow h-full flex flex-col relative"
    >
      {thumbnailUrl && (
        <div className="aspect-video w-full overflow-hidden bg-slate-100">
          <img
            src={thumbnailUrl}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      <div className="p-7">
        <div className="mb-5 flex items-center justify-between">
          <span className="inline-flex items-center bg-blue-50 text-blue-600 text-xs px-3 py-1.5 rounded-full font-bold group-hover:bg-blue-100 transition-smooth">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2" />
            {post.seo_keywords && post.seo_keywords.length > 0 ? post.seo_keywords[0] : 'Article'}
          </span>
          <span className="text-slate-400 text-sm font-medium">{formatDate(post.published_at)}</span>
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-4 leading-snug group-hover:text-blue-700 transition-colors">
          {post.title}
        </h3>
        {post.seo_description && (
          <p className="text-slate-600 mb-8 leading-relaxed line-clamp-3 flex-grow">
            {post.seo_description}
          </p>
        )}
        <div className="flex items-center gap-3 pt-5 border-t border-slate-100">
          <div className="w-9 h-9 rounded-full bg-slate-200 ring-2 ring-white flex items-center justify-center text-slate-500 text-sm font-bold">US</div>
          <div>
            <span className="text-sm font-bold text-slate-900 block">USLab AI</span>
            <span className="text-xs text-slate-500">Article</span>
          </div>
        </div>
      </div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-0 translate-x-1/2 -translate-y-1/2" />
    </Link>
  );
}











