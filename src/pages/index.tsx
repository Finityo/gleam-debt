// =======================================================
// src/pages/index.tsx  (Full landing page matching screenshot)
// =======================================================
import { Zap, Star, Check, TrendingDown, Target, Shield } from "lucide-react";

export default function Index() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#6e48ff] via-[#8b5cf6] to-[#a855f7]">
      <div className="max-w-md mx-auto px-4 py-8">
        
        {/* Hero Section */}
        <div className="mb-8">
          <div className="bg-[#5b3ba0]/60 backdrop-blur-lg rounded-[2.5rem] p-8 shadow-2xl border border-white/10">
            <div className="mx-auto mb-6 h-20 w-20 rounded-2xl bg-gradient-to-br from-[#ff006b] via-[#7f5af0] to-[#00d4ff] shadow-lg grid place-items-center border border-white/20">
              <img src="/finityo-icon-final.png" alt="Finityo" className="h-12 w-12 rounded-xl" />
            </div>

            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-medium">
                <Zap className="w-4 h-4" />
                Accelerate Your Debt Freedom
              </div>
            </div>

            <h1 className="text-3xl font-bold text-white text-center mb-4 leading-tight">
              Zero to debt-free payoff plan in minutes
            </h1>

            <p className="text-white/90 text-center mb-8 text-sm leading-relaxed">
              Choose Snowball or Avalanche, sync your accounts with Plaid, and see when you'll be debt free
            </p>

            <div className="space-y-3 mb-6">
              <a href="/auth" className="block w-full bg-[#2d1f4a] hover:bg-[#3d2f5a] text-white font-semibold py-4 px-6 rounded-2xl text-center transition-all shadow-lg border border-white/10">
                Start Free
              </a>
              <a href="/setup/start" className="block w-full bg-[#1a1126] hover:bg-[#2a2136] text-white font-semibold py-4 px-6 rounded-2xl text-center transition-all shadow-lg border border-white/10">
                🔑 Try Setup
              </a>
            </div>

            <div className="text-center text-white/80 text-xs">
              <div className="mb-2">$2.99/mo Essential · $4.99/mo Ultimate</div>
              <a href="/pricing" className="underline hover:text-white">View Pricing</a>
            </div>
          </div>
        </div>

        {/* What People Are Saying */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white text-center mb-6">WHAT people are saying</h2>
          
          <div className="space-y-4">
            <TestimonialCard
              stars={5}
              text="This app is incredible! Finally a debt payoff tool that actually works and makes sense."
              author="Sarah M."
            />
            <TestimonialCard
              stars={5}
              text="Love the visual timeline. Seeing my debt-free date motivates me every day!"
              author="James K."
            />
            <TestimonialCard
              stars={5}
              text="Best $2.99 I've ever spent. The Plaid sync saves me so much time."
              author="Maria R."
            />
          </div>
        </div>

        {/* Secret Playbook */}
        <div className="mb-8">
          <div className="bg-[#2d1f4a]/80 backdrop-blur-lg rounded-3xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white text-center mb-4">
              Secret Playbook for Faster Payoff
            </h2>
            <p className="text-white/80 text-sm text-center mb-6 leading-relaxed">
              Discover the proven strategies that thousands have used to become debt-free faster than they thought possible.
            </p>
            <div className="space-y-3">
              <FeatureItem icon={<Check />} text="Snowball Method: Quick wins to build momentum" />
              <FeatureItem icon={<Check />} text="Avalanche Method: Save the most on interest" />
              <FeatureItem icon={<Check />} text="Custom strategies tailored to your situation" />
            </div>
          </div>
        </div>

        {/* Why Join */}
        <div className="mb-8 space-y-4">
          <InfoCard
            icon={<TrendingDown className="w-8 h-8" />}
            title="Better than spreadsheets"
            description="Automatic calculations, beautiful charts, and real-time updates. No more manual tracking."
          />
          <InfoCard
            icon={<Target className="w-8 h-8" />}
            title="No gimmicks"
            description="Honest math, transparent pricing. We don't sell your data or push you into debt consolidation."
          />
          <InfoCard
            icon={<Shield className="w-8 h-8" />}
            title="Build a strategy that works"
            description="Compare plans side-by-side. See exactly when you'll be debt-free and how much you'll save."
          />
        </div>

        {/* Social Proof */}
        <div className="mb-8">
          <div className="bg-[#2d1f4a]/80 backdrop-blur-lg rounded-3xl p-6 border border-white/10 text-center">
            <div className="flex justify-center mb-3">
              {[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />)}
            </div>
            <p className="text-white font-semibold mb-2">Real People, Real Results</p>
            <p className="text-white/80 text-sm">Join 10,000+ users on their journey to financial freedom</p>
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white text-center mb-6">Faster Payoff Works</h2>
          <div className="bg-[#2d1f4a]/80 backdrop-blur-lg rounded-3xl p-8 border border-white/10 space-y-6">
            <Step number={1} title="Add Your Debts" description="Import from your bank with Plaid or enter manually" />
            <Step number={2} title="Choose Your Strategy" description="Snowball, Avalanche, or custom approach" />
            <Step number={3} title="Track Progress" description="See your payoff calendar and debt-free date" />
            <Step number={4} title="Stay Motivated" description="Earn badges, get coach tips, and celebrate wins" />
          </div>
        </div>

        {/* Psychology */}
        <div className="mb-8">
          <div className="bg-[#2d1f4a]/80 backdrop-blur-lg rounded-3xl p-8 border border-white/10">
            <h3 className="text-xl font-bold text-white mb-4 text-center">Better Psychology</h3>
            <p className="text-white/80 text-sm leading-relaxed text-center mb-4">
              Debt payoff isn't just math—it's mindset. Finityo helps you build momentum with quick wins while showing long-term savings.
            </p>
            <div className="bg-white/10 rounded-2xl p-4">
              <p className="text-white text-xs italic">"I paid off $15K in 10 months using the snowball method. Those early wins kept me going!" - Alex T.</p>
            </div>
          </div>
        </div>

        {/* Email Capture */}
        <div className="mb-8">
          <div className="bg-[#0f766e] backdrop-blur-lg rounded-3xl p-8 border border-white/10">
            <h3 className="text-xl font-bold text-white mb-4 text-center">Avoid Junk!</h3>
            <p className="text-white/90 text-sm text-center mb-6">
              Get debt-free tips, not spam. Unsubscribe anytime.
            </p>
            <div className="space-y-3">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="w-full px-4 py-3 rounded-xl bg-white/90 text-gray-900 placeholder-gray-500 border-0 focus:ring-2 focus:ring-white"
              />
              <button className="w-full bg-white hover:bg-gray-100 text-[#0f766e] font-semibold py-3 px-6 rounded-xl transition-all">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="mb-8">
          <div className="bg-gradient-to-br from-[#ff006b] to-[#7f5af0] rounded-3xl p-8 border border-white/20 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Ready to Become Debt-Free?</h2>
            <p className="text-white/90 text-sm mb-6">Start your journey today. No credit card required.</p>
            <a href="/auth" className="inline-block bg-white hover:bg-gray-100 text-[#7f5af0] font-bold py-4 px-8 rounded-2xl transition-all shadow-lg">
              Start Free Now
            </a>
          </div>
        </div>

        {/* Footer Links */}
        <div className="text-center space-y-2 pb-8">
          <div className="flex justify-center gap-6 text-white/60 text-xs">
            <a href="/privacy" className="hover:text-white">Privacy</a>
            <a href="/terms" className="hover:text-white">Terms</a>
            <a href="/pricing" className="hover:text-white">Pricing</a>
            <a href="/blog" className="hover:text-white">Blog</a>
          </div>
          <p className="text-white/40 text-xs">© 2024 Finityo · Debt Simplified</p>
        </div>
      </div>
    </div>
  );
}

function TestimonialCard({ stars, text, author }: { stars: number; text: string; author: string }) {
  return (
    <div className="bg-[#2d1f4a]/80 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
      <div className="flex gap-1 mb-3">
        {Array.from({ length: stars }).map((_, i) => (
          <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
        ))}
      </div>
      <p className="text-white text-sm mb-3 leading-relaxed">{text}</p>
      <p className="text-white/60 text-xs">— {author}</p>
    </div>
  );
}

function FeatureItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-green-400 flex-shrink-0 mt-0.5">{icon}</div>
      <p className="text-white/90 text-sm">{text}</p>
    </div>
  );
}

function InfoCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-[#2d1f4a]/80 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
      <div className="text-white mb-3">{icon}</div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-white/80 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function Step({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
        {number}
      </div>
      <div>
        <h4 className="text-white font-semibold mb-1">{title}</h4>
        <p className="text-white/70 text-sm">{description}</p>
      </div>
    </div>
  );
}
