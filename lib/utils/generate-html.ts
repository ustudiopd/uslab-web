/**
 * Tiptap JSON을 HTML로 변환하는 유틸리티 함수
 * 서버와 클라이언트 모두에서 사용 가능
 */

import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import { Image } from '@tiptap/extension-image';
import { Link } from '@tiptap/extension-link';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { HorizontalRule } from '@tiptap/extension-horizontal-rule';
import { Youtube } from '@tiptap/extension-youtube';
import { Small } from '@/components/editor/extensions/Small';

/**
 * Tiptap JSON 콘텐츠를 HTML로 변환
 */
export function generateContentHTML(content: any): string {
  if (!content || typeof content !== 'object') {
    return '<p>콘텐츠를 불러올 수 없습니다.</p>';
  }

  // 기본 extension 배열
  const extensions = [
    StarterKit,
    Image.configure({
      HTMLAttributes: {
        class: 'rounded-lg border border-slate-300',
        style: 'max-width: 100%; height: auto; max-height: 600px; object-fit: contain; cursor: pointer;',
        loading: 'lazy',
        decoding: 'async',
      },
      inline: false,
    }),
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
      width: 560, // 표준 YouTube iframe 너비 (초기 공간 확보)
      height: 315, // 표준 YouTube iframe 높이 (16:9 비율)
      HTMLAttributes: {
        class: 'rounded-lg border border-slate-700',
        style: 'width: 100%; aspect-ratio: 16/9; min-height: 315px;',
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
    return generateHTML(content, extensions);
  } catch (error) {
    console.error('Error rendering content:', error);
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
        return generateHTML(content, extensionsWithoutSmall);
      } catch (fallbackError) {
        console.error('Small 없이도 렌더링 실패:', fallbackError);
      }
    }
    return '<p>콘텐츠를 렌더링하는 중 오류가 발생했습니다.</p>';
  }
}


