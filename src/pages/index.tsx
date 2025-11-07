// =======================================================
// src/pages/index.tsx  (Mobile-first hero matching screenshot)
// =======================================================
import { Zap } from "lucide-react";

export default function Index() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#6e48ff] via-[#8b5cf6] to-[#a855f7] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Main card with rounded corners matching mobile design */}
        <div className="bg-[#5b3ba0]/60 backdrop-blur-lg rounded-[2.5rem] p-8 shadow-2xl border border-white/10">
          
          {/* App icon */}
          <div className="mx-auto mb-6 h-20 w-20 rounded-2xl bg-gradient-to-br from-[#ff006b] via-[#7f5af0] to-[#00d4ff] shadow-lg grid place-items-center border border-white/20">
            <img
              src="/finityo-icon-final.png"
              alt="Finityo"
              className="h-12 w-12 rounded-xl"
            />
          </div>

          {/* Badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-medium">
              <Zap className="w-4 h-4" />
              Accelerate Your Debt Freedom
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-3xl md:text-4xl font-bold text-white text-center mb-4 leading-tight">
            Build your debt payoff plan in minutes
          </h1>

          {/* Description */}
          <p className="text-white/90 text-center mb-8 leading-relaxed">
            Connect accounts with Plaid, choose Snowball or Avalanche, and see your debt-free date
          </p>

          {/* CTAs */}
          <div className="space-y-3 mb-6">
            <a 
              href="/auth" 
              className="block w-full bg-[#2d1f4a] hover:bg-[#3d2f5a] text-white font-semibold py-4 px-6 rounded-2xl text-center transition-all shadow-lg border border-white/10"
            >
              Create your free plan
            </a>
            
            <a 
              href="/demo/start" 
              className="block w-full bg-[#1a1126] hover:bg-[#2a2136] text-white font-semibold py-4 px-6 rounded-2xl text-center transition-all shadow-lg border border-white/10"
            >
              🔑 Try Demo
            </a>
          </div>

          {/* View Pricing link */}
          <div className="text-center">
            <a href="/pricing" className="text-white/80 hover:text-white text-sm underline">
              View Pricing
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
