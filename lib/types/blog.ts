/**
 * 블로그 관련 타입 정의
 */

export interface UslabPost {
  id: string;
  slug: string;
  title: string;
  content: any; // Tiptap JSON
  thumbnail_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string[] | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  author_id: string;
  locale: 'ko' | 'en';
  canonical_id: string | null;
  view_count: number;
}

export interface UslabPostVersion {
  id: string;
  post_id: string;
  content: any; // Tiptap JSON
  change_log: string | null;
  created_at: string;
}

export interface CreatePostData {
  slug: string;
  title: string;
  content: any; // Tiptap JSON
  thumbnail_url?: string | null;
  locale: 'ko' | 'en';
  canonical_id?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string[] | null;
  is_published?: boolean;
  published_at?: string | null;
}

export interface UpdatePostData {
  slug?: string;
  title?: string;
  content?: any; // Tiptap JSON
  thumbnail_url?: string | null;
  locale?: 'ko' | 'en';
  canonical_id?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string[] | null;
  is_published?: boolean;
  published_at?: string | null;
}

export interface PostListParams {
  page?: number;
  limit?: number;
}

export interface PostListResponse {
  posts: UslabPost[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UslabComment {
  id: string;
  post_id: string;
  author_name: string;
  password_hash: string;
  content: string;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCommentData {
  post_id: string;
  author_name: string;
  password: string;
  content: string;
}

export interface UpdateCommentData {
  content: string;
}

export interface DeleteCommentData {
  password: string;
}




