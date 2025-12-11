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
      // 예시: 추가 테이블 생성 후 업데이트 필요
      // uslab_projects: {
      //   Row: {
      //     id: string;
      //     title: string;
      //     description: string | null;
      //     created_at: string;
      //     updated_at: string;
      //   };
      //   Insert: {
      //     id?: string;
      //     title: string;
      //     description?: string | null;
      //     created_at?: string;
      //     updated_at?: string;
      //   };
      //   Update: {
      //     id?: string;
      //     title?: string;
      //     description?: string | null;
      //     updated_at?: string;
      //   };
      // };
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

