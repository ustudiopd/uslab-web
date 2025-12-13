/**
 * 블로그 포스트 쿼리 함수
 * Supabase를 사용하여 uslab_posts 테이블에 접근
 * 
 * Server Component에서 사용할 때는 createServerClient()를 사용
 * Client Component에서 사용할 때는 supabase를 사용
 */

import { supabase } from '@/lib/supabase/client';
import { createServerClient } from '@/lib/supabase/client';
import type { UslabPost, CreatePostData, UpdatePostData, PostListParams, PostListResponse } from '@/lib/types/blog';
import type { Locale } from '@/lib/i18n/config';

// Server Component용 Supabase 클라이언트 생성
function getServerSupabase() {
  try {
    return createServerClient();
  } catch {
    // 서비스 롤 키가 없으면 일반 클라이언트 사용 (RLS 정책에 따라)
    return supabase;
  }
}

/**
 * slug와 locale로 포스트 조회 (발행된 포스트만)
 * Server Component에서 사용
 */
export async function getPostBySlug(lang: Locale, slug: string): Promise<UslabPost | null> {
  const client = getServerSupabase();
  const { data, error } = await (client
    .from('uslab_posts') as any)
    .select('*')
    .eq('locale', lang)
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (error) {
    console.error('Error fetching post:', error);
    return null;
  }

  return data as UslabPost;
}

/**
 * 발행된 포스트 목록 조회 (페이지네이션)
 * Server Component에서 사용
 */
export async function getPublishedPosts(
  lang: Locale,
  params: PostListParams = {}
): Promise<PostListResponse> {
  const { page = 1, limit = 10 } = params;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const client = getServerSupabase();

  // 전체 개수 조회
  const { count } = await (client
    .from('uslab_posts') as any)
    .select('*', { count: 'exact', head: true })
    .eq('locale', lang)
    .eq('is_published', true);

  // 포스트 목록 조회
  const { data, error } = await (client
    .from('uslab_posts') as any)
    .select('*')
    .eq('locale', lang)
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('Error fetching posts:', error);
    return {
      posts: [],
      total: 0,
      page,
      limit,
      totalPages: 0,
    };
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / limit);

  return {
    posts: (data || []) as UslabPost[],
    total,
    page,
    limit,
    totalPages,
  };
}

/**
 * 모든 포스트 조회 (Admin용, 발행/초안 모두)
 * Client Component에서 사용 (인증 필요)
 */
export async function getAllPosts(lang?: Locale): Promise<UslabPost[]> {
  let query = (supabase
    .from('uslab_posts') as any)
    .select('*')
    .order('created_at', { ascending: false });

  if (lang) {
    query = query.eq('locale', lang);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching all posts:', error);
    return [];
  }

  return (data || []) as UslabPost[];
}

/**
 * ID로 포스트 조회 (Admin용)
 * Client Component에서 사용 (인증 필요)
 */
export async function getPostById(id: string): Promise<UslabPost | null> {
  const { data, error } = await (supabase
    .from('uslab_posts') as any)
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching post by id:', error);
    return null;
  }

  return data as UslabPost;
}

/**
 * 새 포스트 생성
 */
export async function createPost(data: CreatePostData): Promise<UslabPost | null> {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user?.user) {
    throw new Error('User not authenticated');
  }

  const { data: post, error } = await (supabase
    .from('uslab_posts') as any)
    .insert({
      ...data,
      author_id: user.user.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating post:', error);
    return null;
  }

  return post as UslabPost;
}

/**
 * 포스트 수정
 */
export async function updatePost(id: string, data: UpdatePostData): Promise<UslabPost | null> {
  const { data: post, error } = await (supabase
    .from('uslab_posts') as any)
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating post:', error);
    return null;
  }

  return post as UslabPost;
}

/**
 * 포스트 삭제
 */
export async function deletePost(id: string): Promise<boolean> {
  const { error } = await (supabase
    .from('uslab_posts') as any)
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting post:', error);
    return false;
  }

  return true;
}

/**
 * 같은 canonical_id를 가진 다른 언어 버전 조회 (hreflang용)
 * Server Component에서 사용
 */
export async function getPostAlternates(canonicalId: string): Promise<Array<{ locale: Locale; slug: string }>> {
  const client = getServerSupabase();
  const { data, error } = await (client
    .from('uslab_posts') as any)
    .select('locale, slug')
    .eq('canonical_id', canonicalId)
    .eq('is_published', true);

  if (error) {
    console.error('Error fetching post alternates:', error);
    return [];
  }

  return (data || []) as Array<{ locale: Locale; slug: string }>;
}











