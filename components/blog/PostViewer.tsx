'use client';

import { useMemo, useEffect, useRef } from 'react';
import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import { Image } from '@tiptap/extension-image';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { HorizontalRule } from '@tiptap/extension-horizontal-rule';
import { Copy, Check } from 'lucide-react';
import type { UslabPost } from '@/lib/types/blog';

interface PostViewerProps {
  post: UslabPost;
}

export default function PostViewer({ post }: PostViewerProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const viewCountTracked = useRef(false);

  // 조회수 증가 (발행된 포스트만, 한 번만 실행)
  useEffect(() => {
    if (viewCountTracked.current || !post.is_published) return;
    
    viewCountTracked.current = true;
    
    // 조회수 증가 API 호출
    fetch(`/api/posts/${post.id}/view`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }).catch((error) => {
      console.error('Failed to increment view count:', error);
    });
  }, [post.id, post.is_published]);

  // Tiptap JSON을 HTML로 변환
  const htmlContent = useMemo(() => {
    try {
      if (!post.content || typeof post.content !== 'object') {
        return '<p>콘텐츠를 불러올 수 없습니다.</p>';
      }

      return generateHTML(post.content, [
        StarterKit,
        Image,
        TaskList,
        TaskItem,
        HorizontalRule,
      ]);
    } catch (error) {
      console.error('Error rendering post content:', error);
      return '<p>콘텐츠를 렌더링하는 중 오류가 발생했습니다.</p>';
    }
  }, [post.content]);

  // 코드 블록에 복사 버튼 추가
  useEffect(() => {
    if (!contentRef.current) return;

    const preElements = contentRef.current.querySelectorAll('pre');
    
    preElements.forEach((element) => {
      const pre = element as HTMLPreElement;
      
      // 이미 복사 버튼이 있으면 스킵
      if (pre.querySelector('.copy-code-button')) return;

      // pre 요소를 relative로 만들기
      pre.style.position = 'relative';

      // 복사 버튼 생성 (pre 요소 안에 직접 추가)
      const copyButton = document.createElement('button');
      copyButton.className = 'copy-code-button absolute top-3 right-3 p-2 rounded-full border dark:border-slate-600 border-slate-400 dark:bg-slate-700/90 bg-slate-800/95 backdrop-blur-sm dark:text-slate-300 text-white hover:bg-slate-700 dark:hover:bg-slate-600 hover:bg-slate-900 transition-all z-20 shadow-lg';
      copyButton.setAttribute('aria-label', '코드 복사');
      
      const copyIcon = document.createElement('div');
      copyIcon.className = 'copy-icon';
      copyIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2"/></svg>';
      copyButton.appendChild(copyIcon);

      // 툴팁 생성
      const tooltip = document.createElement('div');
      tooltip.className = 'absolute top-full right-0 mt-2 px-2 py-1 text-xs font-medium text-white bg-slate-900 dark:bg-slate-800 rounded shadow-lg opacity-0 pointer-events-none transition-opacity whitespace-nowrap z-30';
      tooltip.textContent = '코드 복사';
      copyButton.appendChild(tooltip);

      // 툴팁 표시/숨김
      copyButton.addEventListener('mouseenter', () => {
        tooltip.classList.remove('opacity-0');
        tooltip.classList.add('opacity-100');
      });
      copyButton.addEventListener('mouseleave', () => {
        tooltip.classList.remove('opacity-100');
        tooltip.classList.add('opacity-0');
      });

      // pre 요소에 직접 추가
      pre.appendChild(copyButton);

      // 복사 기능
      const handleCopy = async () => {
        const codeElement = pre.querySelector('code');
        if (!codeElement) return;

        const codeText = codeElement.textContent || '';
        
        try {
          await navigator.clipboard.writeText(codeText);
          
          // 복사 성공 피드백
          copyIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
          copyButton.classList.remove('text-white', 'dark:text-slate-300');
          copyButton.classList.add('text-green-400', 'dark:text-green-400');
          tooltip.textContent = '복사됨!';
          
          setTimeout(() => {
            copyIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2"/></svg>';
            copyButton.classList.remove('text-green-400', 'dark:text-green-400');
            copyButton.classList.add('dark:text-slate-300', 'text-white');
            tooltip.textContent = '코드 복사';
          }, 2000);
        } catch (error) {
          console.error('복사 실패:', error);
        }
      };

      copyButton.addEventListener('click', handleCopy);
    });
  }, [htmlContent]);

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* 제목 */}
      <header className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold dark:text-white text-slate-900 mb-4">
          {post.title}
        </h1>
        {post.published_at && (
          <div className="flex items-center gap-4 text-slate-400 dark:text-slate-400 text-slate-600 dark:text-slate-600 text-sm">
            <time dateTime={post.published_at}>
              {new Date(post.published_at).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
            {post.view_count !== undefined && (
              <span className="flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="inline-block"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                {post.view_count.toLocaleString()}
              </span>
            )}
            {post.seo_keywords && post.seo_keywords.length > 0 && (
              <div className="flex items-center gap-2">
                {post.seo_keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-slate-800 dark:bg-slate-800 bg-slate-100 rounded text-cyan-500 text-xs"
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
        ref={contentRef}
        className="prose dark:prose-invert prose-lg max-w-none
          prose-headings:dark:text-white prose-headings:text-slate-900 prose-headings:font-bold
          prose-p:dark:text-slate-300 prose-p:text-slate-900 prose-p:leading-relaxed
          prose-a:text-cyan-500 prose-a:no-underline hover:prose-a:text-cyan-400 hover:prose-a:underline
          prose-strong:dark:text-white prose-strong:text-slate-900 prose-strong:font-semibold
          prose-code:dark:text-cyan-400 prose-code:text-cyan-600 prose-code:dark:bg-slate-800 prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:text-sm
          prose-pre:bg-slate-900 dark:prose-pre:bg-slate-900 prose-pre:bg-slate-100 prose-pre:border-2 prose-pre:border-slate-800 dark:prose-pre:border-slate-800 prose-pre:border-slate-300 prose-pre:rounded-lg prose-pre:relative
          prose-blockquote:border-l-4 prose-blockquote:border-cyan-500 prose-blockquote:dark:text-slate-300 prose-blockquote:text-slate-800 prose-blockquote:bg-slate-50 dark:prose-blockquote:bg-slate-900/50 prose-blockquote:pl-4 prose-blockquote:py-2 prose-blockquote:my-4
          prose-ul:dark:text-slate-300 prose-ul:text-slate-900 prose-ol:dark:text-slate-300 prose-ol:text-slate-900
          prose-li:dark:text-slate-300 prose-li:text-slate-900
          prose-img:rounded-lg prose-img:border-2 prose-img:border-slate-800 dark:prose-img:border-slate-800 prose-img:border-slate-300 prose-img:shadow-lg
          prose-hr:border-slate-300 dark:prose-hr:border-slate-700"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </article>
  );
}











