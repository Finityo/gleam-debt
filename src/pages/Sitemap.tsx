import React from "react";
import { Link } from "react-router-dom";
import { 
  Home, 
  Info, 
  DollarSign, 
  Rocket,
  LayoutDashboard,
  CreditCard,
  TrendingDown,
  BarChart3,
  Calendar,
  Sparkles,
  Printer,
  BookOpen,
  User,
  Smartphone,
  Building2,
  Shield,
  FileText,
  ScrollText
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SEOHead } from "@/components/SEOHead";

interface SitemapLink {
  path: string;
  label: string;
  description?: string;
}

interface SitemapSection {
  title: string;
  description: string;
  icon: React.ReactNode;
  links: SitemapLink[];
}

export default function Sitemap() {
  const sections: SitemapSection[] = [
    {
      title: "Main Pages",
      description: "Essential information about Finityo",
      icon: <Home className="w-5 h-5" />,
      links: [
        { path: "/", label: "Home", description: "Welcome to Finityo" },
        { path: "/about", label: "About", description: "Learn about our mission" },
        { path: "/pricing", label: "Pricing", description: "Plans and pricing" },
      ],
    },
    {
      title: "Demo Experience",
      description: "Interactive demo of our debt payoff engine",
      icon: <Rocket className="w-5 h-5" />,
      links: [
        { path: "/setup", label: "Setup (Quick Access)", description: "Redirects to setup start" },
        { path: "/setup/start", label: "Setup Start", description: "Begin the setup journey" },
        { path: "/setup/debts", label: "Setup Debts", description: "Enter sample debts" },
        { path: "/setup/plan", label: "Setup Plan", description: "Optimize your strategy" },
        { path: "/setup/chart", label: "Setup Results", description: "View payoff projections" },
      ],
    },
    {
      title: "Core Application",
      description: "Main debt management features",
      icon: <LayoutDashboard className="w-5 h-5" />,
      links: [
        { path: "/dashboard", label: "Dashboard", description: "Your debt overview" },
        { path: "/debts", label: "Manage Debts", description: "Add and edit your debts" },
        { path: "/debt-plan", label: "Debt Plan", description: "Create your payoff strategy" },
        { path: "/debt-chart", label: "Debt Chart", description: "Visualize your progress" },
        { path: "/debt-visualization", label: "Visualization", description: "Advanced charts" },
        { path: "/payoff-calendar", label: "Payoff Calendar", description: "Monthly payment schedule" },
      ],
    },
    {
      title: "AI & Tools",
      description: "Smart features to accelerate your debt freedom",
      icon: <Sparkles className="w-5 h-5" />,
      links: [
        { path: "/ai-advisor", label: "AI Advisor", description: "Get personalized advice" },
        { path: "/printable-summary", label: "Printable Summary", description: "Export your plan" },
      ],
    },
    {
      title: "Blog & Resources",
      description: "Educational content about debt management",
      icon: <BookOpen className="w-5 h-5" />,
      links: [
        { path: "/blog", label: "Blog Home", description: "All articles" },
        { path: "/blog/snowball-vs-avalanche-method", label: "Snowball vs Avalanche", description: "Compare strategies" },
        { path: "/blog/create-debt-payoff-plan-5-steps", label: "5-Step Debt Payoff Plan", description: "Getting started guide" },
        { path: "/blog/understanding-apr-interest-rates", label: "Understanding APR", description: "Interest rate basics" },
        { path: "/blog/psychology-of-debt-small-wins", label: "Psychology of Debt", description: "Small wins matter" },
      ],
    },
    {
      title: "Account & Profile",
      description: "Manage your account settings",
      icon: <User className="w-5 h-5" />,
      links: [
        { path: "/auth", label: "Sign In / Sign Up", description: "Access your account" },
        { path: "/profile", label: "Profile", description: "Update your settings" },
      ],
    },
    {
      title: "Mobile & PWA",
      description: "Access Finityo on any device",
      icon: <Smartphone className="w-5 h-5" />,
      links: [
        { path: "/install", label: "Install App", description: "Add to home screen" },
        { path: "/mobile-view", label: "Mobile View", description: "Optimized mobile experience" },
      ],
    },
    {
      title: "Integrations",
      description: "Connect with financial services",
      icon: <Building2 className="w-5 h-5" />,
      links: [
        { path: "/plaid-submission", label: "Plaid Integration", description: "Connect your accounts" },
      ],
    },
    {
      title: "Legal & Compliance",
      description: "Important legal information",
      icon: <Shield className="w-5 h-5" />,
      links: [
        { path: "/privacy", label: "Privacy Policy", description: "How we protect your data" },
        { path: "/terms", label: "Terms of Service", description: "Terms and conditions" },
        { path: "/disclosures", label: "Disclosures", description: "Legal disclosures" },
      ],
    },
  ];

  return (
    <>
      <SEOHead
        title="Sitemap | Finityo"
        description="Complete sitemap of all available pages on Finityo. Find debt management tools, resources, and account features."
        canonical="https://finityo-debt.com/sitemap"
      />
      
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12 max-w-7xl">
          {/* Header */}
          <div className="mb-12 text-center">
            <div className="inline-flex items-center gap-2 mb-4 text-primary">
              <ScrollText className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Sitemap
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Explore all available pages and features on Finityo. Navigate to any section to start your debt freedom journey.
            </p>
          </div>

          {/* Sitemap Sections */}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {sections.map((section) => (
              <Card key={section.title} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      {section.icon}
                    </div>
                    <CardTitle className="text-xl">{section.title}</CardTitle>
                  </div>
                  <CardDescription>{section.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <nav>
                    <ul className="space-y-3">
                      {section.links.map((link) => (
                        <li key={link.path}>
                          <Link
                            to={link.path}
                            className="group block p-2 rounded-lg hover:bg-muted transition-colors"
                          >
                            <div className="font-medium text-foreground group-hover:text-primary transition-colors">
                              {link.label}
                            </div>
                            {link.description && (
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {link.description}
                              </div>
                            )}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Footer Note */}
          <div className="mt-12 p-6 rounded-xl border border-border bg-muted/50 text-center">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Note:</strong> Some pages require authentication to access. 
              Admin and internal utility pages are not listed here.
            </p>
          </div>

          {/* Back to Home */}
          <div className="mt-8 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              <Home className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
