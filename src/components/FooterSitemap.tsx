import { Link } from "react-router-dom";

export default function FooterSitemap() {
  return (
    <footer className="border-t border-border bg-background/50 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 py-12">
        
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Brand Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg" />
              <span className="text-lg font-bold text-foreground">Finityo</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Debt Simplified. Take control of your financial future with AI-powered payoff plans.
            </p>
          </div>

          {/* Product Column */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Product</h3>
            <nav className="flex flex-col gap-2">
              <Link to="/setup/start" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Get Started
              </Link>
              <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </Link>
              <Link to="/demo/start" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Demo
              </Link>
            </nav>
          </div>

          {/* Resources Column */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Resources</h3>
            <nav className="flex flex-col gap-2">
              <Link to="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Blog
              </Link>
              <Link to="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                About
              </Link>
              <Link to="/sitemap" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Sitemap
              </Link>
            </nav>
          </div>

          {/* Legal Column */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Legal</h3>
            <nav className="flex flex-col gap-2">
              <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Terms of Service
              </Link>
              <Link to="/disclosures" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Disclosures
              </Link>
            </nav>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <div>
              © {new Date().getFullYear()} Finityo. All rights reserved.
            </div>
            
            {/* Team Access Link */}
            <div>
              <Link 
                to="/team/login" 
                className="text-primary hover:text-primary-glow transition-colors font-medium"
              >
                Team Access (Admin)
              </Link>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}
