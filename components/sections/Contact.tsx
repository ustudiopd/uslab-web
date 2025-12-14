'use client';

import { useTranslation } from '@/lib/i18n/hooks';

export default function Contact() {
  const { t } = useTranslation();

  const handleContactClick = () => {
    // 메일 앱 열기
    const subject = encodeURIComponent('USlab.ai 문의');
    const body = encodeURIComponent('안녕하세요,\n\nUSlab.ai에 대한 문의사항이 있어 연락드립니다.\n\n');
    window.location.href = `mailto:contact@uslab.ai?subject=${subject}&body=${body}`;
  };

  return (
    <section
      id="contact"
      className="py-12 sm:py-16 lg:py-24 bg-gradient-to-b from-slate-900 to-slate-950 border-t border-slate-800 relative overflow-hidden"
    >
      {/* Background Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-cyan-900/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white mb-4 sm:mb-6 leading-tight px-2">
            {t('contact.title')}
            <br />
            {t('contact.titleHighlight')}
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-slate-400 leading-relaxed px-2 korean-text max-w-2xl mx-auto">
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
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-4 sm:py-5 px-8 sm:px-12 rounded-lg text-base sm:text-lg transition-all shadow-lg transform hover:-translate-y-0.5 hover:shadow-xl"
          >
            {t('contact.form.submit')}
          </button>
        </div>
      </div>
    </section>
  );
}

