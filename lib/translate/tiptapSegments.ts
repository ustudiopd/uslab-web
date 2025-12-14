/**
 * Tiptap JSON 문서에서 번역 대상 텍스트 노드를 수집하고 번역 결과를 적용하는 유틸리티
 */

import type { JSONContent } from 'novel';

/**
 * 번역 대상 텍스트 노드 참조
 */
export interface TextNodeRef {
  id: string;              // 세그먼트 고유 ID (예: "seg_1")
  path: (number | string)[]; // JSON 경로 (예: [0, 'content', 0, 'text'])
  text: string;            // 번역할 텍스트
  nodeType: string;        // 'heading' | 'paragraph' | 'listItem' | 'blockquote' | ...
  hasCodeMark?: boolean;   // inline code 마크가 있는지
  hint?: string;           // 컨텍스트 힌트 (선택적)
}

/**
 * Tiptap JSON 문서에서 번역 대상 텍스트 노드를 수집
 * @param doc Tiptap JSONContent
 * @param path 현재 경로 (재귀용)
 * @returns 번역 대상 텍스트 노드 배열 (경로 포함)
 */
export function collectTranslatableTextNodes(
  doc: JSONContent,
  path: (number | string)[] = []
): TextNodeRef[] {
  const segments: TextNodeRef[] = [];
  let segmentCounter = 0;

  function traverse(node: JSONContent, currentPath: (number | string)[]): void {
    // codeBlock 내부는 번역 제외
    if (node.type === 'codeBlock') {
      return;
    }

    // inline code 마크가 있는 텍스트는 번역 제외
    const hasCodeMark = node.marks?.some(mark => mark.type === 'code');

    // 텍스트 노드인 경우 (type이 없거나 'text'인 경우)
    if (node.type === 'text' || (!node.type && typeof node.text === 'string')) {
      const text = node.text || '';
      
      // 빈 텍스트는 제외
      if (text.trim().length === 0) {
        return;
      }

      // inline code 마크가 있으면 번역 제외
      if (hasCodeMark) {
        return;
      }

      // 번역 대상으로 추가
      segmentCounter++;
      const pathCopy: (number | string)[] = [...currentPath];
      segments.push({
        id: `seg_${segmentCounter}`,
        path: pathCopy,
        text: text,
        nodeType: currentPath.length > 0 ? 'text' : 'root',
        hasCodeMark: false,
      });
      return;
    }

    // 자식 노드가 있는 경우 재귀적으로 순회
    if (node.content && Array.isArray(node.content)) {
      node.content.forEach((child, index) => {
        const childPath = [...currentPath];
        
        // content 배열의 인덱스 추가
        if (currentPath.length === 0) {
          // 최상위 노드
          childPath.push(index);
        } else {
          // 중첩된 노드
          childPath.push('content', index);
        }
        
        traverse(child, childPath);
      });
    }

    // 특정 노드 타입의 경우 추가 처리
    const translatableNodeTypes = ['heading', 'paragraph', 'listItem', 'blockquote', 'bulletList', 'orderedList'];
    
      if (node.type && translatableNodeTypes.includes(node.type)) {
        // 노드 자체에 텍스트가 있는 경우 (일부 확장에서 사용)
        if (typeof node.text === 'string' && node.text.trim().length > 0 && !hasCodeMark) {
          segmentCounter++;
          const pathWithText: (number | string)[] = [...currentPath, 'text'];
          segments.push({
            id: `seg_${segmentCounter}`,
            path: pathWithText,
            text: node.text,
            nodeType: node.type,
            hasCodeMark: false,
          });
        }
      }
  }

  traverse(doc, path);
  return segments;
}

/**
 * 경로 기반으로 번역 결과를 문서에 적용 (Create 시 사용)
 */
export function applyTranslationsByPath(
  doc: JSONContent,
  translations: Array<{ id: string; text_en: string }>,
  refs: TextNodeRef[]
): JSONContent {
  // deep clone
  const result = JSON.parse(JSON.stringify(doc)) as JSONContent;
  
  // ID로 매핑 생성
  const translationMap = new Map<string, string>();
  translations.forEach(t => {
    translationMap.set(t.id, t.text_en);
  });

  // refs를 ID로 매핑
  const refMap = new Map<string, TextNodeRef>();
  refs.forEach(ref => {
    refMap.set(ref.id, ref);
  });

  // 각 번역을 경로에 따라 적용
  translations.forEach(translation => {
    const ref = refMap.get(translation.id);
    if (!ref) return;

    // 경로를 따라가서 텍스트 치환
    let current: any = result;
    for (let i = 0; i < ref.path.length - 1; i++) {
      const key = ref.path[i];
      if (typeof key === 'number') {
        if (Array.isArray(current)) {
          current = current[key];
        } else if (current.content && Array.isArray(current.content)) {
          current = current.content[key];
        } else {
          return; // 경로가 유효하지 않음
        }
      } else {
        current = current[key];
      }
      if (!current) return;
    }

    // 마지막 경로 요소가 텍스트 노드
    const lastKey = ref.path[ref.path.length - 1];
    if (typeof lastKey === 'number') {
      if (Array.isArray(current)) {
        if (current[lastKey] && typeof current[lastKey].text === 'string') {
          current[lastKey].text = translation.text_en;
        }
      } else if (current.content && Array.isArray(current.content)) {
        if (current.content[lastKey] && typeof current.content[lastKey].text === 'string') {
          current.content[lastKey].text = translation.text_en;
        }
      }
    } else if (lastKey === 'text' && typeof current.text === 'string') {
      current.text = translation.text_en;
    }
  });

  return result;
}

