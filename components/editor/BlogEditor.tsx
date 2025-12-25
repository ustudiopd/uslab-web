'use client';

import { useMemo, useEffect, useRef } from 'react';
import { EditorRoot, EditorContent, StarterKit, UpdatedImage, createImageUpload, handleImagePaste, handleImageDrop, UploadImagesPlugin, TaskList, TaskItem, HorizontalRule as Horizontal, CustomKeymap, Command, EditorCommand, EditorCommandItem, EditorCommandList, EditorCommandEmpty } from 'novel';
import { handleCommandNavigation } from 'novel';
import type { JSONContent } from 'novel';
import { Markdown } from '@tiptap/markdown';
import { Youtube } from '@tiptap/extension-youtube';
import { Link } from '@tiptap/extension-link';
import { supabase } from '@/lib/supabase/client';
import { suggestionItems, slashCommand } from './extensions';
import { BubbleMenu } from './BubbleMenu';
import { Small } from './extensions/Small';
import { ImageResizeExtension } from './extensions/ImageResizeExtension';
import { AutoLink } from './extensions/AutoLink';

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
        if (file.size > 50 * 1024 * 1024) {
          alert('파일 크기는 50MB를 초과할 수 없습니다.');
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
            // 에러 응답 처리 (JSON이 아닐 수 있음)
            let errorMessage = '이미지 업로드 실패';
            try {
              const contentType = response.headers.get('content-type');
              if (contentType && contentType.includes('application/json')) {
                const error = await response.json();
                errorMessage = error.error || errorMessage;
              } else {
                const text = await response.text();
                // HTML 에러 페이지인 경우 상태 코드로 메시지 생성
                if (response.status === 413) {
                  errorMessage = '파일 크기가 너무 큽니다. (최대 50MB)';
                } else if (response.status === 401) {
                  errorMessage = '인증이 필요합니다. 다시 로그인해주세요.';
                } else {
                  errorMessage = `이미지 업로드 실패 (${response.status})`;
                }
              }
            } catch (parseError) {
              // JSON 파싱 실패 시 상태 코드로 메시지 생성
              if (response.status === 413) {
                errorMessage = '파일 크기가 너무 큽니다. (최대 50MB)';
              } else if (response.status === 401) {
                errorMessage = '인증이 필요합니다. 다시 로그인해주세요.';
              } else {
                errorMessage = `이미지 업로드 실패 (${response.status})`;
              }
            }
            throw new Error(errorMessage);
          }

          // 성공 응답 처리
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            throw new Error('서버 응답 형식이 올바르지 않습니다.');
          }

          const data = await response.json();
          if (!data.url) {
            throw new Error('이미지 URL을 받지 못했습니다.');
          }
          return data.url;
        } catch (error: any) {
          console.error('이미지 업로드 오류:', error);
          alert(error.message || '이미지 업로드 중 오류가 발생했습니다.');
          throw error;
        }
      },
    });
  }, []);

  // 이미지 확장 설정 (업로드 플러그인 포함 + 리사이즈 기능)
  const imageExtension = useMemo(() => {
    return UpdatedImage.extend({
      addAttributes() {
        return {
          ...this.parent?.(),
          width: {
            default: null,
            parseHTML: (element) => {
              const width = element.getAttribute('width');
              return width ? parseInt(width, 10) : null;
            },
            renderHTML: (attributes) => {
              if (!attributes.width) {
                return {};
              }
              return {
                width: attributes.width,
              };
            },
          },
          height: {
            default: null,
            parseHTML: (element) => {
              const height = element.getAttribute('height');
              return height ? parseInt(height, 10) : null;
            },
            renderHTML: (attributes) => {
              if (!attributes.height) {
                return {};
              }
              return {
                height: attributes.height,
              };
            },
          },
        };
      },
      addProseMirrorPlugins() {
        return [
          UploadImagesPlugin({
            imageClass: 'opacity-40 rounded-lg border border-slate-300',
          }),
          // ImageResizePlugin은 ImageResizeExtension으로 별도 등록
        ];
      },
    }).configure({
      allowBase64: false,
      HTMLAttributes: {
        class: 'rounded-lg border border-slate-300 resizable-image',
        style: 'max-width: 100%; height: auto; max-height: 600px; object-fit: contain; cursor: pointer;',
      },
      inline: false,
    });
  }, []);

  // YouTube 확장 설정
  const youtubeExtension = useMemo(() => {
    return Youtube.configure({
      controls: true,
      nocookie: false,
      width: 640,
      height: 360, // 16:9 비율
      HTMLAttributes: {
        class: 'rounded-lg border border-slate-300 w-full',
        style: 'aspect-ratio: 16/9;',
      },
    });
  }, []);

  // Link 확장 설정
  const linkExtension = useMemo(() => {
    return Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        target: '_blank',
        rel: 'noopener noreferrer',
        class: 'text-blue-600 hover:text-blue-700 underline',
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
    youtubeExtension,
    linkExtension,
    AutoLink, // URL 자동 링크 변환
    TaskList,
    TaskItem,
    Horizontal, // Novel의 HorizontalRule 사용
    CustomKeymap, // 커스텀 키맵 (Ctrl+Z, Ctrl+Y 등)
    Small, // Small 태그 지원
    slashCommand, // 슬래시 명령어 확장
    ImageResizeExtension, // 이미지 리사이즈 Extension (명세서 해결책 A)
  ], [imageExtension, youtubeExtension, linkExtension]);

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
            class: 'prose max-w-none focus:outline-none min-h-[350px] sm:min-h-[450px] lg:min-h-[500px] prose-sm sm:prose-base [&_img]:max-w-full [&_img]:h-auto [&_img]:max-h-[600px] [&_img]:object-contain prose-slate prose-p:my-6 prose-code:text-cyan-600 prose-code:dark:text-cyan-400 prose-code:bg-slate-100 prose-code:dark:bg-slate-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:text-sm prose-pre:bg-slate-50 prose-pre:dark:bg-slate-900 prose-pre:border-2 prose-pre:border-slate-200 prose-pre:dark:border-slate-800 prose-pre:rounded-lg prose-pre:relative prose-pre:code:text-slate-900 prose-pre:code:dark:text-slate-100 prose-pre:code:bg-transparent prose-pre:code:dark:bg-transparent prose-pre:code:px-0 prose-pre:code:py-0 prose-pre:code:rounded-none [&_pre_code_*]:bg-transparent [&_pre_code_*]:dark:bg-transparent',
          },
          handlePaste: (view, event) => {
            // 이미지 붙여넣기 처리
            const handled = handleImagePaste(view, event, uploadFn);
            if (handled) return true;

            // URL 붙여넣기 감지
            const text = event.clipboardData?.getData('text/plain');
            if (!text) return false;

            // 이미지 URL인 경우
            if (/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(text)) {
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

            // YouTube URL인 경우
            const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
            const youtubeMatch = text.match(youtubeRegex);
            if (youtubeMatch) {
              event.preventDefault();
              const { state, dispatch } = view;
              const { selection } = state;
              const videoId = youtubeMatch[1];
              const youtubeNode = state.schema.nodes.youtube.create({
                src: `https://www.youtube.com/embed/${videoId}`,
              });
              const transaction = state.tr.replaceSelectionWith(youtubeNode);
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
        <EditorCommand className="z-50 h-auto max-h-[330px] w-72 overflow-y-auto rounded-md border border-slate-200 bg-white px-1 py-2 shadow-lg">
          <EditorCommandEmpty className="px-2 text-sm text-slate-600">No results</EditorCommandEmpty>
          <EditorCommandList>
            {suggestionItems.map((item) => (
              <EditorCommandItem
                value={item.title}
                onCommand={(val) => item.command?.(val)}
                className="flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm hover:bg-slate-100 aria-selected:bg-slate-100"
                key={item.title}>
                <div className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-slate-50">
                  {item.icon}
                </div>
                <div>
                  <p className="font-medium text-slate-900">{item.title}</p>
                  <p className="text-xs text-slate-600">{item.description}</p>
                </div>
              </EditorCommandItem>
            ))}
          </EditorCommandList>
        </EditorCommand>
      </EditorContent>
    </EditorRoot>
  );
}





