'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>(
    'idle'
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const { error } = await supabase.from('uslab_inquiries').insert({
        name: formData.name,
        email: formData.email,
        message: formData.message,
        status: 'pending',
      });

      if (error) throw error;

      setSubmitStatus('success');
      setFormData({ name: '', email: '', message: '' });
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <section
      id="contact"
      className="py-24 bg-gradient-to-b from-slate-900 to-slate-950 border-t border-slate-800 relative overflow-hidden"
    >
      {/* Background Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-cyan-900/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
            지금 바로 USlab.ai와 함께<br />
            AI 대전환을 시작하십시오.
          </h2>
          <p className="text-slate-400 text-lg">
            AI라는 도구는 이제 모두에게 주어진 상수입니다.<br />
            진짜 승부는 이 도구를 활용해 자신만의 업무 방식을 녹여낸
            &apos;나만의 시스템&apos;을 구축하는 사람에게서 갈릴 것입니다.
          </p>
        </div>

        <div className="bg-slate-900/80 backdrop-blur border border-slate-700 rounded-lg p-8 md:p-12 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  이름 / 소속
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder-slate-600"
                  placeholder="홍길동 / OO기업"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  이메일 주소
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder-slate-600"
                  placeholder="email@company.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                문의 내용
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={4}
                className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder-slate-600"
                placeholder="프로젝트 의뢰 및 AI 컨설팅 문의 등"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-4 rounded transition-all shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '전송 중...' : '문의 보내기'}
            </button>
            {submitStatus === 'success' && (
              <div className="text-center text-green-400 text-sm">
                문의가 성공적으로 전송되었습니다.
              </div>
            )}
            {submitStatus === 'error' && (
              <div className="text-center text-red-400 text-sm">
                전송 중 오류가 발생했습니다. 다시 시도해주세요.
              </div>
            )}
            <div className="text-center">
              <p className="text-xs text-slate-500 mt-4 font-mono">
                <i className="fas fa-lock mr-1" /> 데이터는 Supabase를 통해
                안전하게 처리됩니다.
              </p>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

