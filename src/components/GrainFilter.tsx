export default function GrainFilter() {
  return (
    <svg
      aria-hidden="true"
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
    >
      <defs>
        <filter id="grain" x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="linearRGB">
          {/* Fine anisotropic fiber grain — elongated x/y simulates paper machine direction */}
          <feTurbulence type="fractalNoise" baseFrequency="1.2 0.9" numOctaves="4" seed="2" stitchTiles="stitch" result="fineGrain" />
          <feColorMatrix in="fineGrain" type="saturate" values="0" result="fineGrainGray" />

          {/* Coarse pulp cloudiness — slow variation in paper density */}
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.12 0.10"
            numOctaves="3"
            seed="8"
            stitchTiles="stitch"
            result="coarseGrain"
          />
          <feColorMatrix in="coarseGrain" type="saturate" values="0" result="coarseGrainGray" />
          {/* Pull coarse layer back so it adds subtle depth without splotching */}
          <feComponentTransfer in="coarseGrainGray" result="coarseGrainDimmed">
            <feFuncA type="linear" slope="0.25" />
          </feComponentTransfer>

          <feBlend in="fineGrainGray" in2="coarseGrainDimmed" mode="screen" result="coarseBlended" />
          <feComponentTransfer in="coarseBlended" result="combined">
            <feFuncA type="linear" slope="1.35" />
          </feComponentTransfer>
    
        </filter>
      </defs>
    </svg>
  );
}
