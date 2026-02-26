const links = [
  { label: 'Email', href: 'mailto:' },
  { label: 'LinkedIn', href: '#' },
  { label: 'Resume', href: '#' },
]

export function HeroSection() {
  return (
    <section className="grid grid-cols-2 gap-16">
      {/* Left: Identity */}
      <div className="flex flex-col">
        <div className="flex-1">
          <h1 className="text-[17px] font-bold text-[#1a1a1a] leading-tight">
            Devin Hayden
          </h1>
          <p className="font-serif italic text-[13px] text-[#888] mt-0.5 mb-3">
            / product designer /
          </p>
          <p className="text-[13px] text-[#555] leading-relaxed">
            Building intelligence with an understanding of real human rhythms.
          </p>
        </div>
        <div className="mt-10">
          <hr className="border-t border-[#E5E5E5] mb-2" />
          <div className="flex justify-between items-center">
            <span className="font-mono text-[9px] tracking-widest text-[#C0C0C0] uppercase">
              About
            </span>
            <span className="font-mono text-[9px] tracking-widest text-[#C0C0C0]">
              [1]
            </span>
          </div>
        </div>
      </div>

      {/* Right: Links */}
      <div className="flex flex-col">
        <div className="flex-1">
          {links.map((link, i) => (
            <div key={link.label}>
              {i > 0 && <hr className="border-t border-[#E5E5E5]" />}
              <a
                href={link.href}
                className="flex items-center justify-between py-2.5 text-[13px] text-[#1a1a1a] hover:opacity-50 transition-opacity"
              >
                <span>{link.label}</span>
                <span className="text-[12px]">→</span>
              </a>
            </div>
          ))}
        </div>
        <div className="mt-10">
          <hr className="border-t border-[#E5E5E5] mb-2" />
          <div className="flex justify-between items-center">
            <span className="font-mono text-[9px] tracking-widest text-[#C0C0C0] uppercase">
              Contact
            </span>
            <span className="font-mono text-[9px] tracking-widest text-[#C0C0C0]">
              [2]
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
