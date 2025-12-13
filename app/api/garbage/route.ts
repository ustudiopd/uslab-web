import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { UslabPost } from '@/lib/types/blog';
import type { JSONContent } from 'novel';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Tiptap JSON content에서 모든 이미지 URL을 추출
 */
function extractAllImageUrls(content: JSONContent | null | undefined): string[] {
  const urls: string[] = [];
  
  if (!content) return urls;

  function findImages(node: JSONContent) {
    if (node.type === 'image' && node.attrs?.src) {
      urls.push(node.attrs.src);
    }

    if (node.content && Array.isArray(node.content)) {
      for (const child of node.content) {
        findImages(child);
      }
    }
  }

  findImages(content);
  return urls;
}

/**
 * URL에서 Storage 경로 추출
 * 예: https://xxx.supabase.co/storage/v1/object/public/uslab-images/uslab/123-abc.png
 *     → uslab/123-abc.png
 */
function extractStoragePath(url: string): string | null {
  try {
    const urlObj = new URL(url);
    // /storage/v1/object/public/uslab-images/ 경로에서 파일 경로 추출
    const match = urlObj.pathname.match(/\/storage\/v1\/object\/public\/uslab-images\/(.+)$/);
    if (match && match[1]) {
      return decodeURIComponent(match[1]);
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * GET: 미아 이미지 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

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

    // 1. 모든 포스트 조회
    const { data: posts, error: postsError } = await supabase
      .from('uslab_posts')
      .select('id, content, thumbnail_url');

    if (postsError) {
      console.error('Error fetching posts:', postsError);
      return NextResponse.json(
        { error: '포스트 조회 실패', details: postsError.message },
        { status: 500 }
      );
    }

    // 2. 사용 중인 이미지 경로 수집
    const usedPaths = new Set<string>();

    (posts || []).forEach((post: { id: string; content: any; thumbnail_url: string | null }) => {
      // content에서 이미지 URL 추출
      const imageUrls = extractAllImageUrls(post.content as JSONContent);
      imageUrls.forEach(url => {
        const path = extractStoragePath(url);
        if (path) {
          usedPaths.add(path);
        }
      });

      // thumbnail_url 처리
      if (post.thumbnail_url) {
        const path = extractStoragePath(post.thumbnail_url);
        if (path) {
          usedPaths.add(path);
        }
      }
    });

    // 3. Storage 버킷의 모든 파일 목록 가져오기
    const { data: files, error: storageError } = await supabase.storage
      .from('uslab-images')
      .list('uslab', {
        limit: 1000,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (storageError) {
      console.error('Error listing storage files:', storageError);
      return NextResponse.json(
        { error: 'Storage 파일 목록 조회 실패', details: storageError.message },
        { status: 500 }
      );
    }

    // 4. 미아 이미지 찾기
    const orphanFiles = (files || [])
      .filter(file => {
        const fullPath = `uslab/${file.name}`;
        return !usedPaths.has(fullPath);
      })
      .map(file => ({
        name: file.name,
        path: `uslab/${file.name}`,
        size: file.metadata?.size || 0,
        created_at: file.created_at,
      }));

    return NextResponse.json({
      orphanFiles,
      totalOrphanFiles: orphanFiles.length,
      totalStorageFiles: files?.length || 0,
      totalUsedFiles: usedPaths.size,
    });
  } catch (error: any) {
    console.error('가비지 관리 오류:', error);
    return NextResponse.json(
      { error: error.message || '가비지 관리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE: 미아 이미지 삭제
 */
export async function DELETE(request: NextRequest) {
  try {
    // 인증 확인
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

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

    const body = await request.json();
    const { paths } = body; // 삭제할 파일 경로 배열

    if (!paths || !Array.isArray(paths) || paths.length === 0) {
      return NextResponse.json(
        { error: '삭제할 파일 경로가 제공되지 않았습니다.' },
        { status: 400 }
      );
    }

    // 여러 파일 삭제
    const { data, error } = await supabase.storage
      .from('uslab-images')
      .remove(paths);

    if (error) {
      console.error('Error deleting files:', error);
      return NextResponse.json(
        { error: '파일 삭제 실패', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      deletedCount: paths.length,
      deletedFiles: data || [],
    });
  } catch (error: any) {
    console.error('파일 삭제 오류:', error);
    return NextResponse.json(
      { error: error.message || '파일 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
