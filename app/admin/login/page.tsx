'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('Login error details:', signInError);
        setError(signInError.message || '로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.');
        setLoading(false);
        return;
      }

      if (data.user) {
        // 로그인 성공 시 대시보드로 리다이렉트
        router.push('/admin/dashboard');
        router.refresh();
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white border border-slate-200 rounded-lg p-8 shadow-sm">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">USLab AI Admin</h1>
            <p className="text-slate-600">관리자 로그인</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                이메일
              </label>
              <input
                id="email"
                type="email"
                value={email || ''}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                placeholder="admin@uslab.ai"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                value={password || ''}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}





