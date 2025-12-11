/**
 * USLab 프로젝트 전용 쿼리 함수
 * 
 * 모든 쿼리는 uslab_ prefix를 가진 테이블을 대상으로 합니다.
 */

import { supabase } from '@/lib/supabase/client';
import { Database } from '@/lib/types/uslab';

type Tables = Database['public']['Tables'];
type TableName = keyof Tables;

/**
 * 테이블 이름에 uslab_ prefix를 자동으로 추가하는 헬퍼
 * 
 * @param tableName - 테이블 이름 (prefix 없이)
 * @returns uslab_ prefix가 붙은 테이블 이름
 * 
 * @example
 * ```ts
 * const table = getTableName('projects'); // 'uslab_projects'
 * ```
 */
export function getTableName(tableName: string): string {
  return `uslab_${tableName}`;
}

/**
 * Supabase 쿼리 빌더를 반환하는 헬퍼
 * 
 * @param tableName - 테이블 이름 (prefix 없이)
 * @returns Supabase 쿼리 빌더
 * 
 * @example
 * ```ts
 * const { data } = await from('projects').select('*');
 * ```
 */
export function from<T extends string>(tableName: T) {
  return supabase.from(getTableName(tableName) as any);
}

/**
 * 프로젝트 목록 조회
 * 
 * @example
 * ```ts
 * const projects = await getProjects();
 * ```
 */
export async function getProjects() {
  const { data, error } = await from('projects').select('*').order('created_at', { ascending: false });
  
  if (error) {
    throw new Error(`Failed to fetch projects: ${error.message}`);
  }
  
  return data;
}

/**
 * 프로젝트 상세 조회
 * 
 * @param id - 프로젝트 ID
 */
export async function getProjectById(id: string) {
  const { data, error } = await from('projects')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    throw new Error(`Failed to fetch project: ${error.message}`);
  }
  
  return data;
}

/**
 * 포스트 목록 조회
 * 
 * @param limit - 조회할 포스트 수 (기본값: 10)
 */
export async function getPosts(limit: number = 10) {
  const { data, error } = await from('posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    throw new Error(`Failed to fetch posts: ${error.message}`);
  }
  
  return data;
}

/**
 * 포스트 상세 조회
 * 
 * @param slug - 포스트 slug
 */
export async function getPostBySlug(slug: string) {
  const { data, error } = await from('posts')
    .select('*')
    .eq('slug', slug)
    .single();
  
  if (error) {
    throw new Error(`Failed to fetch post: ${error.message}`);
  }
  
  return data;
}

