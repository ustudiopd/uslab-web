'use client';

import { useTranslation } from '@/lib/i18n/hooks';

export default function Contact() {
  const { t } = useTranslation();

  const handleContactClick = () => {
    // 메일 앱 열기
    const subject = encodeURIComponent('USLab AI 문의');
    const body = encodeURIComponent('안녕하세요,\n\nUSLab AI에 대한 문의사항이 있어 연락드립니다.\n\n');
    window.location.href = `mailto:contact@uslab.ai?subject=${subject}&body=${body}`;
  };

  return (
    <section
      id="contact"
      className="py-12 sm:py-16 lg:py-24 dark:bg-slate-900 bg-slate-900 relative overflow-hidden"
    >
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/20 rounded-full blur-[150px] pointer-events-none" />

      <div className="w-full max-w-1160 mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6 leading-tight">
            {t('contact.title')}
            <br />
            <span className="text-blue-400">{t('contact.titleHighlight')}</span>
          </h2>
          <p className="text-slate-300 text-lg mb-10 max-w-2xl mx-auto">
            {t('contact.description')}
            <br />
            {t('contact.descriptionHighlight')}
            <br />
            {t('contact.descriptionHighlightEnd')}
          </p>
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleContactClick}
            className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
          >
            {t('contact.form.submit')}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}

