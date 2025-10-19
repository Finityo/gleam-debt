import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { DebtCard } from "@/components/DebtCard";
import { 
  Wallet, 
  TrendingDown, 
  Target, 
  Zap,
  ArrowRight,
  CreditCard,
  PiggyBank,
  BarChart3
} from "lucide-react";
import heroImage from "@/assets/hero-financial-freedom.jpg";
import finityoLogo from "@/assets/finityo-logo.png";

const Index = () => {
  const navigate = useNavigate();
  
  // Mock data for demo
  const mockDebts = [
    {
      creditor: "Chase Freedom",
      balance: 350000,
      apr: 1899,
      minPayment: 10500,
      dueDay: 15,
      type: "credit card"
    },
    {
      creditor: "Capital One Venture",
      balance: 225000,
      apr: 2149,
      minPayment: 6750,
      dueDay: 10,
      type: "credit card"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-95" />
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-10"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        
        <div className="relative container mx-auto px-4 py-20 lg:py-32">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <img 
                src={finityoLogo} 
                alt="Finityo Logo - Debt Management App" 
                className="w-full max-w-[280px] sm:max-w-md lg:max-w-lg h-auto animate-fade-in px-4"
              />
            </div>
            
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white">
              <Zap className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium">Accelerate Your Debt Freedom</span>
            </div>
            
            <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
              Crush Your Debt with the
              <span className="block bg-gradient-to-r from-accent to-accent-glow bg-clip-text text-transparent">
                Snowball Method
              </span>
            </h1>
            
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Connect your accounts, visualize your progress, and accelerate your journey to financial freedom with our smart debt payoff system.
            </p>

            <div className="flex flex-col gap-4 items-center pt-4">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="bg-white text-primary hover:bg-white/90 hover:shadow-glow transition-all text-lg px-8 py-6"
                  onClick={() => navigate('/auth')}
                >
                  Get Started Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="ghost"
                  className="bg-white/10 border border-white/30 text-white hover:bg-white/20 backdrop-blur-sm text-lg px-8 py-6"
                  onClick={() => {
                    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <BarChart3 className="mr-2 w-5 h-5" />
                  See How It Works
                </Button>
              </div>
              <p className="text-white/70 text-sm">
                Already have an account?{' '}
                <button 
                  onClick={() => navigate('/auth')}
                  className="text-white underline hover:text-accent transition-colors font-medium"
                >
                  Log in
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" className="w-full h-auto text-background">
            <path 
              fill="currentColor" 
              d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,58.7C960,64,1056,64,1152,58.7C1248,53,1344,43,1392,37.3L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"
            />
          </svg>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 -mt-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <StatCard
            title="Total Debt"
            value="$5,750"
            subtitle="Across 4 accounts"
            icon={CreditCard}
            trend={{ value: "↓ $450 this month", isPositive: true }}
          />
          <StatCard
            title="Monthly Budget"
            value="$1,200"
            subtitle="Available for payoff"
            icon={Wallet}
            trend={{ value: "2 debts target", isPositive: true }}
          />
          <StatCard
            title="Debt-Free Date"
            value="Dec 2026"
            subtitle="22 months remaining"
            icon={Target}
          />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Smart Features for Faster Payoff
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to take control of your debt and accelerate your financial freedom.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="text-center p-8 rounded-2xl bg-gradient-card border border-border/50 hover:shadow-vibrant transition-all duration-300">
              <div className="inline-flex p-4 rounded-xl bg-primary/10 mb-4">
                <CreditCard className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Auto-Connect Accounts</h3>
              <p className="text-muted-foreground">
                Securely link your credit cards, loans, and bank accounts in seconds with Plaid integration.
              </p>
            </div>

            <div className="text-center p-8 rounded-2xl bg-gradient-card border border-border/50 hover:shadow-vibrant transition-all duration-300">
              <div className="inline-flex p-4 rounded-xl bg-accent/10 mb-4">
                <TrendingDown className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Snowball & Avalanche</h3>
              <p className="text-muted-foreground">
                Compare both strategies and choose the best path to crush your debt faster.
              </p>
            </div>

            <div className="text-center p-8 rounded-2xl bg-gradient-card border border-border/50 hover:shadow-vibrant transition-all duration-300">
              <div className="inline-flex p-4 rounded-xl bg-success/10 mb-4">
                <PiggyBank className="w-8 h-8 text-success" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Track Income Sources</h3>
              <p className="text-muted-foreground">
                Add all your income streams and automatically calculate available payoff budget.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-foreground mb-4">
                How Finityo Works
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Get debt-free in just three simple steps
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold mb-6">
                  1
                </div>
                <h3 className="text-2xl font-bold mb-4">Connect Your Accounts</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Securely link your credit cards and loans through Plaid. We'll automatically import your balances, 
                  APRs, and payment details—no manual entry needed.
                </p>
              </div>

              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent text-accent-foreground text-2xl font-bold mb-6">
                  2
                </div>
                <h3 className="text-2xl font-bold mb-4">Get Your Custom Plan</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Our calculator analyzes your debts and creates a personalized payoff strategy. Choose between 
                  snowball (psychological wins) or avalanche (lowest interest first).
                </p>
              </div>

              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success text-success-foreground text-2xl font-bold mb-6">
                  3
                </div>
                <h3 className="text-2xl font-bold mb-4">Track Your Progress</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Watch your debt shrink with visual charts and milestones. See your debt-free date get closer 
                  every month as you crush each balance.
                </p>
              </div>
            </div>

            <div className="text-center mt-12">
              <Button 
                size="lg"
                onClick={() => navigate('/auth')}
                className="bg-gradient-primary hover:shadow-glow transition-all text-lg px-8"
              >
                Start Your Free Plan
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Active Debts Preview */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">Active Debts</h2>
              <p className="text-muted-foreground">Track and manage all your debt accounts in one place</p>
            </div>
            <Button 
              className="bg-gradient-primary hover:shadow-glow transition-all"
              onClick={() => navigate('/auth')}
            >
              <CreditCard className="mr-2 w-4 h-4" />
              Connect Accounts
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mockDebts.map((debt, idx) => (
              <DebtCard key={idx} {...debt} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-primary opacity-90" />
        <div className="relative container mx-auto px-4 py-20">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-4xl lg:text-5xl font-bold text-white">
              Ready to Become Debt-Free?
            </h2>
            <p className="text-xl text-white/90">
              Join thousands who've crushed their debt and achieved financial freedom.
            </p>
            <Button 
              size="lg" 
              className="bg-white text-primary hover:bg-white/90 hover:shadow-glow transition-all text-lg px-8 py-6"
              onClick={() => navigate('/auth')}
            >
              Start Your Journey
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div>
                <img src={finityoLogo} alt="Finityo" className="h-10 mb-4" />
                <p className="text-muted-foreground text-sm">
                  Empowering people to achieve financial freedom through proven debt payoff strategies.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-4">Company</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <button 
                      onClick={() => navigate('/about')}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      About Us
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => navigate('/privacy')}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      Privacy Policy
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => navigate('/privacy')}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      Terms of Service
                    </button>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-4">Resources</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <button 
                      onClick={() => navigate('/debt-chart')}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      Debt Visualizer
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => navigate('/debt-plan')}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      Payoff Calculator
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => navigate('/auth')}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      Sign In / Sign Up
                    </button>
                  </li>
                </ul>
              </div>
            </div>

            <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
              <p>© {new Date().getFullYear()} Finityo. All rights reserved. Your financial data is protected with bank-level security.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
