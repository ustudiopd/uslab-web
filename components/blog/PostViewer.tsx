'use client';

import { useMemo } from 'react';
import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import type { UslabPost } from '@/lib/types/blog';

interface PostViewerProps {
  post: UslabPost;
}

export default function PostViewer({ post }: PostViewerProps) {
  // Tiptap JSON을 HTML로 변환
  const htmlContent = useMemo(() => {
    try {
      if (!post.content || typeof post.content !== 'object') {
        return '<p>콘텐츠를 불러올 수 없습니다.</p>';
      }

      return generateHTML(post.content, [StarterKit]);
    } catch (error) {
      console.error('Error rendering post content:', error);
      return '<p>콘텐츠를 렌더링하는 중 오류가 발생했습니다.</p>';
    }
  }, [post.content]);

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* 제목 */}
      <header className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          {post.title}
        </h1>
        {post.published_at && (
          <div className="flex items-center gap-4 text-slate-400 text-sm">
            <time dateTime={post.published_at}>
              {new Date(post.published_at).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
            {post.seo_keywords && post.seo_keywords.length > 0 && (
              <div className="flex items-center gap-2">
                {post.seo_keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-slate-800 rounded text-cyan-500 text-xs"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </header>

      {/* 썸네일 */}
      {post.thumbnail_url && (
        <div className="mb-8 rounded-lg overflow-hidden">
          <img
            src={post.thumbnail_url}
            alt={post.title}
            className="w-full h-auto object-cover"
          />
        </div>
      )}

      {/* 본문 (Tailwind Typography 적용) */}
      <div
        className="prose prose-invert prose-lg max-w-none
          prose-headings:text-white prose-headings:font-bold
          prose-p:text-slate-300 prose-p:leading-relaxed
          prose-a:text-cyan-500 prose-a:no-underline hover:prose-a:text-cyan-400 hover:prose-a:underline
          prose-strong:text-white prose-strong:font-semibold
          prose-code:text-cyan-400 prose-code:bg-slate-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
          prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-800
          prose-blockquote:border-cyan-500 prose-blockquote:text-slate-300
          prose-ul:text-slate-300 prose-ol:text-slate-300
          prose-li:text-slate-300
          prose-img:rounded-lg prose-img:border prose-img:border-slate-800"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </article>
  );
}



