import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Check, Shield, Sparkles } from "lucide-react";
import { useEffect } from "react";

const Hero = () => {
  const navigate = useNavigate();
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    // Track page visit
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
    <>
      <SEOHead 
        title="Finityo - Take Control of Your Debt. Finally."
        description="AI-powered payoff plans that adapt as your life changes. Bank-grade security, Plaid integration, no credit impact."
      />

      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 overflow-hidden relative">
        {/* Animated gradient beams */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/4 w-1 h-full bg-gradient-to-b from-primary/0 via-primary/50 to-primary/0 animate-pulse" />
          <div className="absolute top-0 right-1/3 w-1 h-full bg-gradient-to-b from-accent/0 via-accent/50 to-accent/0 animate-pulse delay-700" />
        </div>

        {/* Particle shimmer effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-primary/30 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${5 + Math.random() * 5}s`,
              }}
            />
          ))}
        </div>

        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center px-4 py-20">
          <div className="relative z-10 max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              
              {/* Left: Content */}
              <div className="text-left space-y-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-primary">AI-Powered Debt Freedom</span>
                </div>

                <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                  Take control of your debt.{" "}
                  <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient">
                    Finally.
                  </span>
                </h1>

                <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
                  AI-powered payoff plans that adapt as your life changes.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-primary/50 transition-all text-lg px-8 py-6 font-semibold group"
                    onClick={() => {
                      trackEvent('hero_cta_click');
                      navigate('/setup/start');
                    }}
                  >
                    Get Started
                    <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8">
                  {[
                    { icon: Shield, text: "Bank-grade security" },
                    { icon: Check, text: "Plaid integration" },
                    { icon: Check, text: "No credit impact" },
                    { icon: Check, text: "Built for real people" },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <item.icon className="w-4 h-4 text-primary" />
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Liquid Glass Device Mockup */}
              <div className="relative group">
                {/* Ambient glow */}
                <div className="absolute inset-0 bg-gradient-radial from-primary/30 via-accent/20 to-transparent blur-3xl scale-150 opacity-50 group-hover:opacity-70 transition-opacity" />
                
                {/* Neon bloom */}
                <div className="absolute -inset-20 bg-gradient-conic from-primary via-accent to-primary opacity-20 blur-2xl animate-spin-slow" />

                {/* Liquid glass container */}
                <div className="relative group-hover:scale-105 transition-transform duration-700">
                  {/* Glass reflection layers */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-[3rem] backdrop-blur-xl border border-white/20 shadow-2xl" />
                  <div className="absolute inset-0 bg-gradient-to-tl from-primary/5 via-transparent to-accent/5 rounded-[3rem]" />
                  
                  {/* Device mockup */}
                  <div className="relative rounded-[3rem] overflow-hidden border-8 border-foreground/10 bg-background shadow-2xl">
                    <div className="aspect-[9/19] bg-gradient-to-br from-primary/5 via-background to-accent/5 p-8">
                      {/* Notch */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-background rounded-b-3xl" />
                      
                      {/* App Preview Content */}
                      <div className="relative h-full flex flex-col items-center justify-center gap-6 pt-8">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                          <span className="text-2xl font-bold text-primary-foreground">F</span>
                        </div>
                        <div className="text-center space-y-2">
                          <div className="text-2xl font-bold">$0</div>
                          <div className="text-sm text-muted-foreground">Debt-Free Date</div>
                        </div>
                        <div className="w-full space-y-3">
                          {[70, 50, 85].map((width, i) => (
                            <div key={i} className="h-16 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 p-3">
                              <div className="h-2 rounded-full bg-primary/20" style={{ width: `${width}%` }} />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ambient light halo */}
                  <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-3/4 h-20 bg-primary/30 blur-3xl rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-float {
          animation: float ease-in-out infinite;
        }
        .animate-gradient {
          background-size: 200% auto;
          animation: gradient 3s linear infinite;
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        .delay-700 {
          animation-delay: 0.7s;
        }
      `}</style>
    </>
  );
};

export default Hero;
