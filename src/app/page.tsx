import Image from 'next/image';
import AsciiArt from '@/components/AsciiArt';
import HeroSection from '@/components/HeroSection';
import ProjectsSection from '@/components/ProjectsSection';

export default function Home() {
  return (
    <>
      {/* Paper texture overlay */}
      <div className="pointer-events-none fixed inset-0 z-10 mix-blend-hard-light">
        <Image
          src="/paper-texture.png"
          alt=""
          fill
          className="object-cover opacity-15"
          priority
        />
      </div>

      {/* Hero */}
      <div className="relative flex min-h-screen items-center justify-center p-8">
        <div className="flex flex-col items-center gap-12 lg:flex-row lg:items-center lg:gap-24">
          <AsciiArt />
          <div className="w-full max-w-[280px] shrink-0">
            <HeroSection />
          </div>
        </div>
      </div>

      {/* Projects */}
      <ProjectsSection />
    </>
  );
}
