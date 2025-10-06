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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white">
              <Zap className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium">Accelerate Your Debt Freedom</span>
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-bold text-white leading-tight">
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
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm text-lg px-8 py-6"
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

      {/* Active Debts Preview */}
      <section className="container mx-auto px-4 pb-20">
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
    </div>
  );
};

export default Index;
