import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { DebtCard } from "@/components/DebtCard";
import { SEOHead } from "@/components/SEOHead";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Wallet, TrendingDown, Target, Zap, ArrowRight, CreditCard, Download, Lock, FileText, CheckCircle2, Shield, Star } from "lucide-react";
import heroImage from "@/assets/hero-financial-freedom.jpg";
import finityoLogo from "@/assets/finityo-logo.png";
import plaidBadge from "@/assets/plaid-badge.png";

const Index = () => {
  const navigate = useNavigate();
  const { trackEvent } = useAnalytics();
  
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "name": "Finityo",
        "url": "https://finityo-debt.com",
        "logo": "https://finityo-debt.com/og-image.jpg",
        "description": "Debt payoff planning tool helping users achieve financial freedom",
        "sameAs": []
      },
      {
        "@type": "WebSite",
        "name": "Finityo Debt Payoff",
        "url": "https://finityo-debt.com",
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://finityo-debt.com/?s={search_term_string}",
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@type": "SoftwareApplication",
        "name": "Finityo",
        "applicationCategory": "FinanceApplication",
        "operatingSystem": "Web",
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
        "description": "Debt payoff planning tool using snowball and avalanche methods with Plaid integration for automatic account sync"
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "What is the snowball method?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "The snowball method focuses on paying off your smallest debt first while making minimum payments on others, creating momentum through quick wins."
            }
          },
          {
            "@type": "Question",
            "name": "What is the avalanche method?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "The avalanche method prioritizes debts with the highest interest rates first, potentially saving you more money over time."
            }
          },
          {
            "@type": "Question",
            "name": "Is my financial data secure?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes, we use Plaid for bank-level 256-bit SSL encryption with read-only access. We cannot move or store funds, only view balances."
            }
          }
        ]
      }
    ]
  };

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

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="Finityo Debt Payoff | Snowball or Avalanche Plan" 
        description="Connect with Plaid, choose Snowball or Avalanche, and get a month-by-month payoff plan. Free to start." 
        canonical="https://finityo-debt.com/" 
        structuredData={structuredData} 
      />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-screen flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-hero" />
        
        <div className="relative container mx-auto px-4 py-20">
          <div className="max-w-2xl mx-auto text-center">
            <div className="backdrop-blur-xl bg-white/10 dark:bg-gray-900/30 border border-white/20 dark:border-gray-700/50 rounded-3xl p-10 shadow-2xl animate-fade-in">
              <div className="flex justify-center mb-6">
                <img 
                  src="/finityo-icon-final.png" 
                  alt="Finityo Icon" 
                  className="w-[110px] h-[110px] rounded-[24px] backdrop-blur-sm bg-white/10 border border-white/30 shadow-xl p-1"
                  loading="eager"
                />
              </div>
              
              <div className="inline-flex items-center gap-2 px-4 py-2 mb-4 rounded-full bg-indigo-200/20 border border-indigo-200/30 text-indigo-100">
                <Zap className="w-4 h-4" />
                <span className="text-sm font-medium">Accelerate Your Debt Freedom</span>
              </div>
              
              <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
                Build your debt payoff plan in minutes
              </h1>
              
              <p className="text-lg lg:text-xl text-indigo-100 mb-8 max-w-lg mx-auto">
                Connect accounts with Plaid, choose Snowball or Avalanche, and see your debt-free date
              </p>

              <Button 
                size="lg" 
                className="bg-white/80 text-primary hover:bg-white hover:shadow-glow transition-all text-lg px-8 py-6 font-semibold"
                onClick={() => {
                  trackEvent('hero_cta_click');
                  navigate('/auth?mode=signup');
                }}
              >
                Create your free plan →
              </Button>

              <Button
                variant="ghost"
                size="lg"
                className="text-white/90 hover:text-white hover:bg-white/10 mt-4"
                onClick={() => navigate('/pricing')}
              >
                View Pricing
              </Button>
            </div>
          </div>
        </div>

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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="text-center p-8 rounded-2xl bg-gradient-card border border-border/50 hover:shadow-vibrant hover:-translate-y-1 transition-all duration-300">
              <div className="inline-flex p-4 rounded-xl bg-primary/10 mb-4">
                <TrendingDown className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Snowball/Avalanche Toggle</h3>
              <p className="text-muted-foreground">
                Switch between strategies instantly. Compare which method saves you more or motivates you better.
              </p>
            </div>

            <div className="text-center p-8 rounded-2xl bg-gradient-card border border-border/50 hover:shadow-vibrant hover:-translate-y-1 transition-all duration-300">
              <div className="inline-flex p-4 rounded-xl bg-accent/10 mb-4">
                <CheckCircle2 className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Auto-Sort Debts</h3>
              <p className="text-muted-foreground">
                Debts are automatically organized by balance or interest rate based on your chosen strategy.
              </p>
            </div>

            <div className="text-center p-8 rounded-2xl bg-gradient-card border border-border/50 hover:shadow-vibrant hover:-translate-y-1 transition-all duration-300">
              <div className="inline-flex p-4 rounded-xl bg-success/10 mb-4">
                <Wallet className="w-8 h-8 text-success" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Extra Payment Slider</h3>
              <p className="text-muted-foreground">
                Adjust extra monthly payments with a slider to see how much faster you can become debt-free.
              </p>
            </div>

            <div className="text-center p-8 rounded-2xl bg-gradient-card border border-border/50 hover:shadow-vibrant hover:-translate-y-1 transition-all duration-300">
              <div className="inline-flex p-4 rounded-xl bg-primary/10 mb-4">
                <Download className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Export CSV/PDF</h3>
              <p className="text-muted-foreground">
                Download your complete payoff plan as a spreadsheet or PDF to print or share with advisors.
              </p>
            </div>

            <div className="text-center p-8 rounded-2xl bg-gradient-card border border-border/50 hover:shadow-vibrant hover:-translate-y-1 transition-all duration-300 lg:col-span-1 md:col-span-2">
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

      {/* Social Proof Section */}
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
            <div className="bg-gradient-card rounded-2xl p-8 border border-border/50 hover:shadow-vibrant hover:-translate-y-1 transition-all duration-300">
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

            <div className="bg-gradient-card rounded-2xl p-8 border border-border/50 hover:shadow-vibrant hover:-translate-y-1 transition-all duration-300">
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

            <div className="bg-gradient-card rounded-2xl p-8 border border-border/50 hover:shadow-vibrant hover:-translate-y-1 transition-all duration-300">
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

      {/* How It Works */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-foreground mb-4">
                How Finityo Works
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Get debt-free in four simple steps
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-4xl mb-6">
                  📝
                </div>
                <h3 className="text-xl font-bold mb-3">Input Debts</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Connect accounts with Plaid or enter manually
                </p>
              </div>

              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 text-4xl mb-6">
                  ⚖️
                </div>
                <h3 className="text-xl font-bold mb-3">Choose Method</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Pick Snowball or Avalanche strategy
                </p>
              </div>

              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 text-4xl mb-6">
                  📅
                </div>
                <h3 className="text-xl font-bold mb-3">See Timeline</h3>
                <p className="text-muted-foreground leading-relaxed">
                  View month-by-month payoff schedule
                </p>
              </div>

              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-4xl mb-6">
                  📈
                </div>
                <h3 className="text-xl font-bold mb-3">Track Progress</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Monitor balances and stay motivated
                </p>
              </div>
            </div>

            <div className="text-center">
              <Button size="lg" onClick={() => navigate('/auth')} className="bg-gradient-primary hover:shadow-glow transition-all text-lg px-8">
                Start Your Free Plan
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center text-center p-6 rounded-xl border border-border bg-card/50">
              <Lock className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-semibold mb-2">No Bank Logins Required</h3>
              <p className="text-sm text-muted-foreground">Manual entry or Plaid - your choice</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-xl border border-border bg-card/50">
              <Shield className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-semibold mb-2">Privacy First</h3>
              <p className="text-sm text-muted-foreground">Bank-level encryption, zero data selling</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-xl border border-border bg-card/50">
              <Download className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-semibold mb-2">Export Anytime</h3>
              <p className="text-sm text-muted-foreground">Download CSV, Excel, or PDF plans</p>
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
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
                    <button onClick={() => navigate('/blog')} className="text-muted-foreground hover:text-primary transition-colors">
                      Blog
                    </button>
                  </li>
                  <li>
                    <a href="mailto:info@finityo.com" className="text-muted-foreground hover:text-primary transition-colors">
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
    </div>
  );
};

export default Index;
