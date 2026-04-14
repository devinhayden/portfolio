import Image from 'next/image';
import AsciiArt from '@/components/AsciiArt';
import HeroSection from '@/components/HeroSection';
import FeaturedProjects from '@/components/FeaturedProjects';
import ArchiveSection from '@/components/ArchiveSection';
import PortfolioNav from '@/components/PortfolioNav';

export default function BonsaiPortfolio() {
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

      <PortfolioNav />

      <div className="relative mx-auto w-full max-w-[790px] px-6 pb-[250px] pt-[300px]">
        <div className="flex flex-col gap-[250px]">
          {/* Hero */}
          <div className="flex flex-col items-center gap-12 lg:flex-row lg:items-center lg:gap-[100px]">
            <AsciiArt />
            <div className="w-full shrink-0 lg:max-w-[303px]">
              <HeroSection />
            </div>
          </div>

          {/* Featured Projects — 200px wider than the column */}
          <div className="-mx-[100px]">
            <FeaturedProjects />
          </div>

          {/* Archive */}
          <ArchiveSection />
        </div>
      </div>
    </>
  );
}
