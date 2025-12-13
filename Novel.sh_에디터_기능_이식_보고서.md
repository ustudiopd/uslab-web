# Novel.sh 에디터 Notion 스타일 기능 이식 보고서

**작성 일자**: 2025-01-13  
**현재 상태**: 기본 에디터만 구현됨 (일반 글쓰기 창 수준)  
**목표**: Notion과 같은 고급 편집 기능 완전 구현

---

## 📊 현재 구현 상태 분석

### ✅ **현재 구현된 기능**

1. **기본 에디터 구조**
   - `EditorRoot`, `EditorContent` 컴포넌트 사용
   - Tiptap 기반 에디터 인스턴스 생성
   - 기본 확장: StarterKit, Markdown, Image, TaskList, TaskItem, HorizontalRule

2. **이미지 업로드**
   - 드래그 앤 드롭
   - 클립보드 붙여넣기
   - Supabase Storage 연동

3. **마크다운 Import/Export**
   - `.md` 파일 Import
   - 마크다운 복사/다운로드

### ❌ **누락된 Notion 스타일 기능**

1. **슬래시 명령어 메뉴 (`/` 명령어)**
   - 현재: 구현되지 않음
   - 필요: `/` 입력 시 블록 타입 선택 메뉴 표시

2. **Bubble Menu (텍스트 선택 시 메뉴)**
   - 현재: 구현되지 않음
   - 필요: 텍스트 선택 시 서식 메뉴 표시 (Bold, Italic, Link, Color 등)

3. **드래그 핸들 (Drag Handle)**
   - 현재: 구현되지 않음
   - 필요: 블록 왼쪽에 드래그 핸들 표시하여 블록 이동

4. **고급 서식 옵션**
   - 텍스트 색상 변경
   - 하이라이트 색상
   - 링크 삽입/편집
   - 블록 타입 전환 (Text, Heading, List, Quote, Code 등)

5. **에디터 스타일링**
   - Novel.sh 전용 CSS 변수 미적용
   - Placeholder 스타일 미적용
   - 드래그 핸들 스타일 미적용

---

## 🔍 문제 원인 분석

### 1. **슬래시 명령어 미구현**
- `Command` 확장이 extensions 배열에 포함되지 않음
- `EditorCommand`, `EditorCommandItem` 컴포넌트 미사용
- `createSuggestionItems` 유틸리티 미사용

### 2. **Bubble Menu 미구현**
- `EditorBubble`, `EditorBubbleItem` 컴포넌트 미사용
- 텍스트 선택 시 서식 메뉴가 표시되지 않음

### 3. **필수 확장 누락**
- `Command` 확장 (슬래시 명령어용)
- `BubbleMenu` 확장 (텍스트 선택 메뉴용)
- `DragHandle` 확장 (블록 드래그용)
- `Color` 확장 (텍스트 색상용)
- `Highlight` 확장 (하이라이트용)
- `Link` 확장 (링크 삽입용)

### 4. **CSS 스타일 미적용**
- Novel.sh 전용 CSS 변수 (`--novel-highlight-*`) 미설정
- ProseMirror 커스텀 스타일 미적용
- 드래그 핸들 스타일 미적용

---

## 🎯 Notion 스타일 기능 구현 계획

### Phase 1: 슬래시 명령어 메뉴 구현 (우선순위: 높음)

#### 1-1. 필요한 패키지 확인
```json
{
  "novel": "^1.0.2" // 이미 설치됨
}
```

