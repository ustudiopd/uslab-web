export default function Services() {
  const services = [
    {
      icon: 'fas fa-lightbulb',
      title: 'AI 컨설팅 (Consulting)',
      description:
        '현장 경험으로 무엇을, 왜, 어떻게 할지 명확히 제시합니다. 생성형 AI의 변화를 정확히 읽고, 가장 빠른 성공 로드맵을 설계합니다.',
      tags: ['AX Strategy', 'Biz Model'],
      gradient: 'from-cyan-500/10',
      hoverColor: 'cyan',
    },
    {
      icon: 'fas fa-code',
      title: 'AI 개발 (Development)',
      description:
        '전략을 실행 가능한 AI 솔루션으로 구현합니다. 현장의 요구를 빠르게 반영해 즉시 효과를 내는 성과 중심 개발을 제공합니다.',
      tags: ['RAG Chatbot', 'Automation'],
      gradient: 'from-indigo-500/10',
      hoverColor: 'indigo',
    },
    {
      icon: 'fas fa-graduation-cap',
      title: 'AI 적용 워크숍 (Education)',
      description:
        '조직이 스스로 AI를 활용하는 역량을 키우도록 돕습니다. 실전 워크숍을 통해 모든 구성원이 AI의 가능성과 판단력을 체득합니다.',
      tags: ['Hackathon', 'Workshops'],
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
              OUR SERVICES
            </h2>
            <h3 className="text-3xl md:text-4xl font-bold text-white">
              당신의 성공을 위한 3가지 솔루션
            </h3>
          </div>
          <p className="text-slate-400 max-w-md text-sm md:text-right">
            USlab.ai는 AI 대전환(AX) 여정의 모든 단계에서<br />
            필요한 솔루션을 원스톱으로 제공합니다.
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
                    {service.title}
                  </h4>
                  <p className="text-slate-400 mb-4">{service.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {service.tags.map((tag, tagIndex) => (
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

