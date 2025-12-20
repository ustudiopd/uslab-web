'use client';

import { useTranslation } from '@/lib/i18n/hooks';

export default function Services() {
  const { t, getArray } = useTranslation();

  const services = [
    {
      icon: 'fas fa-lightbulb',
      titleKey: 'services.items.consulting.title',
      descriptionKey: 'services.items.consulting.description',
      tagsKey: 'services.items.consulting.tags',
      gradient: 'from-cyan-500/10',
      hoverColor: 'cyan',
    },
    {
      icon: 'fas fa-code',
      titleKey: 'services.items.development.title',
      descriptionKey: 'services.items.development.description',
      tagsKey: 'services.items.development.tags',
      gradient: 'from-indigo-500/10',
      hoverColor: 'indigo',
    },
    {
      icon: 'fas fa-graduation-cap',
      titleKey: 'services.items.education.title',
      descriptionKey: 'services.items.education.description',
      tagsKey: 'services.items.education.tags',
      gradient: 'from-emerald-500/10',
      hoverColor: 'emerald',
    },
  ];

  return (
    <section
      id="services"
      className="py-12 sm:py-16 lg:py-24 dark:bg-slate-900 bg-slate-50 border-t dark:border-slate-800 border-slate-300"
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 sm:mb-16">
          <h2 className="text-xs font-mono text-cyan-500 mb-2">
            {t('services.badge')}
          </h2>
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold dark:text-white text-slate-900 leading-tight">
            {t('services.title')}
            <br className="md:hidden" />
            <span className="md:ml-2 bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              {t('services.titleHighlight')}
            </span>
          </h3>
        </div>

        <div className="space-y-4 sm:space-y-6">
          {services.map((service, index) => (
            <div
              key={index}
              className="group relative dark:bg-slate-950 bg-white rounded-lg p-1 border dark:border-slate-800 border-slate-300 dark:hover:border-slate-600 hover:border-slate-500 transition-all shadow-sm hover:shadow-md"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-r ${service.gradient} to-transparent opacity-50 group-hover:opacity-75 transition-opacity rounded-lg`}
              />
              <div className="relative p-6 sm:p-8 md:p-10 flex flex-col md:flex-row items-start gap-4 sm:gap-6 md:gap-8">
                <div
                  className={`flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 dark:bg-slate-900 bg-slate-200 rounded border flex items-center justify-center text-2xl sm:text-3xl transition-all group-hover:scale-105 ${
                    service.hoverColor === 'cyan'
                      ? 'text-cyan-400 border-cyan-500/30 group-hover:border-cyan-500/60'
                      : service.hoverColor === 'indigo'
                      ? 'text-indigo-400 border-indigo-500/30 group-hover:border-indigo-500/60'
                      : 'text-emerald-400 border-emerald-500/30 group-hover:border-emerald-500/60'
                  }`}
                >
                  <i className={service.icon} />
                </div>
                <div className="flex-grow min-w-0">
                  <h4 className="text-xl sm:text-2xl font-bold dark:text-white text-slate-900 mb-2 leading-tight">
                    {t(service.titleKey)}
                  </h4>
                  <p className="text-sm sm:text-base dark:text-slate-400 text-slate-700 mb-3 sm:mb-4 leading-relaxed">{t(service.descriptionKey)}</p>
                  <div className="flex flex-wrap gap-2">
                    {getArray(service.tagsKey).map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="px-2 py-1 text-xs font-mono dark:text-slate-300 text-slate-800 dark:bg-slate-800 bg-slate-300 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}





