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
      className="py-12 sm:py-16 lg:py-24 dark:bg-slate-900 bg-white border-t dark:border-slate-800 border-slate-200/60"
    >
      <div className="w-full max-w-1160 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 sm:mb-16">
          <h2 className="text-[10px] font-mono text-blue-600 mb-1 uppercase tracking-wider">
            {t('services.badge')}
          </h2>
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold dark:text-white text-slate-900 leading-tight">
            {t('services.title')}
            <br className="md:hidden" />
            <span className="md:ml-2 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 bg-clip-text text-transparent">
              {t('services.titleHighlight')}
            </span>
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {services.map((service, index) => (
            <div
              key={index}
              className="group relative dark:bg-slate-950 bg-white rounded-2xl p-7 border dark:border-slate-800 border-slate-200/60 dark:hover:border-slate-600 hover:border-blue-300/50 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:-translate-y-1 hover:shadow-blue-glow h-full flex flex-col relative overflow-hidden"
            >
              <div className="relative z-10 flex flex-col items-start gap-4">
                <div
                  className={`flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 dark:bg-slate-900 bg-blue-50 rounded-lg flex items-center justify-center text-2xl sm:text-3xl transition-all group-hover:scale-105 text-blue-600`}
                >
                  <i className={service.icon} />
                </div>
                <div className="flex-grow min-w-0">
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {getArray(service.tagsKey).map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="px-1.5 py-0.5 text-[10px] font-mono dark:text-slate-300 text-slate-700 dark:bg-slate-800 bg-slate-100 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h4 className="text-lg sm:text-xl font-bold dark:text-white text-slate-900 mb-2 leading-tight line-clamp-1">
                    {t(service.titleKey)}
                  </h4>
                  <p className="text-sm sm:text-base dark:text-slate-400 text-slate-700 mb-3 sm:mb-4 leading-relaxed">{t(service.descriptionKey)}</p>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-0 translate-x-1/2 -translate-y-1/2" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}





