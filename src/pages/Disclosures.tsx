import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";

const Disclosures = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Disclosures | Finityo Debt Payoff"
        description="Important disclosures about Finityo, Plaid, estimates, and third-party services."
        canonical="https://finityo-debt.com/disclosures"
        ogImage="https://finityo-debt.com/og-default.png"
      />

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 w-4 h-4" />
          Back
        </Button>

        <article className="prose prose-slate max-w-none dark:prose-invert">
          <h1 className="text-4xl font-bold mb-2">Disclosures</h1>
          <p className="text-muted-foreground mb-8"><em>Last updated: October 18, 2025</em></p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Plaid connection</h2>
            <p className="leading-relaxed">
              Finityo uses Plaid for account linking. Access is read-only. We cannot move money. 
              Linking means you also accept Plaid's Terms and Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Not financial advice</h2>
            <p className="leading-relaxed">
              Finityo is for educational purposes only and is not a financial advisor.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Estimates & accuracy</h2>
            <p className="leading-relaxed">
              Payoff plans are estimates based on your data. Results may vary.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Third-party services</h2>
            <p className="leading-relaxed">
              We depend on third parties such as Plaid. Their outages or changes are outside our control.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Data exports</h2>
            <p className="leading-relaxed">
              You may export your plan to CSV or PDF. Data retention follows our Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Features & pricing</h2>
            <p className="leading-relaxed">
              Features and pricing may change. We'll provide notice when required.
            </p>
          </section>
        </article>
      </div>
    </div>
  );
};

export default Disclosures;