/**
 * 인덱스 기반으로 번역 결과를 문서에 적용 (Update 시 순서 기반 매칭)
 */
export function applyTranslationsByIndex(
  doc: JSONContent,
  refs: TextNodeRef[],
  translations: Array<{ id: string; text_en: string }>
): JSONContent {
  // deep clone
  const result = JSON.parse(JSON.stringify(doc)) as JSONContent;
  
  // ID로 매핑 생성
  const translationMap = new Map<string, string>();
  translations.forEach(t => {
    translationMap.set(t.id, t.text_en);
  });

  // refs와 translations를 인덱스로 매칭
  const minLength = Math.min(refs.length, translations.length);
  
  for (let i = 0; i < minLength; i++) {
    const ref = refs[i];
    const translation = translations[i];
    
    if (!ref || !translation) continue;

    // 경로를 따라가서 텍스트 치환
    let current: any = result;
    for (let j = 0; j < ref.path.length - 1; j++) {
      const key = ref.path[j];
      if (typeof key === 'number') {
        if (Array.isArray(current)) {
          current = current[key];
        } else if (current.content && Array.isArray(current.content)) {
          current = current.content[key];
        } else {
          break; // 경로가 유효하지 않음
        }
      } else {
        current = current[key];
      }
      if (!current) break;
    }

    // 마지막 경로 요소가 텍스트 노드
    const lastKey = ref.path[ref.path.length - 1];
    if (typeof lastKey === 'number') {
      if (Array.isArray(current)) {
        if (current[lastKey] && typeof current[lastKey].text === 'string') {
          current[lastKey].text = translation.text_en;
        }
      } else if (current.content && Array.isArray(current.content)) {
        if (current.content[lastKey] && typeof current.content[lastKey].text === 'string') {
          current.content[lastKey].text = translation.text_en;
        }
      }
    } else if (lastKey === 'text' && typeof current.text === 'string') {
      current.text = translation.text_en;
    }
  }

  return result;
}

/**
 * 경로 기반 매칭률 계산
 */
export function calculatePathMatchRate(
  koRefs: TextNodeRef[],
  enRefs: TextNodeRef[]
): number {
  if (koRefs.length === 0 || enRefs.length === 0) {
    return 0;
  }

  // 경로를 문자열로 변환하여 비교
  const koPaths = new Set(koRefs.map(ref => JSON.stringify(ref.path)));
  const enPaths = new Set(enRefs.map(ref => JSON.stringify(ref.path)));

  // 교집합 계산
  let matched = 0;
  koPaths.forEach(path => {
    if (enPaths.has(path)) {
      matched++;
    }
  });

  // 매칭률 = 교집합 / 전체 (더 큰 쪽 기준)
  const total = Math.max(koRefs.length, enRefs.length);
  return total > 0 ? matched / total : 0;
}

/**
 * 경로 기반 매칭으로 번역 결과를 문서에 적용 (Update 시 경로 기반 매칭)
 */
export function applyTranslationsByPathMatch(
  doc: JSONContent,
  koRefs: TextNodeRef[],
  enRefs: TextNodeRef[],
  translations: Array<{ id: string; text_en: string }>
): JSONContent {
  // deep clone
  const result = JSON.parse(JSON.stringify(doc)) as JSONContent;
  
  // ID로 매핑 생성
  const translationMap = new Map<string, string>();
  translations.forEach(t => {
    translationMap.set(t.id, t.text_en);
  });

  // KO refs를 ID로 매핑
  const koRefMap = new Map<string, TextNodeRef>();
  koRefs.forEach(ref => {
    koRefMap.set(ref.id, ref);
  });

  // 경로를 문자열로 변환하여 매칭
  const enPathToRef = new Map<string, TextNodeRef>();
  enRefs.forEach(ref => {
    enPathToRef.set(JSON.stringify(ref.path), ref);
  });

  // KO refs를 순회하며 같은 경로의 EN ref를 찾아 번역 적용
  koRefs.forEach(koRef => {
    const translation = translationMap.get(koRef.id);
    if (!translation) return;

    const pathStr = JSON.stringify(koRef.path);
    const enRef = enPathToRef.get(pathStr);
    if (!enRef) return; // 경로가 일치하지 않음

    // 경로를 따라가서 텍스트 치환
    let current: any = result;
    for (let i = 0; i < enRef.path.length - 1; i++) {
      const key = enRef.path[i];
      if (typeof key === 'number') {
        if (Array.isArray(current)) {
          current = current[key];
        } else if (current.content && Array.isArray(current.content)) {
          current = current.content[key];
        } else {
          return; // 경로가 유효하지 않음
        }
      } else {
        current = current[key];
      }
      if (!current) return;
    }

    // 마지막 경로 요소가 텍스트 노드
    const lastKey = enRef.path[enRef.path.length - 1];
    if (typeof lastKey === 'number') {
      if (Array.isArray(current)) {
        if (current[lastKey] && typeof current[lastKey].text === 'string') {
          current[lastKey].text = translation;
        }
      } else if (current.content && Array.isArray(current.content)) {
        if (current.content[lastKey] && typeof current.content[lastKey].text === 'string') {
          current.content[lastKey].text = translation;
        }
      }
    } else if (lastKey === 'text' && typeof current.text === 'string') {
      current.text = translation;
    }
  });

  return result;
}

