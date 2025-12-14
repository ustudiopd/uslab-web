'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import Footer from '@/components/Footer';
import { LanguageProvider } from '@/lib/i18n/context';
import type { Locale } from '@/lib/i18n/config';
import type { Translations } from '@/lib/i18n/server';

interface AdminLayoutProps {
  children: React.ReactNode;
  initialLang: Locale;
  dict: Translations;
}

export default function AdminLayout({ children, initialLang, dict }: AdminLayoutProps) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const tabs = [
    { name: '대시보드', href: '/admin/dashboard' },
    { name: '포스트 관리', href: '/admin/posts' },
    { name: '소개 페이지', href: '/admin/about' },
  ];

  const isActive = (href: string) => {
    if (href === '/admin/dashboard') {
      return pathname === '/admin/dashboard';
    }
    return pathname?.startsWith(href);
  };

  return (
    <LanguageProvider initialLang={initialLang} dict={dict}>
      <div className="min-h-screen bg-slate-950 flex flex-col">
        {/* 헤더 */}
        <header className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
            {/* 모바일: 세로 레이아웃 */}
            <div className="flex flex-col sm:hidden">
              {/* 상단: 탭 네비게이션 */}
              <div className="flex items-center justify-between h-14">
                <nav className="flex items-center gap-0.5 flex-1 overflow-x-auto scrollbar-hide">
                  {tabs.map((tab) => (
                    <Link
                      key={tab.href}
                      href={tab.href}
                      className={`px-2.5 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                        isActive(tab.href)
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      {tab.name}
                    </Link>
                  ))}
                </nav>
              </div>
              {/* 하단: 사용자 정보 및 로그아웃 */}
              {user && (
                <div className="flex items-center justify-between px-1 py-2 border-t border-slate-800">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-6 h-6 bg-cyan-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-cyan-400 text-xs font-bold">A</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-white truncate">
                        {user.email?.split('@')[0] || '관리자'}
                      </div>
                      <div className="text-[10px] text-slate-400">관리자</div>
                    </div>
                  </div>
                  <button
                    onClick={signOut}
                    className="px-2.5 py-1 text-[10px] text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 transition-colors whitespace-nowrap flex-shrink-0"
                  >
                    로그아웃
                  </button>
                </div>
              )}
            </div>

            {/* 데스크톱: 가로 레이아웃 */}
            <div className="hidden sm:flex items-center justify-between h-16">
              {/* 왼쪽: 탭 네비게이션 */}
              <nav className="flex items-center gap-1">
                {tabs.map((tab) => (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                      isActive(tab.href)
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {tab.name}
                  </Link>
                ))}
              </nav>

              {/* 오른쪽: 사용자 정보 및 로그아웃 */}
              <div className="flex items-center gap-4">
                {user && (
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-medium text-white">
                        {user.email || '관리자'}
                      </div>
                      <div className="text-xs text-slate-400">관리자 계정</div>
                    </div>
                    <button
                      onClick={signOut}
                      className="px-3 py-1.5 text-sm text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 transition-colors"
                    >
                      로그아웃
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* 메인 컨텐츠 */}
        <main className="pt-4 flex-1">{children}</main>

        {/* 푸터 */}
        <Footer />
      </div>
    </LanguageProvider>
  );
}

