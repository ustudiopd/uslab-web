/**
 * 블로그 관련 유틸리티 함수
 */

import type { JSONContent } from 'novel';

/**
 * Tiptap JSON content에서 첫 번째 이미지 URL을 추출
 */
export function extractFirstImageUrl(content: JSONContent | null | undefined): string | null {
  if (!content) return null;

  // 재귀적으로 이미지 노드를 찾는 함수
  function findImage(node: JSONContent): string | null {
    // 현재 노드가 이미지인 경우
    if (node.type === 'image' && node.attrs?.src) {
      return node.attrs.src;
    }

    // 자식 노드들을 재귀적으로 검색
    if (node.content && Array.isArray(node.content)) {
      for (const child of node.content) {
        const imageUrl = findImage(child);
        if (imageUrl) return imageUrl;
      }
    }

    return null;
  }

  return findImage(content);
}

/**
 * 포스트의 썸네일 URL을 반환 (thumbnail_url이 없으면 첫 번째 이미지 사용)
 */
export function getPostThumbnail(post: { thumbnail_url: string | null; content: JSONContent | null }): string | null {
  if (post.thumbnail_url) {
    return post.thumbnail_url;
  }
  return extractFirstImageUrl(post.content);
}

/**
 * Tiptap JSON content에서 텍스트를 추출 (HTML 태그 제거)
 * SEO description fallback으로 사용
 */
export function extractTextFromContent(content: JSONContent | null | undefined, maxLength: number = 150): string {
  if (!content) return '';

  // 재귀적으로 텍스트를 수집하는 함수
  function collectText(node: JSONContent): string {
    let text = '';

    // 현재 노드에 텍스트가 있는 경우
    if (node.text) {
      text += node.text;
    }

    // 자식 노드들을 재귀적으로 처리
    if (node.content && Array.isArray(node.content)) {
      for (const child of node.content) {
        text += collectText(child);
        // 이미 충분한 길이면 중단
        if (text.length >= maxLength) {
          break;
        }
      }
    }

    return text;
  }

  const fullText = collectText(content);
  
  // 공백 정리 및 길이 제한
  const cleaned = fullText
    .replace(/\s+/g, ' ') // 연속된 공백을 하나로
    .trim();

  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  // maxLength까지 자르고, 마지막 단어가 잘리지 않도록 처리
  const truncated = cleaned.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > maxLength * 0.8) {
    // 마지막 공백이 충분히 뒤에 있으면 그곳에서 자름
    return truncated.substring(0, lastSpace) + '...';
  }
  
  return truncated + '...';
}
