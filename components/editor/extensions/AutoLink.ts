'use client';

import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

/**
 * URL 자동 링크 변환 Extension
 * URL 패턴을 감지하여 자동으로 링크로 변환합니다.
 */
export const AutoLink = Extension.create({
  name: 'autoLink',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('autoLink'),
        appendTransaction: (transactions, oldState, newState) => {
          // 트랜잭션이 없거나 입력이 없으면 스킵
          if (!transactions.some(tr => tr.docChanged)) {
            return null;
          }

          const { tr, doc } = newState;
          let modified = false;

          // 모든 텍스트 노드를 순회하며 URL 패턴 찾기
          doc.descendants((node, pos) => {
            if (node.isText && node.text) {
              // URL 패턴: http:// 또는 https://로 시작하는 URL
              const urlPattern = /(https?:\/\/[^\s\)]+)/g;
              const matches = Array.from(node.text.matchAll(urlPattern));

              if (matches.length > 0) {
                // 역순으로 처리하여 위치 오프셋 문제 방지
                matches.reverse().forEach((match) => {
                  if (match.index !== undefined) {
                    const url = match[0];
                    const start = pos + match.index;
                    const end = start + url.length;

                    // 이미 링크인지 확인
                    const $start = doc.resolve(start);
                    const linkMark = newState.schema.marks.link;

                    if (linkMark) {
                      // 해당 범위에 링크 마크가 있는지 확인
                      const hasLink = $start.marks().some(m => m.type === linkMark);
                      
                      if (!hasLink) {
                        // URL을 링크로 변환
                        tr.addMark(start, end, linkMark.create({ href: url }));
                        modified = true;
                      }
                    }
                  }
                });
              }
            }
          });

          return modified ? tr : null;
        },
      }),
    ];
  },
});








