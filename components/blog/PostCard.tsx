'use client';

import Link from 'next/link';
import type { UslabPost } from '@/lib/types/blog';
import type { Locale } from '@/lib/i18n/config';

interface PostCardProps {
  post: UslabPost;
  lang: Locale;
}

export default function PostCard({ post, lang }: PostCardProps) {
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
    <Link
      href={`/${lang}/blog/${post.slug}`}
      className="group block bg-slate-900/50 border border-slate-800 rounded-lg overflow-hidden hover:border-cyan-500/50 transition-all duration-300"
    >
      {post.thumbnail_url && (
        <div className="aspect-video w-full overflow-hidden bg-slate-800">
          <img
            src={post.thumbnail_url}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      <div className="p-6">
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
          <span>{formatDate(post.published_at)}</span>
          {post.seo_keywords && post.seo_keywords.length > 0 && (
            <>
              <span>•</span>
              <span className="text-cyan-500">{post.seo_keywords[0]}</span>
            </>
          )}
        </div>
        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
          {post.title}
        </h3>
        {post.seo_description && (
          <p className="text-slate-400 text-sm line-clamp-2 mb-4">
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

