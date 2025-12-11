export default function Portfolio() {
  const cases = [
    {
      icon: 'fas fa-server',
      client: 'LG CNS',
      category: 'Architecture',
      title: 'AX 플랫폼 아키텍처 시각화',
      description:
        '복잡한 AX 플랫폼 개념을 고객들에게 쉽게 전달하기 위해, Google Imagen4 API로 12,000장의 이미지를 제작했습니다.',
      color: 'cyan',
    },
    {
      icon: 'fab fa-microsoft',
      client: 'Microsoft',
      category: 'Marketing',
      title: 'AI Copilot 인지도 확산',
      description:
        'Microsoft와 협력해 유튜버 미미미누의 Copilot 영상(200만 뷰)과 인사혁신처 인재개발 플랫폼 콘텐츠를 기획·제작했습니다.',
      color: 'indigo',
    },
    {
      icon: 'fas fa-building-columns',
      client: '행정안전부',
      category: 'Hackathon',
      title: '공공혁신 해커톤 \'Hack for Public\'',
      description:
        '행정안전부, KDI국제정책대학원, Microsoft와 함께 공공 혁신 해커톤을 기획·운영하여 정책 혁신 기반을 강화했습니다.',
      color: 'emerald',
    },
  ];

  return (
    <section
      id="portfolio"
      className="py-24 bg-slate-950 border-t border-slate-900"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16">
          <h2 className="text-xs font-mono text-cyan-500 mb-2">
            SUCCESS STORIES
          </h2>
          <h3 className="text-3xl md:text-4xl font-bold text-white">
            결과로 증명하는 USlab.ai의 전문성
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cases.map((caseItem, index) => (
            <div
              key={index}
              className="group bg-slate-900 rounded border border-slate-800 overflow-hidden hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-900/10 transition-all"
            >
              <div className="h-48 bg-slate-800 relative overflow-hidden">
                <div className="absolute inset-0 bg-slate-800 group-hover:scale-105 transition-transform duration-500 flex items-center justify-center">
                  <i className={`${caseItem.icon} text-4xl text-slate-700`} />
                </div>
                <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-cyan-400 border border-cyan-400 px-4 py-1 text-sm rounded hover:bg-cyan-400 hover:text-slate-950 transition-colors">
                    자세히 보기
                  </span>
                </div>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-center mb-3">
                  <span
                    className={`text-${caseItem.color}-400 text-xs font-bold tracking-wider`}
                  >
                    {caseItem.client}
                  </span>
                  <span className="text-slate-600 text-xs font-mono">
                    {caseItem.category}
                  </span>
                </div>
                <h4
                  className={`text-lg font-bold text-white mb-2 group-hover:text-${caseItem.color}-400 transition-colors`}
                >
                  {caseItem.title}
                </h4>
                <p className="text-slate-400 text-sm line-clamp-2">
                  {caseItem.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

