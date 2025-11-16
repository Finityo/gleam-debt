import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Check, Shield, Sparkles, TrendingDown, Calendar, Trophy, BarChart3 } from "lucide-react";
import { useEffect } from "react";
import { PageShell } from "@/components/PageShell";

const Hero = () => {
  const navigate = useNavigate();
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    const trackVisit = async () => {
      try {
        const response = await fetch('/api/track-visit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            page_path: window.location.pathname,
            referrer: document.referrer,
          }),
        });
      } catch (error) {
        console.error('Failed to track visit:', error);
      }
    };
    trackVisit();
  }, []);

  return (
    <PageShell>
      <SEOHead 
        title="Finityo - Take Control of Your Debt. Finally."
        description="AI-powered payoff plans that adapt as your life changes. Bank-grade security, Plaid integration, no credit impact."
      />

      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 overflow-hidden relative">
        {/* Vignette overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/30 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-background/20 pointer-events-none" />

        {/* Liquid glass orbs */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/20 rounded-full blur-[120px] animate-float" style={{ animationDuration: '8s' }} />
        <div className="absolute top-40 right-20 w-96 h-96 bg-accent/15 rounded-full blur-[140px] animate-float" style={{ animationDuration: '10s', animationDelay: '2s' }} />
        <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-primary-glow/10 rounded-full blur-[100px] animate-float" style={{ animationDuration: '12s', animationDelay: '4s' }} />

        {/* Animated gradient beams */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-primary/0 via-primary/50 to-primary/0 animate-pulse" />
          <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-accent/0 via-accent/40 to-accent/0 animate-pulse" style={{ animationDelay: '700ms' }} />
        </div>

        {/* Particle shimmer effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-primary/20 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${8 + Math.random() * 4}s`,
              }}
            />
          ))}
        </div>

        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center px-4 py-20">
          <div className="relative z-10 max-w-5xl mx-auto text-center">
            
            {/* iPhone Mockup Centerpiece */}
            <div className="relative mb-12 flex justify-center">
              <div className="relative group">
                {/* Liquid glass plate behind device */}
                <div className="absolute inset-0 transform scale-110 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-[3rem] border border-white/20 shadow-liquid" />
                
                {/* Glow bloom behind */}
                <div className="absolute inset-0 -z-10">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-accent/30 rounded-full blur-[100px]" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-primary/20 rounded-full blur-[80px]" />
                </div>

                {/* Ambient under-glow */}
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-64 h-8 bg-primary/20 rounded-full blur-xl" />

                {/* iPhone Frame (placeholder until real image) */}
                <div className="relative w-[280px] h-[560px] bg-gradient-to-br from-slate-900 to-slate-800 rounded-[3rem] border-8 border-slate-900 shadow-2xl transform group-hover:rotate-y-6 group-hover:scale-105 transition-transform duration-500 overflow-hidden">
                  {/* Screen */}
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 via-background to-accent/20 rounded-[2rem] flex items-center justify-center p-6">
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center">
                        <TrendingDown className="w-8 h-8 text-white" />
                      </div>
                      <div className="text-xl font-bold text-foreground">Your Debt Plan</div>
                      <div className="text-sm text-muted-foreground">Visualized. Optimized. Done.</div>
                    </div>
                  </div>
                  
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-slate-900 rounded-b-3xl" />
                </div>
              </div>
            </div>

            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">AI-Powered Debt Freedom</span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
              Take control of your debt.{" "}
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Finally.
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed mb-10 max-w-3xl mx-auto">
              AI-powered payoff plans that adapt as your life changes.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-primary/50 transition-all text-lg px-8 py-6 font-semibold"
                onClick={() => {
                  trackEvent('hero_cta_click');
                  navigate('/setup/start');
                }}
              >
                Get Started
                <Sparkles className="ml-2 w-5 h-5" />
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                className="border-2 text-lg px-8 py-6 font-semibold backdrop-blur-sm"
                onClick={() => navigate('/demo/start')}
              >
                See How It Works
              </Button>
            </div>

            {/* Trust Bar */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                <span>Bank-grade security</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-accent" />
                <span>Plaid integration</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-success" />
                <span>No credit impact</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>Built for real people</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="relative py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              
              {/* Snowball Strategy */}
              <div className="text-center space-y-4 p-6 rounded-2xl backdrop-blur-sm bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center">
                  <TrendingDown className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">Snowball Power</h3>
                <p className="text-sm text-muted-foreground">Pay smallest debts first. Build momentum. Stay motivated.</p>
              </div>

              {/* Avalanche Strategy */}
              <div className="text-center space-y-4 p-6 rounded-2xl backdrop-blur-sm bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-accent/20 to-accent/10 rounded-2xl flex items-center justify-center">
                  <BarChart3 className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">Avalanche Savings</h3>
                <p className="text-sm text-muted-foreground">Target high-interest debts. Save thousands in interest.</p>
              </div>

              {/* Calendar View */}
              <div className="text-center space-y-4 p-6 rounded-2xl backdrop-blur-sm bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-success/20 to-success/10 rounded-2xl flex items-center justify-center">
                  <Calendar className="w-8 h-8 text-success" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">Visual Timeline</h3>
                <p className="text-sm text-muted-foreground">See every payment. Track your progress. Know your freedom date.</p>
              </div>

              {/* Celebration */}
              <div className="text-center space-y-4 p-6 rounded-2xl backdrop-blur-sm bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-warning/20 to-warning/10 rounded-2xl flex items-center justify-center">
                  <Trophy className="w-8 h-8 text-warning" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">Debt-Free Victory</h3>
                <p className="text-sm text-muted-foreground">Celebrate milestones. Share your wins. Inspire others.</p>
              </div>

            </div>
          </div>
        </section>

      </div>

      {/* Custom animations */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
          }
          33% {
            transform: translateY(-20px) translateX(10px);
          }
          66% {
            transform: translateY(10px) translateX(-10px);
          }
        }

        .animate-float {
          animation: float 8s ease-in-out infinite;
        }

        .rotate-y-6 {
          transform: perspective(1000px) rotateY(6deg);
        }
      `}</style>
    </PageShell>
  );
};

export default Hero;
