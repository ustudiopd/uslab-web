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

  return (
    <nav
      className={`fixed w-full z-50 bg-slate-950/80 backdrop-blur-md border-b transition-all duration-300 ${
        isScrolled ? 'border-slate-800 bg-slate-950/90' : 'border-slate-800'
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
            <span className="text-xl font-bold tracking-tight text-white group-hover:text-cyan-400 transition-colors">
              USlab<span className="text-cyan-500">.ai</span>
            </span>
          </Link>

          {/* Desktop Menu - 오른쪽 정렬 */}
          <div className="hidden md:flex items-center space-x-10 ml-auto">
            <a
              href="#about"
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors uppercase tracking-wider"
            >
              {t('nav.about')}
            </a>
            <a
              href="#services"
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors uppercase tracking-wider"
            >
              {t('nav.services')}
            </a>
            <a
              href="#portfolio"
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors uppercase tracking-wider"
            >
              {t('nav.portfolio')}
            </a>
            <Link
              href={`/${locale}/blog`}
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors uppercase tracking-wider"
            >
              {t('nav.blog')}
            </Link>
            <a
              href="#contact"
              className="bg-white/5 border border-slate-700 text-white px-6 py-2 rounded font-medium hover:bg-cyan-500 hover:border-cyan-500 hover:text-white transition-all duration-300 text-sm"
            >
              {t('nav.contact')}
            </a>
            {/* Language Toggle */}
            <Link
              href={locale === 'ko' ? `/en${basePath}` : `/ko${basePath}`}
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors uppercase tracking-wider px-3 py-1 rounded border border-slate-700 hover:border-cyan-500"
              aria-label="Toggle language"
            >
              {locale === 'ko' ? 'ENG' : 'KOR'}
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-slate-300 hover:text-white focus:outline-none"
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
        className={`md:hidden bg-slate-900 border-b border-slate-800 absolute w-full transition-all ${
          isMobileMenuOpen ? 'block' : 'hidden'
        }`}
      >
        <div className="px-4 py-4 space-y-3">
          <a
            href="#about"
            onClick={handleLinkClick}
            className="block px-3 py-2 text-base font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded"
          >
            {t('nav.about')}
          </a>
          <a
            href="#services"
            onClick={handleLinkClick}
            className="block px-3 py-2 text-base font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded"
          >
            {t('nav.services')}
          </a>
          <a
            href="#portfolio"
            onClick={handleLinkClick}
            className="block px-3 py-2 text-base font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded"
          >
            {t('nav.portfolio')}
          </a>
          <Link
            href={`/${locale}/blog`}
            onClick={handleLinkClick}
            className="block px-3 py-2 text-base font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded"
          >
            {t('nav.blog')}
          </Link>
          <a
            href="#contact"
            onClick={handleLinkClick}
            className="block px-3 py-2 text-base font-medium text-cyan-400 hover:bg-slate-800 rounded"
          >
            {t('nav.contact')}
          </a>
          {/* Mobile Language Toggle */}
          <Link
            href={locale === 'ko' ? `/en${basePath}` : `/ko${basePath}`}
            onClick={handleLinkClick}
            className="block w-full text-left px-3 py-2 text-base font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded border-t border-slate-800 mt-2"
          >
            {locale === 'ko' ? 'English' : '한국어'}
          </Link>
        </div>
      </div>
    </nav>
  );
}


