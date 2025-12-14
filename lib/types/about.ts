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
  seo_title?: string | null; // SEO 제목
  seo_description?: string | null; // SEO 설명
  seo_keywords?: string[] | null; // SEO 키워드
}

export interface UpdateAboutData {
  content: any; // Tiptap JSON
}

