import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { DebtCard } from "@/components/DebtCard";
import { SEOHead } from "@/components/SEOHead";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Wallet, TrendingDown, Target, Zap, ArrowRight, CreditCard, PiggyBank, BarChart3, Download, Lock, FileText, CheckCircle2, Shield, Star } from "lucide-react";
import heroImage from "@/assets/hero-financial-freedom.jpg";
import finityoLogo from "@/assets/finityo-logo.png";
import heroPreview from "@/assets/hero-preview.png";
import plaidBadge from "@/assets/plaid-badge.png";
const Index = () => {
  const navigate = useNavigate();
  const {
    trackEvent
  } = useAnalytics();
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Finityo",
    "applicationCategory": "FinanceApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "1247"
    },
    "description": "Debt payoff planning tool using snowball and avalanche methods"
  };

  // Mock data for demo
  const mockDebts = [{
    creditor: "Chase Freedom",
    balance: 350000,
    apr: 1899,
    minPayment: 10500,
    dueDay: 15,
    type: "credit card"
  }, {
    creditor: "Capital One Venture",
    balance: 225000,
    apr: 2149,
    minPayment: 6750,
    dueDay: 10,
    type: "credit card"
  }];
  return <div className="min-h-screen bg-background">
      <SEOHead title="Finityo Debt Payoff | Snowball or Avalanche Plan" description="Connect with Plaid, choose Snowball or Avalanche, and get a month-by-month payoff plan. Free to start." canonical="https://finityo-debt.com/" structuredData={structuredData} />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-95" />
        <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{
        backgroundImage: `url(${heroImage})`
      }} />
        
        <div className="relative container mx-auto px-4 py-20 lg:py-32">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <img src={finityoLogo} alt="Finityo Logo - Debt Management App" className="w-full max-w-[280px] sm:max-w-md lg:max-w-lg h-auto animate-fade-in px-4" />
            </div>
            
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white">
              <Zap className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium">Accelerate Your Debt Freedom</span>
            </div>
            
            <h1 className="text-4xl lg:text-6xl font-bold text-white leading-tight">
              Build your debt payoff plan in minutes
            </h1>
            
            <p className="text-xl lg:text-2xl text-white/90 max-w-3xl mx-auto">
              Connect accounts with Plaid, choose Snowball or Avalanche, and see your debt-free date
            </p>

            <div className="flex flex-col gap-4 items-center pt-4">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 hover:shadow-glow transition-all text-lg px-8 py-6" onClick={() => navigate('/auth?mode=signup')}>
                Create your free plan
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="ghost" className="bg-white/10 border border-white/30 text-white hover:bg-white/20 backdrop-blur-sm text-lg px-8 py-6" onClick={() => navigate('/pricing')}>
                  <Star className="mr-2 w-5 h-5" />
                  View Pricing
                </Button>
              </div>
              
              <Button 
                size="lg" 
                variant="outline" 
                className="bg-white/5 border-2 border-white/40 text-white hover:bg-white hover:text-primary backdrop-blur-sm text-lg px-8 py-6 font-semibold"
                onClick={() => navigate('/auth?mode=signin')}
              >
                Member Login
              </Button>
              
              {/* Hero Preview Image */}
              <div className="mt-8 max-w-5xl mx-auto">
                <img src={heroPreview} alt="Finityo debt payoff dashboard preview showing debt tracking and payment plans" className="rounded-xl shadow-2xl border border-white/20" loading="eager" />
              </div>
            </div>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" className="w-full h-auto text-background">
            <path fill="currentColor" d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,58.7C960,64,1056,64,1152,58.7C1248,53,1344,43,1392,37.3L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z" />
          </svg>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 -mt-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <StatCard title="Total Debt" value="$5,750" subtitle="Across 4 accounts" icon={CreditCard} trend={{
          value: "↓ $450 this month",
          isPositive: true
        }} />
          <StatCard title="Monthly Budget" value="$1,200" subtitle="Available for payoff" icon={Wallet} trend={{
          value: "2 debts target",
          isPositive: true
        }} />
          <StatCard title="Debt-Free Date" value="Dec 2026" subtitle="22 months remaining" icon={Target} />
        </div>
      </section>

      {/* Testimonial Section */}
      <section id="testimonial" className="py-16 px-4 text-center bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-foreground mb-6">What people are saying</h2>
          <div className="max-w-2xl mx-auto">
            <blockquote className="text-lg italic text-muted-foreground mb-4 leading-relaxed">
              "Finityo helped me finally see a clear path to paying off my credit cards. The Snowball method gave me quick wins, and the calendar showed me exactly when I'd be debt-free."
            </blockquote>
            <p className="font-semibold text-foreground">— Maria G., Austin, TX</p>
          </div>
        </div>
      </section>

      {/* Sample Plan Section */}
      <section id="sample-plan" className="py-16 px-4 text-center">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-foreground mb-6">See a Sample Payoff Plan</h2>
          <p className="max-w-3xl mx-auto mb-8 text-lg text-muted-foreground">
            Connect your accounts with Plaid, choose Snowball or Avalanche, and we'll generate a simple month-by-month schedule that shows balances shrinking and a clear payoff date.
          </p>
          <img src="/images/sample-plan.png" alt="Sample debt payoff calendar screenshot" className="max-w-full w-full border border-border rounded-lg shadow-lg mx-auto" loading="lazy" />
          <p className="mt-4 text-sm text-muted-foreground">
            This example is for demo purposes only. Your results will vary based on your accounts and payments.
          </p>
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

          {/* 5-Item Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="text-center p-8 rounded-2xl bg-gradient-card border border-border/50 hover:shadow-vibrant transition-all duration-300">
              <div className="inline-flex p-4 rounded-xl bg-primary/10 mb-4">
                <TrendingDown className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Snowball/Avalanche Toggle</h3>
              <p className="text-muted-foreground">
                Switch between strategies instantly. Compare which method saves you more or motivates you better.
              </p>
            </div>

            <div className="text-center p-8 rounded-2xl bg-gradient-card border border-border/50 hover:shadow-vibrant transition-all duration-300">
              <div className="inline-flex p-4 rounded-xl bg-accent/10 mb-4">
                <CheckCircle2 className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Auto-Sort Debts</h3>
              <p className="text-muted-foreground">
                Debts are automatically organized by balance or interest rate based on your chosen strategy.
              </p>
            </div>

            <div className="text-center p-8 rounded-2xl bg-gradient-card border border-border/50 hover:shadow-vibrant transition-all duration-300">
              <div className="inline-flex p-4 rounded-xl bg-success/10 mb-4">
                <Wallet className="w-8 h-8 text-success" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Extra Payment Slider</h3>
              <p className="text-muted-foreground">
                Adjust extra monthly payments with a slider to see how much faster you can become debt-free.
              </p>
            </div>

            <div className="text-center p-8 rounded-2xl bg-gradient-card border border-border/50 hover:shadow-vibrant transition-all duration-300">
              <div className="inline-flex p-4 rounded-xl bg-primary/10 mb-4">
                <Download className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Export CSV/PDF</h3>
              <p className="text-muted-foreground">
                Download your complete payoff plan as a spreadsheet or PDF to print or share with advisors.
              </p>
            </div>

            <div className="text-center p-8 rounded-2xl bg-gradient-card border border-border/50 hover:shadow-vibrant transition-all duration-300 lg:col-span-1 md:col-span-2">
              <div className="inline-flex p-4 rounded-xl bg-accent/10 mb-4">
                <Lock className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Privacy First</h3>
              <p className="text-muted-foreground">
                Bank-level encryption, read-only access, and zero data selling. Your financial info stays private.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Security Section */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Your Security is Our Priority
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center mb-12">
              <div className="flex justify-center">
                <img src={plaidBadge} alt="Powered by Plaid - Secure financial connections" className="w-full max-w-xs" loading="lazy" />
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Read-Only Access</h3>
                    <p className="text-muted-foreground">
                      We can only view your account balances and information. We cannot move or store funds.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Lock className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Bank-Level Encryption</h3>
                    <p className="text-muted-foreground">
                      256-bit SSL encryption protects all data transmission and storage.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FileText className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Transparent Policies</h3>
                    <p className="text-muted-foreground">
                      Clear privacy and terms that put you in control of your data.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              <Button variant="outline" onClick={() => navigate('/privacy')} className="gap-2">
                <Shield className="w-4 h-4" />
                Privacy Policy
              </Button>
              <Button variant="outline" onClick={() => navigate('/terms')} className="gap-2">
                <FileText className="w-4 h-4" />
                Terms of Service
              </Button>
              <Button variant="outline" onClick={() => navigate('/disclosures')} className="gap-2">
                <Lock className="w-4 h-4" />
                Security Disclosures
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof / Testimonials */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Real People, Real Results
            </h2>
            <p className="text-xl text-muted-foreground">
              Join thousands who've achieved financial freedom with Finityo
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gradient-card rounded-2xl p-8 border border-border/50">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-warning text-warning" />)}
              </div>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                "Finityo helped me pay off $18,000 in credit card debt in just 14 months. The visual progress charts kept me motivated every step of the way!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  SM
                </div>
                <div>
                  <p className="font-semibold">Sarah M.</p>
                  <p className="text-sm text-muted-foreground">Austin, TX</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-card rounded-2xl p-8 border border-border/50">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-warning text-warning" />)}
              </div>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                "The snowball method gave me quick wins that kept me going. Being able to connect all my accounts automatically saved so much time."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">
                  JR
                </div>
                <div>
                  <p className="font-semibold">James R.</p>
                  <p className="text-sm text-muted-foreground">Portland, OR</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-card rounded-2xl p-8 border border-border/50">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-warning text-warning" />)}
              </div>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                "Finally a debt app that actually makes sense! The month-by-month plan showed me exactly when I'd be debt-free. Game changer."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center text-success font-bold">
                  MC
                </div>
                <div>
                  <p className="font-semibold">Maria C.</p>
                  <p className="text-sm text-muted-foreground">Miami, FL</p>
                </div>
              </div>
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
                <p className="text-muted-foreground leading-relaxed">Our calculator analyzes your debts and creates a personalized payoff strategy. Choose between snowball (psychological wins) or avalanche (highest interest first).</p>
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
              <Button size="lg" onClick={() => navigate('/auth')} className="bg-gradient-primary hover:shadow-glow transition-all text-lg px-8">
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
            <Button className="bg-gradient-primary hover:shadow-glow transition-all" onClick={() => navigate('/auth')}>
              <CreditCard className="mr-2 w-4 h-4" />
              Connect Accounts
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mockDebts.map((debt, idx) => <DebtCard key={idx} {...debt} />)}
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
            <Button size="lg" className="bg-white text-primary hover:bg-white/90 hover:shadow-glow transition-all text-lg px-8 py-6" onClick={() => navigate('/auth')}>
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
                    <button onClick={() => navigate('/about')} className="text-muted-foreground hover:text-primary transition-colors">
                      About Us
                    </button>
                  </li>
                  <li>
                    <a href="mailto:support@finityo-debt.com" className="text-muted-foreground hover:text-primary transition-colors">
                      Contact
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-4">Legal</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <button onClick={() => navigate('/privacy')} className="text-muted-foreground hover:text-primary transition-colors">
                      Privacy Policy
                    </button>
                  </li>
                  <li>
                    <button onClick={() => navigate('/terms')} className="text-muted-foreground hover:text-primary transition-colors">
                      Terms of Service
                    </button>
                  </li>
                  <li>
                    <button onClick={() => navigate('/disclosures')} className="text-muted-foreground hover:text-primary transition-colors">
                      Disclosures
                    </button>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-4">Resources</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <button onClick={() => navigate('/debt-chart')} className="text-muted-foreground hover:text-primary transition-colors">
                      Debt Visualizer
                    </button>
                  </li>
                  <li>
                    <button onClick={() => navigate('/debt-plan')} className="text-muted-foreground hover:text-primary transition-colors">
                      Payoff Calculator
                    </button>
                  </li>
                  <li>
                    <button onClick={() => navigate('/auth')} className="text-muted-foreground hover:text-primary transition-colors">
                      Sign In / Sign Up
                    </button>
                  </li>
                  <li>
                    <button onClick={() => navigate('/team-access')} className="text-muted-foreground hover:text-primary transition-colors font-medium">
                      Team Access
                    </button>
                  </li>
                </ul>
              </div>
            </div>

            <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground space-y-2">
              <p>Last updated: October 21, 2025</p>
              <p>© {new Date().getFullYear()} Finityo. All rights reserved. Your financial data is protected with bank-level security.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>;
};
export default Index;