/**
 * USLab 프로젝트 전용 타입 정의
 * 
 * Supabase에서 생성한 타입을 기반으로 uslab_ prefix 테이블에 대한 타입을 정의합니다.
 */

/**
 * 데이터베이스 스키마 타입
 * 
 * 실제 테이블이 생성되면 Supabase CLI로 자동 생성된 타입을 여기에 추가하세요.
 * 
 * @example
 * ```ts
 * npx supabase gen types typescript --project-id gzguucdzsrfypbkqlyku > lib/types/supabase.ts
 * ```
 */
export type Database = {
  public: {
    Tables: {
      uslab_inquiries: {
        Row: {
          id: string;
          name: string;
          email: string;
          message: string;
          status: 'pending' | 'contacted' | 'completed';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          message: string;
          status?: 'pending' | 'contacted' | 'completed';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          message?: string;
          status?: 'pending' | 'contacted' | 'completed';
          created_at?: string;
          updated_at?: string;
        };
      };
      uslab_posts: {
        Row: {
          id: string;
          slug: string;
          title: string;
          content: any; // jsonb
          thumbnail_url: string | null;
          locale: 'ko' | 'en';
          canonical_id: string | null;
          seo_title: string | null;
          seo_description: string | null;
          seo_keywords: string[] | null;
          is_published: boolean;
          published_at: string | null;
          created_at: string;
          updated_at: string;
          author_id: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          content: any; // jsonb
          thumbnail_url?: string | null;
          locale?: 'ko' | 'en';
          canonical_id?: string | null;
          seo_title?: string | null;
          seo_description?: string | null;
          seo_keywords?: string[] | null;
          is_published?: boolean;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
          author_id: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          content?: any; // jsonb
          thumbnail_url?: string | null;
          locale?: 'ko' | 'en';
          canonical_id?: string | null;
          seo_title?: string | null;
          seo_description?: string | null;
          seo_keywords?: string[] | null;
          is_published?: boolean;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
          author_id?: string;
        };
      };
      uslab_post_versions: {
        Row: {
          id: string;
          post_id: string;
          content: any; // jsonb
          change_log: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          content: any; // jsonb
          change_log?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          content?: any; // jsonb
          change_log?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
};

/**
 * 테이블 타입 헬퍼
 */
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type Inserts<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type Updates<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

