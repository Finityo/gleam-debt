import React from "react";
import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";

const PUBLIC_ROUTES = [
  { title: "Home", path: "/" },
  { title: "Pricing", path: "/pricing" },
  { title: "Blog", path: "/blog" },
  { title: "Resources", path: "/resources" },
  { title: "Privacy", path: "/privacy" },
  { title: "Terms", path: "/terms" },
  { title: "Disclosures", path: "/disclosures" },
  { title: "Install App", path: "/install" },
];

const PROTECTED_ROUTES = [
  { title: "Dashboard", path: "/dashboard" },
  { title: "Manage Debts", path: "/debts" },
  { title: "Debt Plan", path: "/debt-plan" },
  { title: "Payoff Chart", path: "/debt-chart" },
  { title: "Visualization", path: "/visualization" },
  { title: "Scenarios", path: "/scenarios" },
  { title: "Financial Insights", path: "/financial-insights" },
  { title: "Settings", path: "/settings" },
  { title: "Profile", path: "/profile" },
  { title: "Payoff Calendar", path: "/payoff-calendar" },
  { title: "Share History", path: "/share/history" },
];

export default function Sitemap() {
  return (
    <>
      <SEOHead
        title="Sitemap - Finityo"
        description="Complete sitemap of all Finityo pages and features"
        canonical="/sitemap"
      />
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Sitemap</h1>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">Public Pages</h2>
            <ul className="space-y-2">
              {PUBLIC_ROUTES.map((r) => (
                <li key={r.path}>
                  <Link
                    to={r.path}
                    className="text-primary hover:underline"
                  >
                    {r.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">Protected Pages</h2>
            <p className="text-sm text-muted-foreground mb-3">
              Requires authentication to access
            </p>
            <ul className="space-y-2">
              {PROTECTED_ROUTES.map((r) => (
                <li key={r.path}>
                  <Link
                    to={r.path}
                    className="text-primary hover:underline"
                  >
                    {r.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <div className="mt-12 p-4 bg-muted/50 rounded-lg">
            <Link
              to="/"
              className="text-primary hover:underline"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
