import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Wallet, TrendingDown, Target, Zap, ArrowRight } from "lucide-react";

const Hero = () => {
  const navigate = useNavigate();
  const { trackEvent } = useAnalytics();

  return (
    <>
      <SEOHead 
        title="Finityo - Debt Freedom Made Simple"
        description="Experience the power of strategic debt elimination with our interactive demo. See how snowball and avalanche methods can transform your financial future."
      />

      <div className="min-h-screen bg-gradient-to-br from-primary via-primary-dark to-secondary overflow-hidden">
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center px-4 py-20">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary-dark/90 to-secondary/90" />

          {/* Content */}
          <div className="relative z-10 max-w-6xl mx-auto text-center">
            {/* Logo */}
            <div className="mb-8 flex justify-center">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-white/10 backdrop-blur-md border border-white/30 flex items-center justify-center p-4">
                <Wallet className="w-16 h-16 md:w-20 md:h-20 text-white" />
              </div>
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
              Your Path to
              <br />
              <span className="bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
                Debt Freedom
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed drop-shadow-sm">
              Experience our powerful debt elimination engine. Choose your strategy, visualize your progress, and see your debt-free date.
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <div className="px-6 py-3 rounded-full bg-white/10 backdrop-blur-md border border-white/30 text-white flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                <span>Smart Strategies</span>
              </div>
              <div className="px-6 py-3 rounded-full bg-white/10 backdrop-blur-md border border-white/30 text-white flex items-center gap-2">
                <TrendingDown className="w-5 h-5" />
                <span>Real-Time Calculations</span>
              </div>
              <div className="px-6 py-3 rounded-full bg-white/10 backdrop-blur-md border border-white/30 text-white flex items-center gap-2">
                <Target className="w-5 h-5" />
                <span>Visual Progress</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-white/90 hover:shadow-2xl transition-all text-lg px-8 py-6 font-semibold group"
                onClick={() => {
                  trackEvent('demo_cta_click');
                  navigate('/demo/start');
                }}
              >
                <Zap className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                Try Interactive Demo
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 text-lg px-8 py-6 font-semibold"
                onClick={() => navigate('/auth?mode=signup')}
              >
                Create Free Account
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="mt-16 flex flex-col md:flex-row items-center justify-center gap-8 text-white/80">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-sm">No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-sm">Bank-level security</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-sm">Free forever</span>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Features Section */}
        <section className="relative py-20 px-4 bg-white/5 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center">
                  <Wallet className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Choose Your Strategy</h3>
                <p className="text-white/80">
                  Snowball for quick wins or Avalanche to save on interest. See both options side-by-side.
                </p>
              </div>

              <div className="text-center p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center">
                  <TrendingDown className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Track Your Progress</h3>
                <p className="text-white/80">
                  Watch your debt shrink with beautiful visualizations and detailed payoff timelines.
                </p>
              </div>

              <div className="text-center p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">See Your Freedom Date</h3>
                <p className="text-white/80">
                  Know exactly when you'll be debt-free and how much you'll save in interest.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Hero;
