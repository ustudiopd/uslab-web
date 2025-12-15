/**
 * 운영진 보드(Executive Board) 관련 TypeScript 타입 정의
 */

import type { JSONContent } from 'novel';

export interface ExecBoard {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface ExecDoc {
  id: string;
  board_id: string;
  title: string;
  content: JSONContent;
  priority: number;
  is_trashed: boolean;
  trashed_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface ExecDocVersion {
  id: string;
  doc_id: string;
  title: string;
  content: JSONContent;
  change_type: 'auto_snapshot' | 'manual_snapshot' | 'restore_point';
  note: string | null;
  created_at: string;
  created_by: string | null;
}

export interface CreateBoardData {
  name: string;
  description?: string;
  sort_order?: number;
}

export interface UpdateBoardData {
  name?: string;
  description?: string;
  sort_order?: number;
}

export interface CreateDocData {
  title: string;
  content?: JSONContent;
}

export interface UpdateDocData {
  title?: string;
  content?: JSONContent;
  priority?: number;
  is_trashed?: boolean;
}

export interface ReorderDocsData {
  orderedDocIds: string[];
}

