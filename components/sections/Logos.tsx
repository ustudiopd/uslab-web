'use client';

import Image from 'next/image';

export default function Logos() {
  return (
    <section className="py-[100px] bg-slate-950 border-t border-slate-800">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center items-center">
        <div className="opacity-60 grayscale hover:grayscale-0 transition-all duration-500 flex items-center justify-center">
          <Image
            src="/img/logo6.png"
            alt="Technology Stack"
            width={1200}
            height={200}
            className="w-auto h-auto"
            unoptimized
            priority
          />
        </div>
      </div>
    </section>
  );
}
