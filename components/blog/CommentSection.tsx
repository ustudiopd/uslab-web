'use client';

import { useState, useEffect } from 'react';
import type { UslabComment, CreateCommentData } from '@/lib/types/blog';

interface CommentSectionProps {
  postId: string;
}

export default function CommentSection({ postId }: CommentSectionProps) {
  const [comments, setComments] = useState<Omit<UslabComment, 'password_hash' | 'is_approved'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    author_name: '',
    password: '',
    content: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // 댓글 목록 불러오기
  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/comments?post_id=${postId}`);
      const data = await response.json();

      if (response.ok) {
        setComments(data.comments || []);
      } else {
        console.error('Failed to fetch comments:', data.error, data.details);
        // 에러가 있어도 빈 배열로 설정하여 UI가 깨지지 않도록 함
        setComments([]);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      // 네트워크 에러 등이 발생해도 빈 배열로 설정
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          post_id: postId,
          author_name: formData.author_name,
          password: formData.password,
          content: formData.content,
        } as CreateCommentData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setFormData({ author_name: '', password: '', content: '' });
        setIsFormOpen(false);
        // 댓글 목록 새로고침
        fetchComments();
        // 성공 메시지 3초 후 제거
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(data.error || '댓글 작성에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      setError('댓글 작성 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-slate-800">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-semibold text-white">
          댓글 ({comments.length})
        </h2>
        {!isFormOpen && (
          <button
            onClick={() => setIsFormOpen(true)}
            className="px-3 py-1.5 bg-cyan-500 text-white rounded text-sm font-medium hover:bg-cyan-600 transition-colors"
          >
            댓글달기
          </button>
        )}
      </div>

      {/* 댓글 작성 폼 */}
      {isFormOpen && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 mb-6">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label htmlFor="author_name" className="block text-xs font-medium text-slate-300 mb-1">
                  이름
                </label>
                <input
                  type="text"
                  id="author_name"
                  value={formData.author_name}
                  onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                  placeholder="이름"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-xs font-medium text-slate-300 mb-1">
                  비밀번호
                </label>
                <input
                  type="password"
                  id="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                  placeholder="수정/삭제용"
                />
              </div>
            </div>
            <div>
              <label htmlFor="content" className="block text-xs font-medium text-slate-300 mb-1">
                댓글
              </label>
              <textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                required
                rows={3}
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all resize-none"
                placeholder="댓글을 입력하세요"
              />
            </div>
            {error && (
              <div className="text-red-400 text-xs">{error}</div>
            )}
            {success && (
              <div className="text-green-400 text-xs">댓글이 작성되었습니다.</div>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-cyan-500 text-white rounded text-sm font-medium hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? '작성 중...' : '작성'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsFormOpen(false);
                  setFormData({ author_name: '', password: '', content: '' });
                  setError(null);
                }}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded text-sm font-medium hover:bg-slate-700 transition-colors"
              >
                취소
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 댓글 목록 */}
      {loading ? (
        <div className="text-center py-6 text-slate-400 text-sm">댓글을 불러오는 중...</div>
      ) : comments.length === 0 ? (
        <div className="text-center py-6 text-slate-400 text-sm">아직 댓글이 없습니다.</div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="bg-slate-900 border border-slate-800 rounded-lg p-4"
            >
              <div className="flex items-start gap-3 mb-2">
                <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-cyan-400 font-bold text-sm flex-shrink-0">
                  {comment.author_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="font-semibold text-white text-sm">{comment.author_name}</div>
                    <div className="text-xs text-slate-400">{formatDate(comment.created_at)}</div>
                  </div>
                  <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {comment.content}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


