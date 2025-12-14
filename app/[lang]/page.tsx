import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SmoothScroll from '@/components/SmoothScroll';
import Hero from '@/components/sections/Hero';
import Logos from '@/components/sections/Logos';
import Philosophy from '@/components/sections/Philosophy';
import Services from '@/components/sections/Services';
import Portfolio from '@/components/sections/Portfolio';
import Contact from '@/components/sections/Contact';

export default function Home() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://uslab.ai';

  // Organization JSON-LD
  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'USLab.ai',
    url: baseUrl,
    logo: `${baseUrl}/img/logo.png`,
    description:
      'USLab.ai는 AI 기반 솔루션을 제공하는 전문 기업입니다. 블로그, 포트폴리오, 서비스 정보를 제공합니다.',
  };

  return (
    <main className="relative">
      {/* JSON-LD 구조화 데이터 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />

      {/* Background Grid Effect */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.07]" />
      </div>

      <SmoothScroll />
      <Navbar />
      <Hero />
      <Logos />
      <Philosophy />
      <Services />
      <Portfolio />
      <Contact />
      <Footer />
    </main>
  );
}




