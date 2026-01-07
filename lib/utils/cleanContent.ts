/**
 * Tiptap JSONContent 정리 유틸리티
 * 빈 텍스트 노드 제거 및 유효성 검증
 */

import type { JSONContent } from 'novel';

/**
 * 빈 텍스트 노드를 제거하고 content를 정리
 * @param content 원본 JSONContent
 * @returns 정리된 JSONContent
 */
export function cleanContent(content: JSONContent | null | undefined): JSONContent | null {
  if (!content) {
    return null;
  }

  // deep clone
  const cleaned = JSON.parse(JSON.stringify(content)) as JSONContent;

  /**
   * 재귀적으로 노드를 정리하는 함수
   */
  function cleanNode(node: JSONContent): JSONContent | null {
    // 빈 텍스트 노드 제거 (type이 'text'이거나 type이 없고 text 속성이 있는 경우)
    if (node.type === 'text' || (!node.type && 'text' in node && typeof node.text === 'string')) {
      const textValue = node.text || '';
      if (textValue.trim().length === 0) {
        return null; // 빈 텍스트 노드는 제거
      }
      return node;
    }

    // content 배열이 있는 경우 재귀적으로 정리
    if (node.content && Array.isArray(node.content)) {
      const cleanedContent: JSONContent[] = [];
      
      for (const child of node.content) {
        // 먼저 빈 텍스트 노드인지 직접 확인
        if ((child.type === 'text' || (!child.type && 'text' in child)) && 
            (!child.text || (typeof child.text === 'string' && child.text.trim().length === 0))) {
          continue; // 빈 텍스트 노드는 건너뛰기
        }
        
        const cleanedChild = cleanNode(child);
        if (cleanedChild !== null) {
          // cleanedChild가 빈 텍스트 노드인지 다시 확인
          if ((cleanedChild.type === 'text' || (!cleanedChild.type && 'text' in cleanedChild)) && 
              (!cleanedChild.text || (typeof cleanedChild.text === 'string' && cleanedChild.text.trim().length === 0))) {
            continue; // 빈 텍스트 노드는 추가하지 않음
          }
          cleanedContent.push(cleanedChild);
        }
      }

      // content가 모두 제거되었고, 이 노드가 필수 content를 요구하는 경우
      if (cleanedContent.length === 0) {
        // paragraph나 heading 같은 경우 빈 paragraph 유지 (에디터에서 빈 상태로 표시)
        if (node.type === 'paragraph' || node.type === 'heading') {
          // 빈 paragraph는 content 배열을 비워둠 (Tiptap이 자동으로 처리)
          return {
            ...node,
            content: [],
          };
        } else if (node.type === 'doc') {
          // doc 노드는 최소한 빈 paragraph 하나는 필요
          return {
            ...node,
            content: [
              {
                type: 'paragraph',
                content: [],
              },
            ],
          };
        } else {
          // 다른 노드는 null 반환하여 제거
          return null;
        }
      }

      // cleanedContent에서 연속된 빈 텍스트 노드나 불필요한 노드 정리
      const finalContent: JSONContent[] = [];
      for (let i = 0; i < cleanedContent.length; i++) {
        const item = cleanedContent[i];
        
        // 빈 텍스트 노드 확인 (재확인) - type이 'text'이거나 type이 없고 text 속성이 있는 경우
        if ((item.type === 'text' || (!item.type && 'text' in item)) && 
            (!item.text || (typeof item.text === 'string' && item.text.trim().length === 0))) {
          continue; // 빈 텍스트 노드는 건너뛰기
        }
        
        // hardBreak 다음에 빈 텍스트가 오는 경우 제거
        if (item.type === 'hardBreak' && i + 1 < cleanedContent.length) {
          const next = cleanedContent[i + 1];
          if ((next.type === 'text' || (!next.type && 'text' in next)) && 
              (!next.text || (typeof next.text === 'string' && next.text.trim().length === 0))) {
            // hardBreak만 유지하고 빈 텍스트는 제거
            finalContent.push(item);
            i++; // 다음 항목 스킵
            continue;
          }
        }
        
        finalContent.push(item);
      }

      // 최종 content가 비어있으면 처리
      if (finalContent.length === 0) {
        if (node.type === 'paragraph' || node.type === 'heading') {
          return {
            ...node,
            content: [],
          };
        } else if (node.type === 'doc') {
          return {
            ...node,
            content: [
              {
                type: 'paragraph',
                content: [],
              },
            ],
          };
        }
        return null;
      }

      return {
        ...node,
        content: finalContent,
      };
    }

    // content가 없는 노드는 그대로 반환
    return node;
  }

  return cleanNode(cleaned);
}

/**
 * content가 유효한 Tiptap JSONContent인지 검증
 * @param content 검증할 content
 * @returns 유효하면 true
 */
export function isValidContent(content: JSONContent | null | undefined): boolean {
  if (!content) {
    return false;
  }

  // type이 'doc'이어야 함
  if (content.type !== 'doc') {
    return false;
  }

  // content 배열이 있어야 함
  if (!content.content || !Array.isArray(content.content)) {
    return false;
  }

  return true;
}