#### 1-2. 슬래시 명령어 확장 추가
```typescript
// components/editor/extensions.ts (새 파일 생성)
import { Command, createSuggestionItems } from 'novel/extensions';
import { 
  CheckSquare, Code, Heading1, Heading2, Heading3, 
  List, ListOrdered, Text, TextQuote, Image 
} from 'lucide-react';
import { startImageUpload } from 'novel/plugins';

export const suggestionItems = createSuggestionItems([
  {
    title: 'Text',
    description: 'Just start typing with plain text.',
    searchTerms: ['p', 'paragraph'],
    icon: <Text size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleNode('paragraph', 'paragraph').run();
    },
  },
  {
    title: 'Heading 1',
    description: 'Big section heading.',
    searchTerms: ['title', 'big', 'large', 'h1'],
    icon: <Heading1 size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run();
    },
  },
  {
    title: 'Heading 2',
    description: 'Medium section heading.',
    searchTerms: ['subtitle', 'medium', 'h2'],
    icon: <Heading2 size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run();
    },
  },
  {
    title: 'Heading 3',
    description: 'Small section heading.',
    searchTerms: ['subtitle', 'small', 'h3'],
    icon: <Heading3 size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run();
    },
  },
  {
    title: 'Bullet List',
    description: 'Create a simple bullet list.',
    searchTerms: ['unordered', 'point'],
    icon: <List size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: 'Numbered List',
    description: 'Create a list with numbering.',
    searchTerms: ['ordered'],
    icon: <ListOrdered size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    title: 'To-do List',
    description: 'Track tasks with a to-do list.',
    searchTerms: ['todo', 'task', 'list', 'check', 'checkbox'],
    icon: <CheckSquare size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run();
    },
  },
  {
    title: 'Quote',
    description: 'Capture a quote.',
    searchTerms: ['blockquote'],
    icon: <TextQuote size={18} />,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleNode('paragraph', 'paragraph').toggleBlockquote().run(),
  },
  {
    title: 'Code',
    description: 'Capture a code snippet.',
    searchTerms: ['codeblock'],
    icon: <Code size={18} />,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
  },
  {
    title: 'Image',
    description: 'Upload an image.',
    searchTerms: ['image', 'img', 'picture', 'photo'],
    icon: <Image size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      // 이미지 업로드 트리거
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          // uploadFn 사용 (BlogEditor에서 전달받아야 함)
        }
      };
      input.click();
    },
  },
]);

export const slashCommand = Command.configure({
  suggestion: {
    items: () => suggestionItems,
  },
});
```

#### 1-3. EditorCommand UI 추가
```typescript
// BlogEditor.tsx에 추가
import { EditorCommand, EditorCommandItem, EditorCommandList, EditorCommandEmpty } from 'novel';
import { renderItems } from 'novel/extensions';

<EditorContent>
  <EditorCommand className="z-50 h-auto max-h-[330px] w-72 overflow-y-auto rounded-md border border-slate-700 bg-slate-900 px-1 py-2 shadow-md">
    <EditorCommandEmpty className="px-2 text-sm text-slate-400">No results</EditorCommandEmpty>
    <EditorCommandList>
      {suggestionItems.map((item) => (
        <EditorCommandItem
          value={item.title}
          onCommand={(val) => item.command(val)}
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
```

---

### Phase 2: Bubble Menu 구현 (우선순위: 높음)

#### 2-1. 필요한 확장 추가
```typescript
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { Highlight } from '@tiptap/extension-highlight';
import { Link } from '@tiptap/extension-link';
```

#### 2-2. Bubble Menu 컴포넌트 생성
```typescript
// components/editor/BubbleMenu.tsx (새 파일)
'use client';

import { EditorBubble, EditorBubbleItem, useEditor } from 'novel';
import { Bold, Italic, Underline, Strikethrough, Code, Link as LinkIcon } from 'lucide-react';
import { useState } from 'react';

export function BubbleMenu() {
  const { editor } = useEditor();
  const [openLink, setOpenLink] = useState(false);

  if (!editor) return null;

  return (
    <EditorBubble
      tippyOptions={{
        placement: 'top',
      }}
      className="flex w-fit max-w-[90vw] overflow-hidden rounded border border-slate-700 bg-slate-900 shadow-xl">
      {/* 텍스트 서식 버튼 */}
      <EditorBubbleItem
        onSelect={() => editor.chain().focus().toggleBold().run()}
        className={editor.isActive('bold') ? 'bg-slate-800' : ''}>
        <Bold className="h-4 w-4" />
      </EditorBubbleItem>
      <EditorBubbleItem
        onSelect={() => editor.chain().focus().toggleItalic().run()}
        className={editor.isActive('italic') ? 'bg-slate-800' : ''}>
        <Italic className="h-4 w-4" />
      </EditorBubbleItem>
      <EditorBubbleItem
        onSelect={() => editor.chain().focus().toggleUnderline().run()}
        className={editor.isActive('underline') ? 'bg-slate-800' : ''}>
        <Underline className="h-4 w-4" />
      </EditorBubbleItem>
      <EditorBubbleItem
        onSelect={() => editor.chain().focus().toggleStrike().run()}
        className={editor.isActive('strike') ? 'bg-slate-800' : ''}>
        <Strikethrough className="h-4 w-4" />
      </EditorBubbleItem>
      <EditorBubbleItem
        onSelect={() => editor.chain().focus().toggleCode().run()}
        className={editor.isActive('code') ? 'bg-slate-800' : ''}>
        <Code className="h-4 w-4" />
      </EditorBubbleItem>
      
      {/* 링크 삽입 */}
      <EditorBubbleItem onSelect={() => setOpenLink(true)}>
        <LinkIcon className="h-4 w-4" />
      </EditorBubbleItem>
    </EditorBubble>
  );
}
```

