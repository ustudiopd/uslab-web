'use client';

import { useTranslation } from '@/lib/i18n/hooks';

export default function Hero() {
  const { t } = useTranslation();

  return (
    <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-24 lg:pt-52 lg:pb-40 overflow-hidden bg-gradient-to-b from-cyan-50/40 via-blue-50/30 to-white">
      {/* Tech Decoration */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-700 dark:via-slate-700 via-slate-400 to-transparent" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-400/20 rounded-full blur-[100px] -z-10 pointer-events-none" />
      <div className="absolute top-0 right-0 w-[600px] h-[300px] bg-blue-400/15 rounded-full blur-[80px] -z-10 pointer-events-none" />

      {/* Background Grid Effect */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.07]" />
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs font-mono mb-6 sm:mb-8">
          <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
          {t('hero.badge')}
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-6 sm:mb-8 leading-tight dark:text-white text-slate-900 px-2">
          {t('hero.title')}
          <br />
          <span className="text-gradient">{t('hero.titleHighlight')}</span>
          {t('hero.titleEnd')}
        </h1>

        <p className="mt-4 sm:mt-6 max-w-3xl mx-auto text-base sm:text-lg md:text-xl dark:text-slate-400 text-slate-700 font-light leading-relaxed px-4">
          {t('hero.subtitle')}
        </p>
      </div>
    </section>
  );
}

