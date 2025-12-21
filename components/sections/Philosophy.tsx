'use client';

import { useTranslation } from '@/lib/i18n/hooks';

export default function Philosophy() {
  const { t } = useTranslation();

  const strategies = [
    {
      icon: 'fas fa-magnifying-glass-chart',
      titleKey: 'philosophy.strategies.value.title',
      descriptionKey: 'philosophy.strategies.value.description',
      color: 'cyan',
    },
    {
      icon: 'fas fa-network-wired',
      titleKey: 'philosophy.strategies.control.title',
      descriptionKey: 'philosophy.strategies.control.description',
      color: 'indigo',
    },
    {
      icon: 'fas fa-bolt',
      titleKey: 'philosophy.strategies.speed.title',
      descriptionKey: 'philosophy.strategies.speed.description',
      color: 'emerald',
    },
    {
      icon: 'fas fa-shield-halved',
      titleKey: 'philosophy.strategies.trust.title',
      descriptionKey: 'philosophy.strategies.trust.description',
      color: 'rose',
    },
  ];

  return (
    <section
      id="about"
      className="pt-4 sm:pt-6 lg:pt-8 pb-12 sm:pb-16 lg:pb-24 dark:bg-slate-950 bg-white relative border-t dark:border-slate-900 border-slate-200/60"
    >
      <div className="w-full max-w-1160 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 sm:mb-16 lg:mb-20">
          <h2 className="text-xs font-mono text-blue-600 mb-2">
            {t('philosophy.badge')}
          </h2>
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold dark:text-white text-slate-900 mb-4 sm:mb-6 leading-tight">
            {t('philosophy.title')}
            <br className="md:hidden" />
            <span className="md:ml-2 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 bg-clip-text text-transparent">
              {t('philosophy.titleHighlight')}
            </span>
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {strategies.map((strategy, index) => (
            <div
              key={index}
              className="p-6 sm:p-8 rounded-2xl dark:bg-slate-900/50 bg-white border dark:border-slate-800 border-slate-200/60 dark:hover:border-blue-500/50 hover:border-blue-300/50 transition-all group shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:-translate-y-1 hover:shadow-blue-glow"
            >
              <div
                className={`w-10 h-10 sm:w-12 sm:h-12 dark:bg-slate-800 bg-blue-50 rounded-lg flex items-center justify-center mb-4 sm:mb-6 text-blue-600 text-lg sm:text-xl group-hover:bg-blue-100 transition-colors`}
              >
                <i className={strategy.icon} />
              </div>
              <h4 className="text-base sm:text-lg font-bold dark:text-white text-slate-900 mb-2 sm:mb-3 leading-tight">
                {t(strategy.titleKey)}
              </h4>
              <p className="text-xs sm:text-sm dark:text-slate-400 text-slate-600 leading-relaxed">
                {t(strategy.descriptionKey)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}





