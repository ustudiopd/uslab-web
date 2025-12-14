'use client';

import Image from 'next/image';
import { useTranslation } from '@/lib/i18n/hooks';
import { supabase } from '@/lib/supabase/client';

export default function Portfolio() {
  const { t } = useTranslation();

  // Supabase Storage에서 이미지 URL 생성
  const getImageUrl = (path: string) => {
    const { data } = supabase.storage
      .from('uslab-images')
      .getPublicUrl(path);
    return data.publicUrl;
  };

  const cases = [
    {
      image: getImageUrl('portfolio/lgcns-ax-platform.png'),
      caseKey: 'lgcns',
      color: 'cyan',
    },
    {
      image: getImageUrl('portfolio/microsoft-copilot.png'),
      caseKey: 'microsoft',
      color: 'indigo',
    },
    {
      image: getImageUrl('portfolio/hack-for-public.png'),
      caseKey: 'mss',
      color: 'emerald',
    },
  ];

  return (
    <section
      id="portfolio"
      className="py-12 sm:py-16 lg:py-24 bg-slate-950 border-t border-slate-900"
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 sm:mb-16">
          <h2 className="text-xs font-mono text-cyan-500 mb-2">
            {t('portfolio.badge')}
          </h2>
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight">
            {t('portfolio.title')}
            <br className="md:hidden" />
            <span className="md:ml-2 bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              {t('portfolio.titleHighlight')}
            </span>
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {cases.map((caseItem, index) => (
            <div
              key={index}
              className="group bg-slate-900 rounded border border-slate-800 overflow-hidden hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-900/10 transition-all"
            >
              <div className="h-40 sm:h-48 bg-slate-800 relative overflow-hidden">
                <div className="absolute inset-0 group-hover:scale-105 transition-transform duration-500">
                  <Image
                    src={caseItem.image}
                    alt={t(`portfolio.cases.${caseItem.caseKey}.title`)}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
                <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-cyan-400 border border-cyan-400 px-3 sm:px-4 py-1 text-xs sm:text-sm rounded hover:bg-cyan-400 hover:text-slate-950 transition-colors">
                    {t('portfolio.viewDetails')}
                  </span>
                </div>
              </div>
              <div className="p-4 sm:p-6">
                <div className="flex justify-between items-center mb-2 sm:mb-3">
                  <span
                    className={`text-${caseItem.color}-400 text-xs font-bold tracking-wider`}
                  >
                    {t(`portfolio.cases.${caseItem.caseKey}.client`)}
                  </span>
                  <span className="text-slate-600 text-xs font-mono">
                    {t(`portfolio.cases.${caseItem.caseKey}.category`)}
                  </span>
                </div>
                <h4
                  className={`text-base sm:text-lg font-bold text-white mb-2 group-hover:text-${caseItem.color}-400 transition-colors leading-tight`}
                >
                  {t(`portfolio.cases.${caseItem.caseKey}.title`)}
                </h4>
                <p className="text-xs sm:text-sm text-slate-400 line-clamp-2 leading-relaxed">
                  {t(`portfolio.cases.${caseItem.caseKey}.description`)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}





