'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import Footer from '@/components/Footer';
import { LanguageProvider } from '@/lib/i18n/context';
import type { Locale } from '@/lib/i18n/config';
import type { Translations } from '@/lib/i18n/server';
import { LayoutDashboard, FileText, Users, Info, LogOut, ChevronDown, User } from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  initialLang: Locale;
  dict: Translations;
}

export default function AdminLayout({ children, initialLang, dict }: AdminLayoutProps) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  const tabs = [
    { name: '대시보드', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: '운영진 보드', href: '/admin/exec-board', icon: Users },
    { name: '포스트 관리', href: '/admin/posts', icon: FileText },
    { name: '소개 페이지', href: '/admin/about', icon: Info },
  ];

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    };

    if (isAccountMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAccountMenuOpen]);

  const isActive = (href: string) => {
    if (href === '/admin/dashboard') {
      return pathname === '/admin/dashboard';
    }
    if (href === '/admin/exec-board') {
      return pathname === '/admin/exec-board' || pathname?.startsWith('/admin/exec-board');
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
              {/* 상단: 탭 네비게이션 (아이콘만) + 계정 아이콘 (오른쪽 위) */}
              <div className="flex items-center justify-between h-14">
                <nav className="flex items-center gap-1 flex-1 overflow-x-auto scrollbar-hide px-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <Link
                        key={tab.href}
                        href={tab.href}
                        className={`p-2 rounded transition-colors flex-shrink-0 ${
                          isActive(tab.href)
                            ? 'bg-cyan-500/20 text-cyan-400'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                        }`}
                        title={tab.name}
                      >
                        <Icon size={20} />
                      </Link>
                    );
                  })}
                </nav>
                {/* 오른쪽 위: 계정 아이콘 */}
                {user && (
                  <div className="relative flex-shrink-0" ref={accountMenuRef}>
                    <button
                      onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                      className="p-2 rounded transition-colors text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                      aria-label="계정 메뉴"
                    >
                      <User size={20} />
                    </button>
                    {/* 드롭다운 메뉴 */}
                    {isAccountMenuOpen && (
                      <div className="absolute top-full right-0 mt-1 bg-slate-900 border border-slate-800 rounded shadow-lg z-50 min-w-[200px]">
                        {/* 계정 정보 */}
                        <div className="px-4 py-3 border-b border-slate-800">
                          <div className="text-sm font-medium text-white">
                            {user.email?.split('@')[0] || '관리자'}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5 truncate">
                            {user.email || '관리자 계정'}
                          </div>
                        </div>
                        {/* 로그아웃 버튼 */}
                        <button
                          onClick={() => {
                            signOut();
                            setIsAccountMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                        >
                          <LogOut size={16} />
                          <span>로그아웃</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 데스크톱: 가로 레이아웃 */}
            <div className="hidden sm:flex items-center justify-between h-16">
              {/* 왼쪽: 탭 네비게이션 */}
              <nav className="flex items-center gap-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <Link
                      key={tab.href}
                      href={tab.href}
                      className={`px-4 py-2 text-sm font-medium rounded transition-colors flex items-center gap-2 ${
                        isActive(tab.href)
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      <Icon size={18} />
                      <span>{tab.name}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* 오른쪽: 사용자 정보 및 로그아웃 (드롭다운) */}
              <div className="flex items-center gap-4">
                {user && (
                  <div className="relative" ref={accountMenuRef}>
                    <button
                      onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                      className="flex items-center gap-3 px-3 py-2 rounded hover:bg-slate-800 transition-colors"
                    >
                      <div className="text-right">
                        <div className="text-sm font-medium text-white">
                          {user.email || '관리자'}
                        </div>
                        <div className="text-xs text-slate-400">관리자 계정</div>
                      </div>
                      <ChevronDown
                        size={16}
                        className={`text-slate-400 transition-transform ${
                          isAccountMenuOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {/* 드롭다운 메뉴 */}
                    {isAccountMenuOpen && (
                      <div className="absolute top-full right-0 mt-1 bg-slate-900 border border-slate-800 rounded shadow-lg z-50 min-w-[160px]">
                        <button
                          onClick={() => {
                            signOut();
                            setIsAccountMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors rounded"
                        >
                          <LogOut size={16} />
                          <span>로그아웃</span>
                        </button>
                      </div>
                    )}
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


