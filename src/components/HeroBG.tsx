// =======================================================
// src/components/HeroBG.tsx  (soft gradients + vignette)
// =======================================================
export function HeroBG() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      {/* base gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_10%,rgba(110,72,255,.35)_0%,rgba(0,0,0,0)_55%),radial-gradient(70%_60%_at_70%_0%,rgba(0,210,220,.28)_0%,rgba(0,0,0,0)_60%)]" />
      {/* vignette */}
      <div className="absolute inset-0 bg-[rgba(0,0,0,.55)] mix-blend-multiply" />
      {/* subtle noise */}
      <div className="absolute inset-0 opacity-[0.08] [background-image:radial-gradient(rgba(255,255,255,.7)_1px,transparent_1px)] [background-size:3px_3px]" />
    </div>
  );
}
