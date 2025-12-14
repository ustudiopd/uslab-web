'use client';

import { useMemo, useEffect, useRef, useState } from 'react';
import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import { Image } from '@tiptap/extension-image';
import { Link } from '@tiptap/extension-link';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { HorizontalRule } from '@tiptap/extension-horizontal-rule';
import { Youtube } from '@tiptap/extension-youtube';
import { Small } from '@/components/editor/extensions/Small';
import type { UslabAbout } from '@/lib/types/about';

interface AboutViewerProps {
  about: UslabAbout;
  htmlContent?: string; // 서버에서 생성된 HTML (선택적)
}

export default function AboutViewer({ about, htmlContent: serverHtmlContent }: AboutViewerProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const viewCountTracked = useRef(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // 클라이언트 마운트 확인
  useEffect(() => {
    setMounted(true);
  }, []);

  // 조회수 증가 (한 번만 실행)
  useEffect(() => {
    if (viewCountTracked.current || !mounted) return;
    
    viewCountTracked.current = true;
    
    // 조회수 증가 API 호출
    fetch(`/api/about/${about.locale}/view`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }).catch((error) => {
      console.error('Failed to increment view count:', error);
    });
  }, [about.locale, mounted]);

  // Tiptap JSON을 HTML로 변환
  // 서버에서 HTML이 제공되면 사용하고, 없으면 클라이언트에서 생성
  const htmlContent = useMemo(() => {
    // 서버에서 생성된 HTML이 있으면 사용
    if (serverHtmlContent) {
      return serverHtmlContent;
    }

    // 클라이언트에서만 생성 (서버 HTML이 없는 경우)
    if (!mounted) {
      return '';
    }

    if (!about.content || typeof about.content !== 'object') {
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
      Youtube.configure({
        controls: true,
        nocookie: false,
        width: 0, // CSS로 제어하므로 0으로 설정
        height: 0, // CSS로 제어하므로 0으로 설정
        HTMLAttributes: {
          class: 'rounded-lg border border-slate-700',
          style: 'width: 100%; aspect-ratio: 16/9;',
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
      return generateHTML(about.content, extensions);
    } catch (error) {
      console.error('Error rendering about content:', error);
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
          return generateHTML(about.content, extensionsWithoutSmall);
        } catch (fallbackError) {
          console.error('Small 없이도 렌더링 실패:', fallbackError);
        }
      }
      return '<p>콘텐츠를 렌더링하는 중 오류가 발생했습니다.</p>';
    }
  }, [about.content, mounted, serverHtmlContent]);

  // 링크를 새창으로 열리도록 설정 및 URL 텍스트를 링크로 변환
  useEffect(() => {
    if (!contentRef.current || !mounted) return;

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
  }, [htmlContent, mounted]);

  // 이미지 클릭 시 라이트박스 모달 열기
  useEffect(() => {
    if (!contentRef.current || !mounted) return;

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
  }, [htmlContent, mounted]);

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

  // YouTube iframe을 16:9 비율로 조정
  useEffect(() => {
    if (!contentRef.current || !mounted) return;

    const youtubeIframes = contentRef.current.querySelectorAll('iframe[src*="youtube"], iframe[src*="youtu.be"]');
    
    youtubeIframes.forEach((iframe) => {
      const element = iframe as HTMLIFrameElement;
      // 이미 처리된 iframe은 스킵
      if (element.dataset.aspectRatioApplied === 'true') return;
      
      // wrapper div 생성
      const wrapper = document.createElement('div');
      wrapper.className = 'youtube-wrapper relative w-full';
      wrapper.style.paddingBottom = '56.25%'; // 16:9 비율
      wrapper.style.height = '0';
      wrapper.style.overflow = 'hidden';
      wrapper.style.borderRadius = '0.5rem';
      wrapper.style.border = '1px solid rgb(51 65 85)';
      
      // iframe 스타일 설정
      element.style.position = 'absolute';
      element.style.top = '0';
      element.style.left = '0';
      element.style.width = '100%';
      element.style.height = '100%';
      element.style.border = 'none';
      
      // iframe을 wrapper로 감싸기
      if (element.parentNode) {
        element.parentNode.insertBefore(wrapper, element);
        wrapper.appendChild(element);
        element.dataset.aspectRatioApplied = 'true';
      }
    });
  }, [htmlContent, mounted]);

  return (
    <div className="max-w-4xl mx-auto">
      {/* 본문 (Tailwind Typography 적용) */}
      <div
        ref={contentRef}
        className="prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg max-w-none
          prose-headings:dark:text-white prose-headings:text-slate-900 prose-headings:font-bold
          prose-h1:text-2xl sm:prose-h1:text-3xl lg:prose-h1:text-4xl
          prose-h2:text-xl sm:prose-h2:text-2xl lg:prose-h2:text-3xl
          prose-h3:text-lg sm:prose-h3:text-xl lg:prose-h3:text-2xl
          prose-h4:text-base sm:prose-h4:text-lg lg:prose-h4:text-xl
          prose-p:dark:text-slate-300 prose-p:text-slate-900 prose-p:leading-relaxed prose-p:text-sm sm:prose-p:text-base
          prose-a:text-cyan-500 prose-a:no-underline hover:prose-a:text-cyan-400 hover:prose-a:underline
          prose-strong:dark:text-white prose-strong:text-slate-900 prose-strong:font-semibold
          prose-code:dark:text-cyan-400 prose-code:text-cyan-600 prose-code:dark:bg-slate-800 prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:text-xs sm:prose-code:text-sm
          prose-pre:bg-slate-900 dark:prose-pre:bg-slate-900 prose-pre:bg-slate-100 prose-pre:border-2 prose-pre:border-slate-800 dark:prose-pre:border-slate-800 prose-pre:border-slate-300 prose-pre:rounded-lg prose-pre:relative prose-pre:text-xs sm:prose-pre:text-sm
          prose-blockquote:border-l-4 prose-blockquote:border-cyan-500 prose-blockquote:dark:text-slate-300 prose-blockquote:text-slate-800 prose-blockquote:bg-slate-50 dark:prose-blockquote:bg-slate-900/50 prose-blockquote:pl-3 sm:prose-blockquote:pl-4 prose-blockquote:py-2 prose-blockquote:my-3 sm:prose-blockquote:my-4
          prose-ul:dark:text-slate-300 prose-ul:text-slate-900 prose-ol:dark:text-slate-300 prose-ol:text-slate-900
          prose-li:dark:text-slate-300 prose-li:text-slate-900 prose-li:text-sm sm:prose-li:text-base
          prose-img:rounded-lg prose-img:border-2 prose-img:border-slate-800 dark:prose-img:border-slate-800 prose-img:border-slate-300 prose-img:shadow-lg prose-img:my-3 sm:prose-img:my-4
          prose-hr:border-slate-300 dark:prose-hr:border-slate-700 prose-hr:my-3 sm:prose-hr:my-4
          prose-small:text-[10px] sm:prose-small:text-xs prose-small:dark:text-slate-400 prose-small:text-slate-600"
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
    </div>
  );
}

