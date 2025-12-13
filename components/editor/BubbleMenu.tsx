'use client';

import { EditorBubble, EditorBubbleItem, useEditor } from 'novel';
import { Bold, Italic, Underline, Strikethrough, Code } from 'lucide-react';

export function BubbleMenu() {
  const { editor } = useEditor();

  if (!editor) return null;

  return (
    <EditorBubble
      tippyOptions={{
        placement: 'top',
      }}
      className="flex w-fit max-w-[90vw] overflow-hidden rounded border border-slate-700 bg-slate-900 shadow-xl">
      <EditorBubbleItem
        onSelect={() => editor.chain().focus().toggleBold().run()}
        className={`p-2 ${editor.isActive('bold') ? 'bg-slate-800' : ''}`}>
        <Bold className="h-4 w-4 text-slate-300" />
      </EditorBubbleItem>
      <EditorBubbleItem
        onSelect={() => editor.chain().focus().toggleItalic().run()}
        className={`p-2 ${editor.isActive('italic') ? 'bg-slate-800' : ''}`}>
        <Italic className="h-4 w-4 text-slate-300" />
      </EditorBubbleItem>
      <EditorBubbleItem
        onSelect={() => editor.chain().focus().toggleUnderline().run()}
        className={`p-2 ${editor.isActive('underline') ? 'bg-slate-800' : ''}`}>
        <Underline className="h-4 w-4 text-slate-300" />
      </EditorBubbleItem>
      <EditorBubbleItem
        onSelect={() => editor.chain().focus().toggleStrike().run()}
        className={`p-2 ${editor.isActive('strike') ? 'bg-slate-800' : ''}`}>
        <Strikethrough className="h-4 w-4 text-slate-300" />
      </EditorBubbleItem>
      <EditorBubbleItem
        onSelect={() => editor.chain().focus().toggleCode().run()}
        className={`p-2 ${editor.isActive('code') ? 'bg-slate-800' : ''}`}>
        <Code className="h-4 w-4 text-slate-300" />
      </EditorBubbleItem>
    </EditorBubble>
  );
}
