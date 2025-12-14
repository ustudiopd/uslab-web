/**
 * 소개 페이지 관련 타입 정의
 */

export interface UslabAbout {
  id: string;
  locale: 'ko' | 'en';
  content: any; // Tiptap JSON
  updated_at: string;
  created_at: string;
  author_id: string | null;
  view_count?: number; // 조회수
}

export interface UpdateAboutData {
  content: any; // Tiptap JSON
}
