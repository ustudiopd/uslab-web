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
      className="py-24 bg-slate-900 border-t border-slate-800"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <h2 className="text-xs font-mono text-cyan-500 mb-2">
              {t('services.badge')}
            </h2>
            <h3 className="text-3xl md:text-4xl font-bold text-white">
              {t('services.title')}
            </h3>
          </div>
          <p className="text-slate-400 max-w-md text-sm md:text-right">
            {t('services.description')}
          </p>
        </div>

        <div className="space-y-6">
          {services.map((service, index) => (
            <div
              key={index}
              className="group relative bg-slate-950 rounded-lg p-1 border border-slate-800 hover:border-slate-600 transition-all"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-r ${service.gradient} to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg`}
              />
              <div className="relative p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center gap-8">
                <div
                  className={`flex-shrink-0 w-16 h-16 bg-slate-900 rounded border border-slate-700 flex items-center justify-center text-3xl text-slate-300 group-hover:text-${service.hoverColor}-400 group-hover:border-${service.hoverColor}-500/50 transition-colors`}
                >
                  <i className={service.icon} />
                </div>
                <div className="flex-grow">
                  <h4 className="text-2xl font-bold text-white mb-2">
                    {t(service.titleKey)}
                  </h4>
                  <p className="text-slate-400 mb-4">{t(service.descriptionKey)}</p>
                  <div className="flex flex-wrap gap-2">
                    {getArray(service.tagsKey).map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="px-2 py-1 text-xs font-mono text-slate-300 bg-slate-800 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <i
                    className={`fas fa-arrow-right text-slate-600 group-hover:text-${service.hoverColor}-400 transform group-hover:translate-x-2 transition-all`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


