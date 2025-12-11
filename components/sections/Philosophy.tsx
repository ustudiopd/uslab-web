export default function Philosophy() {
  const strategies = [
    {
      icon: 'fas fa-magnifying-glass-chart',
      title: '가치 발견',
      description:
        '모든 데이터에서 \'가치\'를 발견합니다. 잠들어 있던 데이터를 분석·정제해 AI가 즉시 활용할 자산으로 바꾸고, 새로운 기회를 발굴합니다.',
      color: 'cyan',
    },
    {
      icon: 'fas fa-network-wired',
      title: '판의 장악',
      description:
        '\'일의 판\'을 장악하도록 돕습니다. 단순한 자동화가 아닌, 일의 흐름 전체를 재설계하여 따라올 수 없는 경쟁 우위를 제공합니다.',
      color: 'indigo',
    },
    {
      icon: 'fas fa-bolt',
      title: '압도적 속도',
      description:
        '\'완벽\'이 아닌 \'속도\'로 시장을 선점합니다. \'바이브코딩\' 철학으로 빠르게 실행하고 개선하며, 속도 자체를 경쟁력으로 만듭니다.',
      color: 'emerald',
    },
    {
      icon: 'fas fa-shield-halved',
      title: '신뢰와 책임',
      description:
        '당신의 실력에 \'신뢰\'라는 도장을 찍습니다. 전문가의 판단으로 AI 결과를 검증하고 보증하며, 신뢰할 수 있는 결과를 완성합니다.',
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
            USLAB.AI PHILOSOPHY
          </h2>
          <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
            무엇이 USlab.ai를 특별하게 만드는가?
          </h3>
          <p className="text-slate-400 max-w-2xl">
            우리는 고객이 AI 시대에 필요한 &apos;판단력&apos;을 극대화하고
            흔들리지 않는 경쟁력을 갖출 수 있도록, 명확한 4가지 전략을
            제공합니다.
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
                {strategy.title}
              </h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                {strategy.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

