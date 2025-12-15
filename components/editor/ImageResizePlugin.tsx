/**
 * 이미지 리사이즈 플러그인 (선택 기반 구현)
 * 명세서 해결책 B: NodeSelection 기반으로 핸들 표시
 */

'use client';

import { Plugin, PluginKey, NodeSelection } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';

const key = new PluginKey('uslab-image-resize');

const MIN = 50;
const MAX = 1200;
const HANDLE_SIZE = 16;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function isImageNode(node: ProseMirrorNode | null | undefined) {
  if (!node) return false;
  // Novel.sh의 UpdatedImage는 'image' 타입 사용
  return node.type.name === 'image' || !!node.attrs?.src;
}

function getSelectedImage(view: EditorView): {
  pos: number;
  node: ProseMirrorNode;
  img: HTMLImageElement;
} | null {
  const sel = view.state.selection;
  if (!(sel instanceof NodeSelection)) return null;
  if (!isImageNode(sel.node)) return null;

  const pos = sel.from;
  const dom = view.nodeDOM(pos) as unknown;

  let img: HTMLImageElement | null = null;
  if (dom instanceof HTMLImageElement) {
    img = dom;
  } else if (dom instanceof HTMLElement) {
    img = dom.querySelector('img');
  }

  if (!img) return null;
  return { pos, node: sel.node, img };
}

export function createImageResizePlugin() {
  return new Plugin({
    key,
    view(view) {
      console.log('[ImageResize] view() mounted - 플러그인 등록 확인');
      
      const container = view.dom.parentElement;
      if (!container) {
        console.warn('[ImageResize] container not found');
        return {};
      }

      // 오버레이용 positioning context 확보
      if (getComputedStyle(container).position === 'static') {
        container.style.position = 'relative';
      }

      // 핸들(오버레이) 생성: ProseMirror 내부가 아니라 "부모"에 붙임
      const handle = document.createElement('button');
      handle.type = 'button';
      handle.className = 'resize-handle'; // globals.css와 일치
      Object.assign(handle.style, {
        position: 'absolute',
        width: `${HANDLE_SIZE}px`,
        height: `${HANDLE_SIZE}px`,
        backgroundColor: '#3b82f6',
        border: '2px solid white',
        borderRadius: '50%',
        cursor: 'se-resize',
        display: 'none',
        zIndex: '1000', // globals.css와 일치
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
        transition: 'transform 0.1s',
        pointerEvents: 'auto', // 클릭 가능하도록
      });
      container.appendChild(handle);

      let active:
        | { pos: number; node: ProseMirrorNode; img: HTMLImageElement }
        | null = null;

      let dragging = false;
      let startX = 0;
      let startY = 0;
      let startW = 0;
      let startH = 0;
      let aspect = 1;

      const positionHandle = () => {
        if (!active) return;
        const imgRect = active.img.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        const left =
          imgRect.right - containerRect.left + container.scrollLeft - HANDLE_SIZE / 2;
        const top =
          imgRect.bottom - containerRect.top + container.scrollTop - HANDLE_SIZE / 2;

        handle.style.left = `${left}px`;
        handle.style.top = `${top}px`;
      };

      const show = (next: NonNullable<typeof active>) => {
        console.log('[ImageResize] show() called', next);
        active = next;
        handle.style.display = 'block';
        positionHandle();
      };

      const hide = () => {
        console.log('[ImageResize] hide() called');
        active = null;
        handle.style.display = 'none';
      };

      const onMouseMove = (e: MouseEvent) => {
        if (!dragging || !active) return;

        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        let nextW = clamp(startW + dx, MIN, MAX);
        let nextH = clamp(startH + dy, MIN, MAX);

        // Shift: 비율 유지
        if (e.shiftKey) {
          nextH = clamp(nextW / aspect, MIN, MAX);
        }

        active.img.style.width = `${Math.round(nextW)}px`;
        active.img.style.height = `${Math.round(nextH)}px`;
        positionHandle();
      };

      const onMouseUp = () => {
        if (!dragging || !active) return;
        dragging = false;

        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);

        // 최종 크기를 노드 attrs로 저장
        const width = parseInt(active.img.style.width, 10) || Math.round(startW);
        const height = parseInt(active.img.style.height, 10) || Math.round(startH);

        const { state } = view;
        const nodeNow = state.doc.nodeAt(active.pos);
        if (!nodeNow) return;

        const tr = state.tr.setNodeMarkup(active.pos, undefined, {
          ...nodeNow.attrs,
          width,
          height,
        });
        view.dispatch(tr);
        console.log('[ImageResize] 크기 저장 완료', { width, height });
      };

      const onMouseDown = (e: MouseEvent) => {
        if (!active) return;
        e.preventDefault();
        e.stopPropagation();

        dragging = true;
        startX = e.clientX;
        startY = e.clientY;

        const rect = active.img.getBoundingClientRect();
        startW = rect.width;
        startH = rect.height;
        aspect = startW / (startH || 1);

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        console.log('[ImageResize] 드래그 시작', { startW, startH, aspect });
      };

      handle.addEventListener('mousedown', onMouseDown);

      // 호버 효과
      handle.addEventListener('mouseenter', () => {
        handle.style.transform = 'scale(1.2)';
        handle.style.backgroundColor = '#2563eb';
      });

      handle.addEventListener('mouseleave', () => {
        handle.style.transform = 'scale(1)';
        handle.style.backgroundColor = '#3b82f6';
      });

      const onReposition = () => {
        if (active) positionHandle();
      };
      container.addEventListener('scroll', onReposition);
      window.addEventListener('resize', onReposition);

      return {
        update(view) {
          const next = getSelectedImage(view);
          if (!next) {
            if (active) {
              console.log('[ImageResize] update() - 이미지 선택 해제');
              hide();
            }
            return;
          }

          if (!active || active.pos !== next.pos) {
            console.log('[ImageResize] update() - 새 이미지 선택됨', next.pos);
            show(next);
          } else {
            positionHandle(); // 같은 이미지면 위치만 업데이트
          }
        },
        destroy() {
          console.log('[ImageResize] destroy() called');
          handle.removeEventListener('mousedown', onMouseDown);
          container.removeEventListener('scroll', onReposition);
          window.removeEventListener('resize', onReposition);
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('mouseup', onMouseUp);
          handle.remove();
        },
      };
    },
    props: {
      handleDOMEvents: {
        mousedown: (view: EditorView, event: MouseEvent) => {
          const target = event.target as HTMLElement;

          // 리사이즈 핸들 클릭 감지 (이벤트 전파 방지)
          if (target.classList.contains('resize-handle')) {
            return true; // ProseMirror가 처리하지 않도록
          }

          return false;
        },
      },
    },
  });
}
