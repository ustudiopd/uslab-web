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
      className="py-12 sm:py-16 lg:py-24 dark:bg-slate-950 bg-white border-t dark:border-slate-900 border-slate-300"
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 sm:mb-16">
          <h2 className="text-xs font-mono text-cyan-500 mb-2">
            {t('portfolio.badge')}
          </h2>
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold dark:text-white text-slate-900 leading-tight">
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
              className="dark:bg-slate-900 bg-slate-50 rounded border dark:border-slate-800 border-slate-300 overflow-hidden dark:hover:border-slate-600 hover:border-slate-500 transition-all group cursor-pointer shadow-sm"
            >
              <div className="h-40 sm:h-48 dark:bg-slate-800 bg-slate-200 relative overflow-hidden">
                <Image
                  src={caseItem.image}
                  alt={t(`portfolio.cases.${caseItem.caseKey}.title`)}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>
              <div className="p-4 sm:p-6">
                <div className="flex justify-between items-center mb-2 sm:mb-3">
                  <span
                    className={`text-${caseItem.color}-400 text-xs font-bold tracking-wider`}
                  >
                    {t(`portfolio.cases.${caseItem.caseKey}.client`)}
                  </span>
                  <span className="dark:text-slate-600 text-slate-500 text-xs font-mono">
                    {t(`portfolio.cases.${caseItem.caseKey}.category`)}
                  </span>
                </div>
                <h4
                  className={`text-base sm:text-lg font-bold dark:text-white text-slate-900 mb-2 leading-tight group-hover:text-${caseItem.color}-400 transition-colors`}
                >
                  {t(`portfolio.cases.${caseItem.caseKey}.title`)}
                </h4>
                <p className="text-xs sm:text-sm dark:text-slate-400 text-slate-700 line-clamp-2 leading-relaxed">
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





