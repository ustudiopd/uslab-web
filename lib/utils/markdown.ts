/**
 * Markdown Import/Export 유틸리티
 * 
 * Tiptap JSON ↔ Markdown 변환
 */

import { Editor } from '@tiptap/core';
import { Markdown } from '@tiptap/markdown';
import StarterKit from '@tiptap/starter-kit';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { HorizontalRule } from '@tiptap/extension-horizontal-rule';
import { Image } from '@tiptap/extension-image';
import type { JSONContent } from 'novel';

// Markdown 변환에 사용할 확장 세트
const markdownExtensions = [
  StarterKit,
  Markdown,
  TaskList,
  TaskItem,
  HorizontalRule,
  Image,
];

/**
 * 임시 Editor 인스턴스 생성 (변환용)
 */
function createTempEditor(content?: string, contentType: 'html' | 'markdown' = 'html') {
  return new Editor({
    extensions: markdownExtensions,
    content: content || '',
    editorProps: {
      attributes: {
        class: 'prose',
      },
    },
    ...(contentType === 'markdown' && { contentType: 'markdown' }),
  });
}

/**
 * Markdown 텍스트를 Tiptap JSON으로 변환
 */
export function markdownToJSON(markdown: string): JSONContent {
  try {
    const editor = createTempEditor(markdown, 'markdown');
    const json = editor.getJSON() as JSONContent;
    editor.destroy();
    return json;
  } catch (error) {
    console.error('Markdown to JSON conversion error:', error);
    throw new Error('마크다운 변환에 실패했습니다.');
  }
}

/**
 * Tiptap JSON을 Markdown 텍스트로 변환
 */
export function jsonToMarkdown(json: JSONContent): string {
  try {
    const editor = createTempEditor();
    editor.commands.setContent(json);
    // getMarkdown() 메서드 사용 (Markdown 확장이 추가되면 사용 가능)
    const markdown = (editor as any).getMarkdown?.() || '';
    editor.destroy();
    return markdown || '';
  } catch (error) {
    console.error('JSON to Markdown conversion error:', error);
    // Fallback: MarkdownManager 직접 사용
    try {
      // 동적 import는 async 함수에서만 가능하므로, 여기서는 직접 사용
      const { MarkdownManager } = require('@tiptap/markdown');
      const manager = new MarkdownManager({ extensions: markdownExtensions });
      return manager.serialize(json);
    } catch (fallbackError) {
      console.error('Fallback markdown conversion error:', fallbackError);
      throw new Error('마크다운 변환에 실패했습니다.');
    }
  }
}

/**
 * .md 파일을 읽어서 Tiptap JSON으로 변환
 */
export async function readMarkdownFile(file: File): Promise<JSONContent> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const markdown = e.target?.result as string;
        const json = markdownToJSON(markdown);
        resolve(json);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('파일 읽기에 실패했습니다.'));
    };
    
    reader.readAsText(file);
  });
}

/**
 * Markdown 텍스트를 클립보드에 복사
 */
export async function copyMarkdownToClipboard(markdown: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(markdown);
  } catch (error) {
    console.error('Clipboard copy error:', error);
    throw new Error('클립보드 복사에 실패했습니다.');
  }
}

/**
 * Markdown 텍스트를 .md 파일로 다운로드
 */
export function downloadMarkdownFile(markdown: string, filename: string = 'post.md'): void {
  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}





