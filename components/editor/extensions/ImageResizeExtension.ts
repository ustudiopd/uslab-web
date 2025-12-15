/**
 * 이미지 리사이즈 Extension
 * ProseMirror Plugin을 Tiptap Extension으로 감싸서 확실히 등록
 */

'use client';

import { Extension } from '@tiptap/core';
import { createImageResizePlugin } from '../ImageResizePlugin';

export const ImageResizeExtension = Extension.create({
  name: 'imageResizeExtension',
  addProseMirrorPlugins() {
    console.log('[ImageResizeExtension] addProseMirrorPlugins() called');
    return [createImageResizePlugin()];
  },
});
