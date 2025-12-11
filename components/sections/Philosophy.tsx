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
      className="py-24 bg-slate-950 relative border-t border-slate-900"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-20">
          <h2 className="text-xs font-mono text-cyan-500 mb-2">
            {t('philosophy.badge')}
          </h2>
          <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
            {t('philosophy.title')}
          </h3>
          <p className="text-slate-400 max-w-2xl">
            {t('philosophy.description')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {strategies.map((strategy, index) => (
            <div
              key={index}
              className="p-8 rounded-lg bg-slate-900/50 border border-slate-800 hover:border-cyan-500/50 transition-all group"
            >
              <div
                className={`w-12 h-12 bg-slate-800 rounded flex items-center justify-center mb-6 text-${strategy.color}-400 text-xl group-hover:bg-${strategy.color}-500/20 group-hover:text-${strategy.color}-300 transition-colors`}
              >
                <i className={strategy.icon} />
              </div>
              <h4 className="text-lg font-bold text-white mb-3">
                {t(strategy.titleKey)}
              </h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                {t(strategy.descriptionKey)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


