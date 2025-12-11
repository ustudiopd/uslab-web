'use client';

import { useTranslation } from '@/lib/i18n/hooks';

export default function Portfolio() {
  const { t } = useTranslation();

  const cases = [
    {
      icon: 'fas fa-server',
      caseKey: 'lgcns',
      color: 'cyan',
    },
    {
      icon: 'fab fa-microsoft',
      caseKey: 'microsoft',
      color: 'indigo',
    },
    {
      icon: 'fas fa-building-columns',
      caseKey: 'mss',
      color: 'emerald',
    },
  ];

  return (
    <section
      id="portfolio"
      className="py-24 bg-slate-950 border-t border-slate-900"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16">
          <h2 className="text-xs font-mono text-cyan-500 mb-2">
            {t('portfolio.badge')}
          </h2>
          <h3 className="text-3xl md:text-4xl font-bold text-white">
            {t('portfolio.title')}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cases.map((caseItem, index) => (
            <div
              key={index}
              className="group bg-slate-900 rounded border border-slate-800 overflow-hidden hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-900/10 transition-all"
            >
              <div className="h-48 bg-slate-800 relative overflow-hidden">
                <div className="absolute inset-0 bg-slate-800 group-hover:scale-105 transition-transform duration-500 flex items-center justify-center">
                  <i className={`${caseItem.icon} text-4xl text-slate-700`} />
                </div>
                <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-cyan-400 border border-cyan-400 px-4 py-1 text-sm rounded hover:bg-cyan-400 hover:text-slate-950 transition-colors">
                    {t('portfolio.viewDetails')}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-center mb-3">
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
                  className={`text-lg font-bold text-white mb-2 group-hover:text-${caseItem.color}-400 transition-colors`}
                >
                  {t(`portfolio.cases.${caseItem.caseKey}.title`)}
                </h4>
                <p className="text-slate-400 text-sm line-clamp-2">
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


