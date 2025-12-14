'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/hooks';

export default function Navbar() {
  const { t, locale } = useTranslation();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 현재 경로에서 언어 제거한 경로 생성
  const getPathWithoutLang = () => {
    const segments = pathname.split('/').filter(Boolean);
    if (segments[0] === 'ko' || segments[0] === 'en') {
      const pathWithoutLang = '/' + segments.slice(1).join('/');
      // 루트 경로인 경우 빈 문자열 반환
      return pathWithoutLang === '/' ? '' : pathWithoutLang;
    }
    return pathname === '/' ? '' : pathname;
  };

  const basePath = getPathWithoutLang();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  const handleContactClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    // 메일 앱 열기
    const subject = encodeURIComponent('USlab.ai 문의');
    const body = encodeURIComponent('안녕하세요,\n\nUSlab.ai에 대한 문의사항이 있어 연락드립니다.\n\n');
    window.location.href = `mailto:contact@uslab.ai?subject=${subject}&body=${body}`;
    setIsMobileMenuOpen(false);
  };

  return (
    <nav
      className={`fixed w-full z-50 dark:bg-slate-950/80 bg-white/80 backdrop-blur-md border-b transition-all duration-300 ${
        isScrolled 
          ? 'dark:border-slate-800 border-slate-200 dark:bg-slate-950/90 bg-white/90' 
          : 'dark:border-slate-800 border-slate-200'
      }`}
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-20">
          {/* Logo */}
          <Link
            href={`/${locale}`}
            className="flex-shrink-0 flex items-center cursor-pointer group"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded mr-3 flex items-center justify-center text-white font-mono font-bold text-sm">
              US
            </div>
            <span className="text-xl font-bold tracking-tight dark:text-white dark:group-hover:text-cyan-400 text-slate-900 group-hover:text-cyan-600 transition-colors">
              USlab<span className="text-cyan-500 dark:text-cyan-500">.ai</span>
            </span>
          </Link>

          {/* Desktop Menu - 오른쪽 정렬 */}
          <div className="hidden md:flex items-center space-x-10 ml-auto">
            <Link
              href={`/${locale}/about`}
              className="text-sm font-medium dark:text-slate-400 text-slate-600 dark:hover:text-white hover:text-slate-900 transition-colors uppercase tracking-wider"
            >
              {t('nav.about')}
            </Link>
            <a
              href="#services"
              className="text-sm font-medium dark:text-slate-400 text-slate-600 dark:hover:text-white hover:text-slate-900 transition-colors uppercase tracking-wider"
            >
              {t('nav.services')}
            </a>
            <a
              href="#portfolio"
              className="text-sm font-medium dark:text-slate-400 text-slate-600 dark:hover:text-white hover:text-slate-900 transition-colors uppercase tracking-wider"
            >
              {t('nav.portfolio')}
            </a>
            <Link
              href={`/${locale}/blog`}
              className="text-sm font-medium dark:text-slate-400 text-slate-600 dark:hover:text-white hover:text-slate-900 transition-colors uppercase tracking-wider"
            >
              {t('nav.blog')}
            </Link>
            <a
              href="#contact"
              onClick={handleContactClick}
              className="bg-white/5 dark:bg-white/5 bg-slate-100 border border-slate-700 dark:border-slate-700 border-slate-300 text-white dark:text-white dark:hover:text-white text-slate-900 hover:text-white px-6 py-2 rounded font-medium hover:bg-cyan-500 hover:border-cyan-500 transition-all duration-300 text-sm cursor-pointer"
            >
              {t('nav.contact')}
            </a>
            {/* Language Toggle */}
            <Link
              href={locale === 'ko' ? `/en${basePath}` : `/ko${basePath}`}
              className="text-sm font-medium dark:text-slate-400 text-slate-600 dark:hover:text-white hover:text-slate-900 transition-colors uppercase tracking-wider px-3 py-1 rounded dark:border-slate-700 border-slate-300 hover:border-cyan-500"
              aria-label="Toggle language"
            >
              {locale === 'ko' ? 'ENG' : 'KOR'}
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center ml-auto">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="dark:text-slate-300 text-slate-700 dark:hover:text-white hover:text-slate-900 focus:outline-none"
              aria-label={t('nav.menuToggle')}
            >
              <i
                className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'} text-xl`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      <div
        className={`md:hidden dark:bg-slate-900 bg-white dark:border-slate-800 border-slate-200 absolute w-full transition-all ${
          isMobileMenuOpen ? 'block' : 'hidden'
        }`}
      >
        <div className="px-4 py-4 space-y-3">
          <Link
            href={`/${locale}/about`}
            onClick={handleLinkClick}
            className="block px-3 py-2 text-base font-medium dark:text-slate-400 text-slate-600 dark:hover:text-white hover:text-slate-900 dark:hover:bg-slate-800 hover:bg-slate-100 rounded"
          >
            {t('nav.about')}
          </Link>
          <a
            href="#services"
            onClick={handleLinkClick}
            className="block px-3 py-2 text-base font-medium dark:text-slate-400 text-slate-600 dark:hover:text-white hover:text-slate-900 dark:hover:bg-slate-800 hover:bg-slate-100 rounded"
          >
            {t('nav.services')}
          </a>
          <a
            href="#portfolio"
            onClick={handleLinkClick}
            className="block px-3 py-2 text-base font-medium dark:text-slate-400 text-slate-600 dark:hover:text-white hover:text-slate-900 dark:hover:bg-slate-800 hover:bg-slate-100 rounded"
          >
            {t('nav.portfolio')}
          </a>
          <Link
            href={`/${locale}/blog`}
            onClick={handleLinkClick}
            className="block px-3 py-2 text-base font-medium dark:text-slate-400 text-slate-600 dark:hover:text-white hover:text-slate-900 dark:hover:bg-slate-800 hover:bg-slate-100 rounded"
          >
            {t('nav.blog')}
          </Link>
          <a
            href="#contact"
            onClick={handleContactClick}
            className="block px-3 py-2 text-base font-medium text-cyan-400 hover:bg-slate-800 dark:hover:bg-slate-800 hover:bg-slate-100 rounded cursor-pointer"
          >
            {t('nav.contact')}
          </a>
          {/* Mobile Language Toggle */}
          <Link
            href={locale === 'ko' ? `/en${basePath}` : `/ko${basePath}`}
            onClick={handleLinkClick}
            className="block w-full text-left px-3 py-2 text-base font-medium dark:text-slate-400 text-slate-600 dark:hover:text-white hover:text-slate-900 dark:hover:bg-slate-800 hover:bg-slate-100 rounded dark:border-slate-800 border-slate-200 mt-2"
          >
            {locale === 'ko' ? 'English' : '한국어'}
          </Link>
        </div>
      </div>
    </nav>
  );
}





