import { HeroSection } from '@/components/HeroSection'
import { Feed } from '@/components/Feed'

export default function Home() {
  return (
    <main className="min-h-screen">
      <div className="max-w-[700px] mx-auto px-6 pt-28 pb-24">
        <HeroSection />
        <Feed />
      </div>
    </main>
  )
}
