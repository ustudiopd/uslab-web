/**
 * Tiptap JSON에서 텍스트 추출 유틸리티
 */

import type { JSONContent } from 'novel';
import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';

/**
 * Tiptap JSON에서 텍스트 추출 (HTML 태그 제거)
 * @param content Tiptap JSONContent
 * @param maxLength 최대 길이 (기본값: 150)
 * @returns 추출된 텍스트
 */
export function extractTextFromTiptap(
  content: JSONContent | null | undefined,
  maxLength: number = 150
): string {
  if (!content) {
    return '';
  }

  try {
    // Tiptap JSON → HTML
    const html = generateHTML(content, [StarterKit]);

    // HTML 태그 제거 및 텍스트 추출
    const text = html
      .replace(/<[^>]*>/g, '') // HTML 태그 제거
      .replace(/&nbsp;/g, ' ') // &nbsp; → 공백
      .replace(/&amp;/g, '&') // &amp; → &
      .replace(/&lt;/g, '<') // &lt; → <
      .replace(/&gt;/g, '>') // &gt; → >
      .replace(/&quot;/g, '"') // &quot; → "
      .replace(/&#39;/g, "'") // &#39; → '
      .trim();

    // 길이 제한
    if (text.length > maxLength) {
      return text.substring(0, maxLength) + '...';
    }

    return text;
  } catch (error) {
    console.error('Error extracting text from Tiptap:', error);
    return '';
  }
}

