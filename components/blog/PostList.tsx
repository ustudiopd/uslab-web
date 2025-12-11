'use client';

import type { UslabPost } from '@/lib/types/blog';
import type { Locale } from '@/lib/i18n/config';
import PostCard from './PostCard';

interface PostListProps {
  posts: UslabPost[];
  lang: Locale;
}

export default function PostList({ posts, lang }: PostListProps) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400 text-lg">
          {lang === 'ko' ? '아직 발행된 포스트가 없습니다.' : 'No published posts yet.'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} lang={lang} />
      ))}
    </div>
  );
}

