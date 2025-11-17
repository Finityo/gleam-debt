import { Btn } from "@/components/Btn";
import { Sparkles } from "lucide-react";

export function FinalCTA() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/10 to-transparent" />
      
      <div className="relative mx-auto max-w-4xl px-4">
        <div className="glass-intense rounded-3xl p-8 md:p-16 text-center border border-glass-border shadow-vibrant border-gradient-animate card-hover">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-accent mb-6 shadow-glow animate-pulse icon-hover">
            <Sparkles className="h-10 w-10 text-white" />
          </div>

          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Ready to Take Control of Your Debt?
          </h2>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Get your personalized payoff plan in minutes. No credit card required to start.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="/auth?mode=signup" className="w-full sm:w-auto">
              <Btn 
                variant="cta" 
                className="w-full sm:w-auto px-8 py-4 text-lg shadow-accent hover:shadow-vibrant"
              >
                Get Started Free
              </Btn>
            </a>
            <a href="/pricing" className="w-full sm:w-auto">
              <Btn 
                variant="outline" 
                className="w-full sm:w-auto px-8 py-4 text-lg border-border hover:bg-white/5"
              >
                View Pricing
              </Btn>
            </a>
          </div>

          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-success" />
              <span>7-day free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-success" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-success" />
              <span>Bank-level security</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
