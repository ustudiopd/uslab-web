/**
 * 운영진 보드(Executive Board) 쿼리 함수
 * Supabase를 사용하여 uslab_exec_boards 테이블에 접근
 */

import { createServerClient } from '@/lib/supabase/client';
import type { ExecBoard, CreateBoardData, UpdateBoardData } from '@/lib/types/execBoard';

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
 * 모든 보드 조회 (정렬 순서대로)
 */
export async function getAllBoards(): Promise<ExecBoard[]> {
  const supabase = getServerSupabase();

  const { data, error } = await (supabase as any)
    .from('uslab_exec_boards')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching boards:', error);
    return [];
  }

  return (data || []) as ExecBoard[];
}

/**
 * 보드 ID로 조회
 */
export async function getBoardById(id: string): Promise<ExecBoard | null> {
  const supabase = getServerSupabase();

  const { data, error } = await (supabase as any)
    .from('uslab_exec_boards')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching board:', error);
    return null;
  }

  return data as ExecBoard;
}

/**
 * 보드 생성
 */
export async function createBoard(
  boardData: CreateBoardData,
  userId: string
): Promise<ExecBoard | null> {
  const supabase = getServerSupabase();

  const { data, error } = await (supabase as any)
    .from('uslab_exec_boards')
    .insert({
      ...boardData,
      created_by: userId,
      updated_by: userId,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating board:', error);
    return null;
  }

  return data as ExecBoard;
}

/**
 * 보드 수정
 */
export async function updateBoard(
  id: string,
  boardData: UpdateBoardData,
  userId: string
): Promise<ExecBoard | null> {
  const supabase = getServerSupabase();

  const { data, error } = await (supabase as any)
    .from('uslab_exec_boards')
    .update({
      ...boardData,
      updated_by: userId,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating board:', error);
    return null;
  }

  return data as ExecBoard;
}

/**
 * 보드 삭제
 */
export async function deleteBoard(id: string): Promise<boolean> {
  const supabase = getServerSupabase();

  const { error } = await (supabase as any)
    .from('uslab_exec_boards')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting board:', error);
    return false;
  }

  return true;
}

