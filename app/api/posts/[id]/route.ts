import { NextResponse } from 'next/server';
import { getPostById, updatePost, deletePost } from '@/lib/queries/posts';
import type { UpdatePostData } from '@/lib/types/blog';

interface RouteParams {
  params: { id: string };
}

// GET: 포스트 상세 조회
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const post = await getPostById(params.id);

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json(
      { error: 'Failed to fetch post' },
      { status: 500 }
    );
  }
}

// PUT: 포스트 수정
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const body: UpdatePostData = await request.json();

    const post = await updatePost(params.id, body);

    if (!post) {
      return NextResponse.json(
        { error: 'Failed to update post' },
        { status: 500 }
      );
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 }
    );
  }
}

// DELETE: 포스트 삭제
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const success = await deletePost(params.id);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete post' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    );
  }
}