#### 2-3. BlogEditor에 Bubble Menu 통합
```typescript
import { BubbleMenu } from './BubbleMenu';

<EditorContent>
  <BubbleMenu />
  {/* ... 기존 코드 ... */}
</EditorContent>
```

---

### Phase 3: 드래그 핸들 구현 (우선순위: 중간)

#### 3-1. DragHandle 확장 추가
```typescript
import { DragHandle } from 'novel';

const extensions = [
  // ... 기존 확장들 ...
  DragHandle,
];
```

#### 3-2. CSS 스타일 추가
```css
/* app/globals.css에 추가 */
.drag-handle {
  position: fixed;
  opacity: 1;
  transition: opacity ease-in 0.2s;
  border-radius: 0.25rem;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10' style='fill: rgba(255, 255, 255, 0.5)'%3E%3Cpath d='M3,2 C2.44771525,2 2,1.55228475 2,1 C2,0.44771525 2.44771525,0 3,0 C3.55228475,0 4,0.44771525 4,1 C4,1.55228475 3.55228475,2 3,2 Z M3,6 C2.44771525,6 2,5.55228475 2,5 C2,4.44771525 2.44771525,4 3,4 C3.55228475,4 4,4.44771525 4,5 C4,5.55228475 3.55228475,6 3,6 Z M3,10 C2.44771525,10 2,9.55228475 2,9 C2,8.44771525 2.44771525,8 3,8 C3.55228475,8 4,8.44771525 4,9 C4,9.55228475 3.55228475,10 3,10 Z M7,2 C6.44771525,2 6,1.55228475 6,1 C6,0.44771525 6.44771525,0 7,0 C7.55228475,0 8,0.44771525 8,1 C8,1.55228475 7.55228475,2 7,2 Z M7,6 C6.44771525,6 6,5.55228475 6,5 C6,4.44771525 6.44771525,4 7,4 C7.55228475,4 8,4.44771525 8,5 C8,5.55228475 7.55228475,6 7,6 Z M7,10 C6.44771525,10 6,9.55228475 6,9 C6,8.44771525 6.44771525,8 7,8 C7.55228475,8 8,8.44771525 8,9 C8,9.55228475 7.55228475,10 7,10 Z'%3E%3C/path%3E%3C/svg%3E");
  background-size: calc(0.5em + 0.375rem) calc(0.5em + 0.375rem);
  background-repeat: no-repeat;
  background-position: center;
  width: 1.2rem;
  height: 1.5rem;
  z-index: 50;
  cursor: grab;
}

.drag-handle:hover {
  background-color: rgba(255, 255, 255, 0.1);
  transition: background-color 0.2s;
}

.drag-handle:active {
  background-color: rgba(255, 255, 255, 0.2);
  cursor: grabbing;
}
```

---

### Phase 4: 고급 서식 옵션 (우선순위: 중간)

#### 4-1. 텍스트 색상 및 하이라이트
```typescript
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { Highlight } from '@tiptap/extension-highlight';

const extensions = [
  // ... 기존 확장들 ...
  TextStyle,
  Color,
  Highlight.configure({
    multicolor: true,
  }),
];
```

#### 4-2. 링크 확장 추가
```typescript
import { Link } from '@tiptap/extension-link';

const extensions = [
  // ... 기존 확장들 ...
  Link.configure({
    openOnClick: false,
    HTMLAttributes: {
      class: 'text-cyan-400 underline',
    },
  }),
];
```

---

### Phase 5: CSS 스타일 완성 (우선순위: 중간)

#### 5-1. Novel.sh CSS 변수 추가
```css
/* app/globals.css에 추가 */
@layer base {
  :root {
    /* ... 기존 변수들 ... */
    --novel-highlight-default: #ffffff;
    --novel-highlight-purple: #f6f3f8;
    --novel-highlight-red: #fdebeb;
    --novel-highlight-yellow: #fbf4a2;
    --novel-highlight-blue: #c1ecf9;
    --novel-highlight-green: #acf79f;
    --novel-highlight-orange: #faebdd;
    --novel-highlight-pink: #faf1f5;
    --novel-highlight-gray: #f1f1ef;
  }

  .dark {
    /* ... 기존 변수들 ... */
    --novel-highlight-default: #000000;
    --novel-highlight-purple: #3f2c4b;
    --novel-highlight-red: #5c1a1a;
    --novel-highlight-yellow: #5c4b1a;
    --novel-highlight-blue: #1a3d5c;
    --novel-highlight-green: #1a5c20;
    --novel-highlight-orange: #5c3a1a;
    --novel-highlight-pink: #5c1a3a;
    --novel-highlight-gray: #3a3a3a;
  }
}
```

