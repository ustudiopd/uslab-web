'use client';

import { useMemo, useEffect, useRef, useState } from 'react';
import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import { Image } from '@tiptap/extension-image';
import { Link } from '@tiptap/extension-link';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { HorizontalRule } from '@tiptap/extension-horizontal-rule';
import { Small } from '@/components/editor/extensions/Small';
import { Copy, Check } from 'lucide-react';
import type { UslabPost } from '@/lib/types/blog';

interface PostViewerProps {
  post: UslabPost;
}

export default function PostViewer({ post }: PostViewerProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const viewCountTracked = useRef(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

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
    if (!post.content || typeof post.content !== 'object') {
      return '<p>콘텐츠를 불러올 수 없습니다.</p>';
    }

    // 기본 extension 배열
    const extensions = [
      StarterKit,
      Image,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      TaskList,
      TaskItem,
      HorizontalRule,
    ];

    // Small extension을 안전하게 추가
    try {
      if (Small && typeof Small === 'object' && Small.name === 'small') {
        extensions.push(Small);
      }
    } catch (smallError) {
      console.warn('Small extension 추가 실패 (Small 없이 계속):', smallError);
    }

    // HTML 생성 시도
    try {
      return generateHTML(post.content, extensions);
    } catch (error) {
      console.error('Error rendering post content:', error);
      // 에러 상세 정보를 콘솔에 출력
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name,
        });
      }
      // Small extension을 제거하고 재시도
      if (extensions.includes(Small)) {
        console.warn('Small extension 제거 후 재시도');
        const extensionsWithoutSmall = extensions.filter(ext => ext !== Small);
        try {
          return generateHTML(post.content, extensionsWithoutSmall);
        } catch (fallbackError) {
          console.error('Small 없이도 렌더링 실패:', fallbackError);
        }
      }
      return '<p>콘텐츠를 렌더링하는 중 오류가 발생했습니다.</p>';
    }
  }, [post.content]);

  // 링크를 새창으로 열리도록 설정 및 URL 텍스트를 링크로 변환
  useEffect(() => {
    if (!contentRef.current) return;

    const setupLinks = () => {
      const links = contentRef.current?.querySelectorAll('a[href]');
      if (!links) return;
      
      links.forEach((link) => {
        const anchor = link as HTMLAnchorElement;
        // 새창으로 열리도록 설정
        anchor.target = '_blank';
        anchor.rel = 'noopener noreferrer';
      });
    };

    // URL 텍스트를 링크로 변환하는 함수
    const convertUrlsToLinks = () => {
      if (!contentRef.current) return;
      
      // 모든 텍스트 노드를 찾아서 URL 패턴을 링크로 변환
      const walker = document.createTreeWalker(
        contentRef.current,
        NodeFilter.SHOW_TEXT,
        null
      );
      
      const textNodes: Text[] = [];
      let node;
      while (node = walker.nextNode()) {
        if (node.textContent && /https?:\/\/[^\s\)]+/.test(node.textContent)) {
          textNodes.push(node as Text);
        }
      }
      
      textNodes.forEach((textNode) => {
        const text = textNode.textContent || '';
        const urlPattern = /(https?:\/\/[^\s\)]+)/g;
        const matches = Array.from(text.matchAll(urlPattern));
        
        if (matches.length > 0 && textNode.parentNode) {
          const fragment = document.createDocumentFragment();
          let lastIndex = 0;
          
          matches.forEach((match) => {
            if (match.index !== undefined) {
              // URL 앞의 텍스트 추가
              if (match.index > lastIndex) {
                fragment.appendChild(document.createTextNode(text.substring(lastIndex, match.index)));
              }
              
              // 링크 생성
              const link = document.createElement('a');
              link.href = match[0];
              link.target = '_blank';
              link.rel = 'noopener noreferrer';
              link.textContent = match[0];
              link.className = 'text-cyan-500 hover:text-cyan-400 underline';
              fragment.appendChild(link);
              
              lastIndex = match.index + match[0].length;
            }
          });
          
          // 남은 텍스트 추가
          if (lastIndex < text.length) {
            fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
          }
          
          // 원본 텍스트 노드를 fragment로 교체
          textNode.parentNode.replaceChild(fragment, textNode);
        }
      });
    };

    // 초기 링크 설정
    setupLinks();
    
    // URL 텍스트를 링크로 변환 (약간의 지연 후 실행)
    setTimeout(() => {
      convertUrlsToLinks();
      setupLinks(); // 변환 후 다시 링크 설정
    }, 100);

    // MutationObserver를 사용하여 동적으로 추가되는 링크도 처리
    const observer = new MutationObserver(() => {
      setupLinks();
    });

    // DOM 변경 감지 시작
    observer.observe(contentRef.current, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
    };
  }, [htmlContent]);

  // 이미지 클릭 시 라이트박스 모달 열기
  useEffect(() => {
    if (!contentRef.current) return;

    const images = contentRef.current.querySelectorAll('img');
    
    images.forEach((img) => {
      const image = img as HTMLImageElement;
      
      // 이미 클릭 이벤트가 있으면 스킵
      if (image.dataset.clickHandlerAdded === 'true') return;
      
      // 클릭 가능한 커서 스타일 추가
      image.style.cursor = 'pointer';
      
      // 클릭 이벤트 추가
      const handleImageClick = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        // 라이트박스 모달 열기
        if (image.src) {
          setLightboxImage(image.src);
        }
      };
      
      image.addEventListener('click', handleImageClick);
      image.dataset.clickHandlerAdded = 'true';
    });
  }, [htmlContent]);

  // ESC 키로 라이트박스 닫기
  useEffect(() => {
    if (!lightboxImage) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxImage(null);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [lightboxImage]);

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
          prose-hr:border-slate-300 dark:prose-hr:border-slate-700
          prose-small:text-xs prose-small:dark:text-slate-400 prose-small:text-slate-600"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />

      {/* 이미지 라이트박스 모달 */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => setLightboxImage(null)}
        >
          {/* 닫기 버튼 */}
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 p-3 rounded-full bg-slate-800/80 hover:bg-slate-700/80 text-white transition-colors z-10"
            aria-label="닫기"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>

          {/* 이미지 */}
          <div
            className="max-w-[90vw] max-h-[90vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxImage}
              alt="확대 이미지"
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}
    </article>
  );
}











