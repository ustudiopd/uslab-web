'use client';

import { useTranslation } from '@/lib/i18n/hooks';

export default function Hero() {
  const { t } = useTranslation();

  return (
    <section className="relative py-24 lg:py-32 overflow-hidden bg-slate-50">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[10%] w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[100px] mix-blend-multiply" />
        <div className="absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] bg-indigo-100/30 rounded-full blur-[120px] mix-blend-multiply" />
      </div>

      <div className="max-w-1160 mx-auto px-4 text-center relative z-10">
        <span className="inline-flex items-center py-1 px-3 rounded-full bg-blue-50/80 text-blue-700 text-sm font-bold mb-8 border border-blue-100/50 backdrop-blur-sm">
          <span className="flex w-2 h-2 rounded-full bg-blue-600 mr-2 animate-pulse" />
          {t('hero.badge')}
        </span>
        <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 mb-8 leading-tight tracking-tight">
          {t('hero.title')}
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700">
            {t('hero.titleHighlight')}
          </span>
          {t('hero.titleEnd')}
        </h1>
        <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
          {t('hero.subtitle')}
        </p>
      </div>
    </section>
  );
}

