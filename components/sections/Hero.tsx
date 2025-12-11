import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative pt-32 pb-24 lg:pt-52 lg:pb-40 overflow-hidden">
      {/* Tech Decoration */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/10 rounded-full blur-[100px] -z-10 pointer-events-none" />

      {/* Background Grid Effect */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.07]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs font-mono mb-8">
          <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
          AI TRANSFORMATION PARTNER
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-8 leading-tight text-white">
          AI 대전환(AX),<br />
          <span className="text-gradient">모두의 기술</span>이 됩니다.
        </h1>

        <p className="mt-6 max-w-3xl mx-auto text-lg md:text-xl text-slate-400 font-light leading-relaxed">
          AI가 &apos;만드는 능력&apos;의 비용을 0으로 만든 지금,<br className="hidden md:block" />
          비즈니스의 성패는{' '}
          <strong className="text-slate-200">무엇을, 왜, 어떻게</strong> 할
          것인가를 결정하는 <strong className="text-slate-200">판단력</strong>에
          달려 있습니다.
        </p>

        <div className="mt-12 flex flex-col sm:flex-row justify-center gap-4">
          <Link
            href="#contact"
            className="px-8 py-4 rounded bg-cyan-600 text-white font-bold text-lg hover:bg-cyan-500 transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)]"
          >
            지금 시작하기
          </Link>
          <Link
            href="#portfolio"
            className="px-8 py-4 rounded bg-slate-800 text-slate-300 font-medium text-lg hover:bg-slate-700 hover:text-white transition-all border border-slate-700"
          >
            포트폴리오 보기
          </Link>
        </div>

        {/* Stats or Tech Stack (Visual Element) */}
        <div className="mt-20 border-t border-slate-800 pt-10 flex flex-wrap justify-center gap-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
          <i className="fab fa-python text-3xl text-white" />
          <i className="fab fa-aws text-3xl text-white" />
          <i className="fab fa-google text-3xl text-white" />
          <i className="fas fa-microchip text-3xl text-white" />
          <i className="fas fa-database text-3xl text-white" />
        </div>
      </div>
    </section>
  );
}

