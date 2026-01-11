import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// API Route runtime 설정 (Edge Runtime 사용 시 body size limit 제한이 있을 수 있음)
export const runtime = 'nodejs';
export const maxDuration = 300; // 5분 (큰 파일 업로드 시간 확보)

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * 이미지 업로드 API
 * 
 * Supabase Storage에 이미지를 업로드하고 Public URL을 반환합니다.
 * 버킷 이름: uslab-images
 */
export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // Supabase 클라이언트 생성 (Service Role Key 사용)
    if (!supabaseServiceRoleKey) {
      return NextResponse.json(
        { error: '서버 설정 오류: SUPABASE_SERVICE_ROLE_KEY가 없습니다.' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // FormData에서 파일 추출
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: '파일이 제공되지 않았습니다.' },
        { status: 400 }
      );
    }

    // 파일 타입 검증 (이미지만 허용)
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: '이미지 파일만 업로드할 수 있습니다.' },
        { status: 400 }
      );
    }

    // 파일 크기 검증 (최대 1GB)
    const maxSize = 1024 * 1024 * 1024; // 1GB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: '파일 크기는 1GB를 초과할 수 없습니다.' },
        { status: 400 }
      );
    }

    // 고유한 파일명 생성 (타임스탬프 + 랜덤 문자열)
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const fileExt = file.name.split('.').pop() || 'png';
    const fileName = `uslab/${timestamp}-${randomStr}.${fileExt}`;

    // Supabase Storage에 업로드
    const { data, error } = await supabase.storage
      .from('uslab-images')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false, // 기존 파일 덮어쓰기 방지
      });

    if (error) {
      console.error('Supabase Storage 업로드 오류:', error);
      return NextResponse.json(
        { error: `이미지 업로드 실패: ${error.message}` },
        { status: 500 }
      );
    }

    // Public URL 가져오기
    const { data: urlData } = supabase.storage
      .from('uslab-images')
      .getPublicUrl(fileName);

    if (!urlData?.publicUrl) {
      return NextResponse.json(
        { error: '업로드된 이미지의 URL을 가져올 수 없습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: urlData.publicUrl,
      path: fileName,
    });
  } catch (error: any) {
    console.error('이미지 업로드 오류:', error);
    
    // 413 에러 (Payload Too Large) 처리
    if (error.message?.includes('413') || error.message?.includes('too large') || error.message?.includes('Payload')) {
      return NextResponse.json(
        { error: '파일 크기가 너무 큽니다. Vercel의 기본 제한(4.5MB)을 초과했을 수 있습니다. 더 큰 파일을 업로드하려면 Vercel 설정을 확인하세요.' },
        { status: 413 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || '이미지 업로드 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}






