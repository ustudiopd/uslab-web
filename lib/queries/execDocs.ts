/**
 * 운영진 보드 문서(Executive Doc) 쿼리 함수
 * Supabase를 사용하여 uslab_exec_docs 테이블에 접근
 */

import { createServerClient } from '@/lib/supabase/client';
import type {
  ExecDoc,
  ExecDocVersion,
  CreateDocData,
  UpdateDocData,
  ReorderDocsData,
} from '@/lib/types/execBoard';

/**
 * 서버 Supabase 클라이언트 생성
 */
function getServerSupabase() {
  try {
    return createServerClient();
  } catch {
    throw new Error('Server Supabase client requires SUPABASE_SERVICE_ROLE_KEY');
  }
}

/**
 * 보드의 문서 목록 조회 (정렬: priority desc)
 */
export async function getDocsByBoardId(
  boardId: string,
  includeTrashed: boolean = false
): Promise<ExecDoc[]> {
  const supabase = getServerSupabase();

  let query = (supabase as any)
    .from('uslab_exec_docs')
    .select('*')
    .eq('board_id', boardId)
    .order('priority', { ascending: false })
    .order('updated_at', { ascending: false });

  if (!includeTrashed) {
    query = query.eq('is_trashed', false);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching docs:', error);
    return [];
  }

  return (data || []) as ExecDoc[];
}

/**
 * 문서 ID로 조회
 */
export async function getDocById(id: string): Promise<ExecDoc | null> {
  const supabase = getServerSupabase();

  const { data, error } = await (supabase as any)
    .from('uslab_exec_docs')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching doc:', error);
    return null;
  }

  return data as ExecDoc;
}

/**
 * 보드의 최상단 문서 조회 (1등 문서)
 */
export async function getTopDocByBoardId(boardId: string): Promise<ExecDoc | null> {
  const supabase = getServerSupabase();

  const { data, error } = await (supabase as any)
    .from('uslab_exec_docs')
    .select('*')
    .eq('board_id', boardId)
    .eq('is_trashed', false)
    .order('priority', { ascending: false })
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    // 문서가 없을 수도 있음
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching top doc:', error);
    return null;
  }

  return data as ExecDoc;
}

/**
 * 문서 생성
 */
export async function createDoc(
  boardId: string,
  docData: CreateDocData,
  userId: string
): Promise<ExecDoc | null> {
  const supabase = getServerSupabase();

  // 새 문서의 priority 계산 (보드의 문서 개수 확인)
  const existingDocs = await getDocsByBoardId(boardId, false);
  const priority = 1000 - existingDocs.length * 10;

  const { data, error } = await (supabase as any)
    .from('uslab_exec_docs')
    .insert({
      board_id: boardId,
      title: docData.title,
      content: docData.content || {},
      priority,
      created_by: userId,
      updated_by: userId,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating doc:', error);
    return null;
  }

  return data as ExecDoc;
}

/**
 * 문서 수정
 */
export async function updateDoc(
  id: string,
  docData: UpdateDocData,
  userId: string
): Promise<ExecDoc | null> {
  const supabase = getServerSupabase();

  const updateData: any = {
    ...docData,
    updated_by: userId,
  };

  // soft delete 처리
  if (docData.is_trashed !== undefined) {
    if (docData.is_trashed) {
      updateData.trashed_at = new Date().toISOString();
    } else {
      updateData.trashed_at = null;
    }
  }

  const { data, error } = await (supabase as any)
    .from('uslab_exec_docs')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating doc:', error);
    return null;
  }

  return data as ExecDoc;
}

/**
 * 문서 정렬 (priority 재계산)
 */
export async function reorderDocs(
  boardId: string,
  orderedDocIds: string[]
): Promise<boolean> {
  const supabase = getServerSupabase();

  // priority 재계산: 1등 = 1000, 2등 = 990, ...
  const updates = orderedDocIds.map((docId, index) => ({
    id: docId,
    priority: 1000 - index * 10,
  }));

  // 일괄 업데이트
  for (const update of updates) {
    const { error } = await (supabase as any)
      .from('uslab_exec_docs')
      .update({ priority: update.priority })
      .eq('id', update.id)
      .eq('board_id', boardId);

    if (error) {
      console.error('Error reordering docs:', error);
      return false;
    }
  }

  return true;
}

/**
 * 문서 복원 (휴지통에서)
 */
export async function restoreDoc(id: string, userId: string): Promise<ExecDoc | null> {
  return updateDoc(
    id,
    {
      is_trashed: false,
    },
    userId
  );
}

/**
 * 문서 버전 목록 조회
 */
export async function getDocVersions(docId: string): Promise<ExecDocVersion[]> {
  const supabase = getServerSupabase();

  const { data, error } = await (supabase as any)
    .from('uslab_exec_doc_versions')
    .select('*')
    .eq('doc_id', docId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching versions:', error);
    return [];
  }

  return (data || []) as ExecDocVersion[];
}

/**
 * 문서 버전 생성 (스냅샷)
 */
export async function createDocVersion(
  docId: string,
  changeType: 'auto_snapshot' | 'manual_snapshot' | 'restore_point',
  note: string | null,
  userId: string
): Promise<ExecDocVersion | null> {
  const supabase = getServerSupabase();

  // 현재 문서 조회
  const doc = await getDocById(docId);
  if (!doc) {
    return null;
  }

  const { data, error } = await (supabase as any)
    .from('uslab_exec_doc_versions')
    .insert({
      doc_id: docId,
      title: doc.title,
      content: doc.content,
      change_type: changeType,
      note,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating version:', error);
    return null;
  }

  return data as ExecDocVersion;
}

/**
 * 버전으로 문서 복원
 */
export async function restoreDocFromVersion(
  docId: string,
  versionId: string,
  userId: string
): Promise<ExecDoc | null> {
  const supabase = getServerSupabase();

  // 1. 현재 상태를 restore_point로 저장
  await createDocVersion(docId, 'restore_point', '복원 직전 상태', userId);

  // 2. 버전 조회
  const { data: version, error: versionError } = await (supabase as any)
    .from('uslab_exec_doc_versions')
    .select('*')
    .eq('id', versionId)
    .single();

  if (versionError || !version) {
    console.error('Error fetching version:', versionError);
    return null;
  }

  // 3. 문서를 버전 내용으로 업데이트
  return updateDoc(
    docId,
    {
      title: version.title,
      content: version.content,
    },
    userId
  );
}

