import { NextResponse } from 'next/server';
import { createPost, getAllPosts, getPublishedPosts } from '@/lib/queries/posts';
import type { CreatePostData } from '@/lib/types/blog';
import type { Locale } from '@/lib/i18n/config';

// GET: 포스트 목록 조회
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lang = (searchParams.get('lang') || 'ko') as Locale;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const all = searchParams.get('all') === 'true'; // Admin용: 모든 포스트 조회

    if (all) {
      // Admin용: 모든 포스트 (발행/초안 모두)
      const posts = await getAllPosts(lang);
      return NextResponse.json({ posts });
    } else {
      // 공개용: 발행된 포스트만
      const result = await getPublishedPosts(lang, { page, limit });
      return NextResponse.json(result);
    }
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

// POST: 새 포스트 생성
export async function POST(request: Request) {
  try {
    const body: CreatePostData = await request.json();

    // 필수 필드 검증
    if (!body.slug || !body.title || !body.content || !body.locale) {
      return NextResponse.json(
        { error: 'Missing required fields: slug, title, content, locale' },
        { status: 400 }
      );
    }

    const post = await createPost(body);

    if (!post) {
      return NextResponse.json(
        { error: 'Failed to create post' },
        { status: 500 }
      );
    }

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
}

