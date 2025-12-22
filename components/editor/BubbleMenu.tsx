'use client';

import { useState } from 'react';
import { EditorBubble, EditorBubbleItem, useEditor } from 'novel';
import { Bold, Italic, Underline, Strikethrough, Code, Type, Link as LinkIcon, Unlink } from 'lucide-react';

export function BubbleMenu() {
  const { editor } = useEditor();
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');

  if (!editor) return null;

  const handleLinkToggle = () => {
    if (editor.isActive('link')) {
      // 링크 제거
      editor.chain().focus().unsetLink().run();
    } else {
      // 링크 추가/편집
      const { from, to } = editor.state.selection;
      const selectedText = editor.state.doc.textBetween(from, to, ' ');
      
      if (selectedText) {
        // 텍스트가 선택되어 있으면 링크 추가
        setLinkText(selectedText);
        setLinkUrl('');
      } else {
        // 아무것도 선택되지 않았으면 텍스트와 URL 모두 입력
        setLinkText('');
        setLinkUrl('');
      }
      
      // 기존 링크가 있으면 URL 가져오기
      const linkMark = editor.getAttributes('link');
      if (linkMark.href) {
        setLinkUrl(linkMark.href);
      }
      
      setShowLinkInput(true);
    }
  };

  const handleLinkSubmit = () => {
    if (!linkUrl.trim()) {
      alert('URL을 입력해주세요.');
      return;
    }

    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, ' ');

    if (selectedText) {
      // 선택된 텍스트에 링크 추가
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: linkUrl })
        .run();
    } else if (linkText.trim()) {
      // 텍스트와 URL 모두 입력된 경우
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'text',
          text: linkText,
          marks: [
            {
              type: 'link',
              attrs: { href: linkUrl },
            },
          ],
        })
        .run();
    } else {
      // URL만 입력된 경우 (URL을 텍스트로 사용)
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'text',
          text: linkUrl,
          marks: [
            {
              type: 'link',
              attrs: { href: linkUrl },
            },
          ],
        })
        .run();
    }

    setShowLinkInput(false);
    setLinkUrl('');
    setLinkText('');
  };

  const handleUnlink = () => {
    editor.chain().focus().unsetLink().run();
  };

  return (
    <>
      {/* 링크 입력 UI - 버블 메뉴 위에 표시 */}
      {showLinkInput && (
        <EditorBubble
          tippyOptions={{
            placement: 'top',
            offset: [0, 8], // 버블 메뉴 위에 8px 간격
          }}
          className="flex flex-col w-80 max-w-[90vw] rounded border border-slate-200 bg-white shadow-xl p-3 gap-2">
          {!editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to, ' ') && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                링크 텍스트
              </label>
              <input
                type="text"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="링크에 표시될 텍스트"
                className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setShowLinkInput(false);
                    setLinkUrl('');
                    setLinkText('');
                  }
                }}
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              URL
            </label>
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleLinkSubmit();
                } else if (e.key === 'Escape') {
                  setShowLinkInput(false);
                  setLinkUrl('');
                  setLinkText('');
                }
              }}
              autoFocus={!!editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to, ' ')}
            />
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button
              onClick={() => {
                setShowLinkInput(false);
                setLinkUrl('');
                setLinkText('');
              }}
              className="px-3 py-1.5 text-xs bg-slate-100 border border-slate-300 text-slate-900 rounded hover:border-slate-400 transition-colors">
              취소
            </button>
            <button
              onClick={handleLinkSubmit}
              className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
              추가
            </button>
          </div>
        </EditorBubble>
      )}

      {/* 포맷팅 도구 버블 메뉴 */}
      <EditorBubble
        tippyOptions={{
          placement: 'top',
        }}
        className="flex w-fit max-w-[90vw] overflow-hidden rounded border border-slate-200 bg-white shadow-xl">
        <EditorBubbleItem
          onSelect={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 ${editor.isActive('bold') ? 'bg-slate-100' : ''}`}>
          <Bold className="h-4 w-4 text-slate-700" />
        </EditorBubbleItem>
        <EditorBubbleItem
          onSelect={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 ${editor.isActive('italic') ? 'bg-slate-100' : ''}`}>
          <Italic className="h-4 w-4 text-slate-700" />
        </EditorBubbleItem>
        <EditorBubbleItem
          onSelect={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-2 ${editor.isActive('underline') ? 'bg-slate-100' : ''}`}>
          <Underline className="h-4 w-4 text-slate-700" />
        </EditorBubbleItem>
        <EditorBubbleItem
          onSelect={() => editor.chain().focus().toggleStrike().run()}
          className={`p-2 ${editor.isActive('strike') ? 'bg-slate-100' : ''}`}>
          <Strikethrough className="h-4 w-4 text-slate-700" />
        </EditorBubbleItem>
        <EditorBubbleItem
          onSelect={() => editor.chain().focus().toggleCode().run()}
          className={`p-2 ${editor.isActive('code') ? 'bg-slate-100' : ''}`}>
          <Code className="h-4 w-4 text-slate-700" />
        </EditorBubbleItem>
        <EditorBubbleItem
          onSelect={() => {
            const chain = editor.chain().focus();
            if (editor.isActive('small')) {
              (chain as any).unsetSmall().run();
            } else {
              (chain as any).setSmall().run();
            }
          }}
          className={`p-2 ${editor.isActive('small') ? 'bg-slate-100' : ''}`}
          title="작은 글씨">
          <Type className="h-4 w-4 text-slate-700" />
        </EditorBubbleItem>
        {editor.isActive('link') ? (
          <EditorBubbleItem
            onSelect={handleUnlink}
            className="p-2"
            title="링크 제거">
            <Unlink className="h-4 w-4 text-slate-700" />
          </EditorBubbleItem>
        ) : (
          <EditorBubbleItem
            onSelect={handleLinkToggle}
            className="p-2"
            title="링크 추가">
            <LinkIcon className="h-4 w-4 text-slate-700" />
          </EditorBubbleItem>
        )}
      </EditorBubble>
    </>
  );
}
