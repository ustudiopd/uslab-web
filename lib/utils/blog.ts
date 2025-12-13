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
