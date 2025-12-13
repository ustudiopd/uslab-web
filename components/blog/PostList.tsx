'use client';

import { useState } from 'react';
import type { UslabPost } from '@/lib/types/blog';
import type { Locale } from '@/lib/i18n/config';
import PostCard from './PostCard';
import { LayoutGrid, List } from 'lucide-react';

interface PostListProps {
  posts: UslabPost[];
  lang: Locale;
}

type ViewMode = 'card' | 'list';

export default function PostList({ posts, lang }: PostListProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('card');

  if (posts.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400 dark:text-slate-400 text-slate-600 text-lg">
          {lang === 'ko' ? '아직 발행된 포스트가 없습니다.' : 'No published posts yet.'}
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* 뷰 모드 전환 버튼 */}
      <div className="flex justify-end mb-6 gap-2">
        <button
          onClick={() => setViewMode('card')}
          className={`p-2 rounded-lg border transition-colors ${
            viewMode === 'card'
              ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
              : 'bg-slate-800 dark:bg-slate-800 bg-slate-100 border-slate-700 dark:border-slate-700 border-slate-300 text-slate-400 dark:text-slate-400 text-slate-600 dark:text-slate-600 hover:border-slate-600 dark:hover:border-slate-600 hover:border-slate-400'
          }`}
          aria-label={lang === 'ko' ? '카드형 보기' : 'Card view'}
        >
          <LayoutGrid size={20} />
        </button>
        <button
          onClick={() => setViewMode('list')}
          className={`p-2 rounded-lg border transition-colors ${
            viewMode === 'list'
              ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
              : 'bg-slate-800 dark:bg-slate-800 bg-slate-100 border-slate-700 dark:border-slate-700 border-slate-300 text-slate-400 dark:text-slate-400 text-slate-600 dark:text-slate-600 hover:border-slate-600 dark:hover:border-slate-600 hover:border-slate-400'
          }`}
          aria-label={lang === 'ko' ? '리스트형 보기' : 'List view'}
        >
          <List size={20} />
        </button>
      </div>

      {/* 포스트 목록 */}
      {viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} lang={lang} variant="card" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} lang={lang} variant="list" />
          ))}
        </div>
      )}
    </div>
  );
}











