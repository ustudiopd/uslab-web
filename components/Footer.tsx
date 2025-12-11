import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-900 py-12 text-sm text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-slate-800 rounded flex items-center justify-center text-white font-mono font-bold text-xs">
            US
          </div>
          <span className="font-bold text-slate-300">USlab.ai</span>
        </div>

        <div className="flex gap-6">
          <Link href="#" className="hover:text-cyan-400 transition-colors">
            개인정보처리방침
          </Link>
          <Link href="#" className="hover:text-cyan-400 transition-colors">
            이용약관
          </Link>
        </div>

        <div className="flex gap-4 text-lg">
          <a
            href="#"
            className="hover:text-white transition-colors"
            aria-label="GitHub"
          >
            <i className="fab fa-github" />
          </a>
          <a
            href="#"
            className="hover:text-white transition-colors"
            aria-label="LinkedIn"
          >
            <i className="fab fa-linkedin" />
          </a>
          <a
            href="#"
            className="hover:text-white transition-colors"
            aria-label="Email"
          >
            <i className="fas fa-envelope" />
          </a>
        </div>
      </div>
      <div className="text-center mt-8 text-xs font-mono text-slate-700">
        © 2025 USlab.ai. All rights reserved.
      </div>
    </footer>
  );
}

