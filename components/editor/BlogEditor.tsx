'use client';

import { useMemo, useEffect, useRef } from 'react';
import { EditorRoot, EditorContent, StarterKit, UpdatedImage, createImageUpload, handleImagePaste, handleImageDrop, UploadImagesPlugin, TaskList, TaskItem, HorizontalRule as Horizontal, CustomKeymap, Command, EditorCommand, EditorCommandItem, EditorCommandList, EditorCommandEmpty } from 'novel';
import { handleCommandNavigation } from 'novel';
import type { JSONContent } from 'novel';
import { Markdown } from '@tiptap/markdown';
import { supabase } from '@/lib/supabase/client';
import { suggestionItems, slashCommand } from './extensions';
import { BubbleMenu } from './BubbleMenu';

interface BlogEditorProps {
  initialContent?: JSONContent | null;
  onChange: (content: JSONContent) => void;
  onSetThumbnail?: (url: string) => void;
  editorKey?: string | number; // 에디터 재생성을 위한 key
}

export default function BlogEditor({
  initialContent,
  onChange,
  onSetThumbnail,
  editorKey,
}: BlogEditorProps) {
  // 이미지 업로드 함수
  const uploadFn = useMemo(() => {
    return createImageUpload({
      validateFn: (file: File) => {
        if (!file.type.startsWith('image/')) {
          alert('이미지 파일만 업로드할 수 있습니다.');
          return false;
        }
        if (file.size > 10 * 1024 * 1024) {
          alert('파일 크기는 10MB를 초과할 수 없습니다.');
          return false;
        }
        return true;
      },
      onUpload: async (file: File): Promise<string> => {
        try {
          // Supabase 세션 토큰 가져오기
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            throw new Error('로그인이 필요합니다.');
          }

          // FormData 생성
          const formData = new FormData();
          formData.append('file', file);

          // 업로드 API 호출
          const response = await fetch('/api/upload', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: formData,
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || '이미지 업로드 실패');
          }

          const data = await response.json();
          return data.url;
        } catch (error: any) {
          console.error('이미지 업로드 오류:', error);
          alert(error.message || '이미지 업로드 중 오류가 발생했습니다.');
          throw error;
        }
      },
    });
  }, []);

  // 이미지 확장 설정 (업로드 플러그인 포함)
  const imageExtension = useMemo(() => {
    return UpdatedImage.extend({
      addProseMirrorPlugins() {
        return [
          UploadImagesPlugin({
            imageClass: 'opacity-40 rounded-lg border border-slate-600',
          }),
        ];
      },
    }).configure({
      allowBase64: false,
      HTMLAttributes: {
        class: 'rounded-lg border border-slate-700',
      },
    });
  }, []);

  // 확장 설정을 메모이제이션
  const extensions = useMemo(() => [
    StarterKit.configure({
      // StarterKit에 이미 HorizontalRule이 포함되어 있으므로 중복 제거
      horizontalRule: false,
    }),
    Markdown as any,
    imageExtension,
    TaskList,
    TaskItem,
    Horizontal, // Novel의 HorizontalRule 사용
    CustomKeymap, // 커스텀 키맵 (Ctrl+Z, Ctrl+Y 등)
    slashCommand, // 슬래시 명령어 확장
  ], [imageExtension]);

  return (
    <EditorRoot>
      <EditorContent
        key={editorKey} // key가 변경되면 에디터가 재생성됨
        initialContent={initialContent || undefined}
        immediatelyRender={false}
        extensions={extensions}
        onUpdate={({ editor }) => {
          // 즉시 onChange 호출 (debounce 제거)
          const json = editor.getJSON();
          onChange(json);
        }}
        editorProps={{
          handleDOMEvents: {
            keydown: (_view, event) => handleCommandNavigation(event),
          },
          attributes: {
            class: 'prose prose-invert max-w-none focus:outline-none min-h-[350px] sm:min-h-[450px] lg:min-h-[500px] prose-sm sm:prose-base',
          },
          handlePaste: (view, event) => {
            // 이미지 붙여넣기 처리
            const handled = handleImagePaste(view, event, uploadFn);
            if (handled) return true;

            // URL 붙여넣기 감지 (이미지 URL인 경우)
            const text = event.clipboardData?.getData('text/plain');
            if (text && /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(text)) {
              event.preventDefault();
              const { state, dispatch } = view;
              const { selection } = state;
              const imageNode = state.schema.nodes.image.create({
                src: text,
              });
              const transaction = state.tr.replaceSelectionWith(imageNode);
              dispatch(transaction);
              return true;
            }
            return false;
          },
          handleDrop: (view, event, slice, moved) => {
            return handleImageDrop(view, event, moved, uploadFn);
          },
        }}>
        <BubbleMenu />
        <EditorCommand className="z-50 h-auto max-h-[330px] w-72 overflow-y-auto rounded-md border border-slate-700 bg-slate-900 px-1 py-2 shadow-md">
          <EditorCommandEmpty className="px-2 text-sm text-slate-400">No results</EditorCommandEmpty>
          <EditorCommandList>
            {suggestionItems.map((item) => (
              <EditorCommandItem
                value={item.title}
                onCommand={(val) => item.command?.(val)}
                className="flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm hover:bg-slate-800 aria-selected:bg-slate-800"
                key={item.title}>
                <div className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-700 bg-slate-800">
                  {item.icon}
                </div>
                <div>
                  <p className="font-medium text-slate-200">{item.title}</p>
                  <p className="text-xs text-slate-400">{item.description}</p>
                </div>
              </EditorCommandItem>
            ))}
          </EditorCommandList>
        </EditorCommand>
      </EditorContent>
    </EditorRoot>
  );
}





