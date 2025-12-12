'use client';

import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/hooks';

export default function Hero() {
  const { t } = useTranslation();

  return (
    <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-24 lg:pt-52 lg:pb-40 overflow-hidden">
      {/* Tech Decoration */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/10 rounded-full blur-[100px] -z-10 pointer-events-none" />

      {/* Background Grid Effect */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.07]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs font-mono mb-6 sm:mb-8">
          <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
          {t('hero.badge')}
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-6 sm:mb-8 leading-tight text-white px-2">
          {t('hero.title')}
          <br />
          <span className="text-gradient">{t('hero.titleHighlight')}</span>
          {t('hero.titleEnd')}
        </h1>

        <p className="mt-4 sm:mt-6 max-w-3xl mx-auto text-base sm:text-lg md:text-xl text-slate-400 font-light leading-relaxed px-4">
          {t('hero.subtitle')}
        </p>

        <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-4">
          <Link
            href="#contact"
            className="px-6 sm:px-8 py-3 sm:py-4 rounded bg-cyan-600 text-white font-bold text-base sm:text-lg hover:bg-cyan-500 transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)]"
          >
            {t('hero.ctaPrimary')}
          </Link>
          <Link
            href="#portfolio"
            className="px-6 sm:px-8 py-3 sm:py-4 rounded bg-slate-800 text-slate-300 font-medium text-base sm:text-lg hover:bg-slate-700 hover:text-white transition-all border border-slate-700"
          >
            {t('hero.ctaSecondary')}
          </Link>
        </div>

        {/* Stats or Tech Stack (Visual Element) */}
        <div className="mt-12 sm:mt-20 border-t border-slate-800 pt-6 sm:pt-10 flex flex-wrap justify-center gap-4 sm:gap-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
          <i className="fab fa-python text-2xl sm:text-3xl text-white" />
          <i className="fab fa-aws text-2xl sm:text-3xl text-white" />
          <i className="fab fa-google text-2xl sm:text-3xl text-white" />
          <i className="fas fa-microchip text-2xl sm:text-3xl text-white" />
          <i className="fas fa-database text-2xl sm:text-3xl text-white" />
        </div>
      </div>
    </section>
  );
}

