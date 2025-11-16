import { PageShell } from "@/components/PageShell";
import { Target, Shield, Users, Heart, TrendingUp, Sparkles } from "lucide-react";
import { Btn } from "@/components/Btn";

export default function About() {
  return (
    <PageShell>
      <div className="mx-auto max-w-4xl px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent mb-6 shadow-glow">
            <img src="/finityo-icon-final.png" alt="Finityo" className="h-12 w-12 rounded-lg" />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            About Finityo
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Helping people become debt-free, one smart decision at a time.
          </p>
        </div>

        {/* Mission Statement */}
        <div className="glass-card p-8 mb-12 animate-fade-in">
          <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
            <Target className="h-7 w-7 text-primary" />
            Our Mission
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Finityo exists to empower individuals and families to achieve financial freedom through 
            intelligent debt management. We believe that with the right tools, clear visualizations, 
            and proven strategies, anyone can take control of their debt and build a brighter financial future.
          </p>
        </div>

        {/* Why We Built This */}
        <div className="glass-card p-8 mb-12 animate-fade-in">
          <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
            <Heart className="h-7 w-7 text-primary" />
            Why We Built This
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Debt can feel overwhelming and isolating. Traditional tools are either too complex, too expensive, 
            or simply don't provide the clarity needed to make real progress. We experienced this frustration 
            firsthand and knew there had to be a better way.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Finityo was born from a simple idea: what if paying off debt could be visual, strategic, and even 
            motivating? We combined proven debt payoff methods (snowball and avalanche) with modern design, 
            automation, and AI insights to create a tool that actually helps people succeed.
          </p>
        </div>

        {/* What Makes Us Different */}
        <div className="mb-12 animate-fade-in">
          <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
            What Makes Us Different
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <ValueCard
              icon={<TrendingUp className="h-6 w-6" />}
              title="Proven Strategies"
              description="We use time-tested debt snowball and avalanche methods, backed by financial experts and real results."
            />
            
            <ValueCard
              icon={<Shield className="h-6 w-6" />}
              title="Bank-Level Security"
              description="Your financial data is protected with 256-bit encryption and SOC 2 compliance. We never sell your data."
            />
            
            <ValueCard
              icon={<Sparkles className="h-6 w-6" />}
              title="AI-Powered Insights"
              description="Get personalized recommendations and coaching powered by AI, helping you make smarter decisions faster."
            />
            
            <ValueCard
              icon={<Users className="h-6 w-6" />}
              title="Community-Driven"
              description="Built with feedback from real users tackling real debt. Your success stories inspire our roadmap."
            />
          </div>
        </div>

        {/* Our Commitment */}
        <div className="glass-card p-8 mb-12 animate-fade-in">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Our Commitment to You
          </h2>
          <ul className="space-y-3 text-muted-foreground">
            <li className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="h-2 w-2 rounded-full bg-primary" />
              </div>
              <span><strong className="text-foreground">Privacy First:</strong> Your financial data stays yours. We never sell or share your information with third parties.</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="h-2 w-2 rounded-full bg-primary" />
              </div>
              <span><strong className="text-foreground">Transparency:</strong> No hidden fees, no surprise charges. What you see is what you get.</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="h-2 w-2 rounded-full bg-primary" />
              </div>
              <span><strong className="text-foreground">Continuous Improvement:</strong> We're constantly adding new features based on your feedback and the latest financial best practices.</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="h-2 w-2 rounded-full bg-primary" />
              </div>
              <span><strong className="text-foreground">Support:</strong> Real people who care about your success. We're here to help you every step of the way.</span>
            </li>
          </ul>
        </div>

        {/* CTA */}
        <div className="text-center glass-intense rounded-3xl p-12 animate-fade-in">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to Start Your Journey?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of people who are taking control of their debt with Finityo.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="/auth?mode=signup" className="w-full sm:w-auto">
              <Btn variant="cta" className="w-full px-8 py-4 text-lg">
                Get Started Free
              </Btn>
            </a>
            <a href="/pricing" className="w-full sm:w-auto">
              <Btn variant="outline" className="w-full px-8 py-4 text-lg border-border hover:bg-white/5">
                View Pricing
              </Btn>
            </a>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function ValueCard({ icon, title, description }: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
}) {
  return (
    <div className="glass-card p-6 hover:shadow-vibrant hover:-translate-y-1 transition-all">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent mb-4 text-white">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {title}
      </h3>
      <p className="text-muted-foreground text-sm">
        {description}
      </p>
    </div>
  );
}
