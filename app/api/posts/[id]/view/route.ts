import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/uslab';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST: 포스트 조회수 증가
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      );
    }

    // Supabase 클라이언트 생성 (anon key 사용 - 공개 API)
    const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // 조회수 증가 함수 호출
    // @ts-expect-error - RPC 함수 타입이 자동 생성되지 않아 임시로 타입 체크 비활성화
    const { data, error } = await supabase.rpc('uslab_increment_view_count', {
      post_id: id,
    });

    if (error) {
      console.error('Error incrementing view count:', error);
      return NextResponse.json(
        { error: 'Failed to increment view count', details: error.message },
        { status: 500 }
      );
    }

    // 성공 응답 (조회수 반환)
    return NextResponse.json({
      success: true,
      view_count: data || 0,
    });
  } catch (error) {
    console.error('Error in view count increment:', error);
    return NextResponse.json(
      { error: 'Failed to increment view count' },
      { status: 500 }
    );
  }
}