#### 5-2. ProseMirror 커스텀 스타일
```css
/* app/globals.css에 추가 */
.ProseMirror {
  @apply p-12 px-8 sm:px-12;
}

.ProseMirror .is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: hsl(var(--muted-foreground));
  pointer-events: none;
  height: 0;
}

.ProseMirror .is-empty::before {
  content: attr(data-placeholder);
  float: left;
  color: hsl(var(--muted-foreground));
  pointer-events: none;
  height: 0;
}

.ProseMirror img {
  transition: filter 0.1s ease-in-out;
}

.ProseMirror img:hover {
  cursor: pointer;
  filter: brightness(90%);
}

.ProseMirror img.ProseMirror-selectednode {
  outline: 3px solid #5abbf7;
  filter: brightness(90%);
}
```

---

## 📋 구현 체크리스트

### Phase 1: 슬래시 명령어 (필수)
- [ ] `Command` 확장 추가
- [ ] `suggestionItems` 정의 (`createSuggestionItems` 사용)
- [ ] `EditorCommand` 컴포넌트 추가
- [ ] `EditorCommandItem` 컴포넌트로 메뉴 아이템 렌더링
- [ ] `handleCommandNavigation` 추가 (키보드 네비게이션)

### Phase 2: Bubble Menu (필수)
- [ ] `EditorBubble` 컴포넌트 추가
- [ ] `EditorBubbleItem` 컴포넌트로 서식 버튼 추가
- [ ] 텍스트 선택 시 자동 표시 확인
- [ ] Bold, Italic, Underline, Strike, Code 버튼
- [ ] 링크 삽입/편집 기능

### Phase 3: 드래그 핸들 (권장)
- [ ] `DragHandle` 확장 추가
- [ ] 드래그 핸들 CSS 스타일 추가
- [ ] 블록 드래그 앤 드롭 동작 확인

### Phase 4: 고급 서식 (권장)
- [ ] `Color` 확장 추가
- [ ] `TextStyle` 확장 추가
- [ ] `Highlight` 확장 추가
- [ ] `Link` 확장 추가
- [ ] Bubble Menu에 색상 선택기 추가

### Phase 5: CSS 스타일 (필수)
- [ ] Novel.sh CSS 변수 추가
- [ ] ProseMirror 커스텀 스타일 추가
- [ ] Placeholder 스타일 추가
- [ ] 이미지 선택 스타일 추가

---

## 🚀 구현 우선순위

### 즉시 구현 (필수)
1. **슬래시 명령어 메뉴** - Notion의 핵심 기능
2. **Bubble Menu** - 텍스트 서식의 기본
3. **CSS 스타일** - Notion 느낌의 UI

### 단기 구현 (권장)
4. **드래그 핸들** - 블록 이동 기능
5. **고급 서식** - 색상, 하이라이트, 링크

---

## 📝 예상 작업 시간

- **Phase 1 (슬래시 명령어)**: 2-3시간
- **Phase 2 (Bubble Menu)**: 2-3시간
- **Phase 3 (드래그 핸들)**: 1-2시간
- **Phase 4 (고급 서식)**: 2-3시간
- **Phase 5 (CSS 스타일)**: 1-2시간

**총 예상 시간**: 8-13시간

---

## 🔗 참고 자료

- [Novel.sh 공식 문서](https://novel.sh/docs)
- [Novel.sh GitHub](https://github.com/steven-tey/novel)
- [Tiptap 문서](https://tiptap.dev/docs)
- [Novel.sh Tailwind 예제](https://novel.sh/docs/guides/tailwind)

---

## 💡 추가 개선 사항

1. **AI 명령어 통합** (향후)
   - `/ai` 명령어로 AI 이어쓰기
   - 텍스트 선택 후 AI 교정

2. **블록 타입 전환**
   - Bubble Menu에서 블록 타입 변경 (Text ↔ Heading ↔ List 등)

3. **키보드 단축키**
   - `Ctrl+B`: Bold
   - `Ctrl+I`: Italic
   - `Ctrl+K`: Link
   - 등등

4. **플레이스홀더 텍스트**
   - "Type `/` for commands" 같은 안내 문구

---

이 보고서를 바탕으로 단계적으로 Novel.sh의 Notion 스타일 기능을 구현하면 됩니다.
