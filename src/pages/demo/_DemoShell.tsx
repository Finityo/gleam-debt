import React from "react";
import GlassCard from "@/components/GlassCard";
import ProgressSteps from "@/components/ProgressSteps";
import FooterSitemap from "@/components/FooterSitemap";
import { PageFade, PopIn } from "@/components/Animate";

export default function DemoShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="min-h-screen flex flex-col justify-center bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/25 via-cyan-400/20 to-indigo-500/10 text-white">
      <PageFade>
        <div className="max-w-5xl w-full mx-auto px-4 py-10">
          <header className="mb-6 text-center">
            <h1 className="text-5xl font-bold tracking-tight drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]">
              Debt Simplified.
            </h1>
            {subtitle && <p className="text-white/80 mt-2 text-lg">{subtitle}</p>}
          </header>

          <ProgressSteps />

          <PopIn>
            <GlassCard className="p-6 md:p-10 bg-white/10">
              <h2 className="text-2xl font-semibold mb-6 text-center drop-shadow-sm">{title}</h2>
              {children}
            </GlassCard>
          </PopIn>

          <FooterSitemap />
        </div>
      </PageFade>
    </div>
  );
}
