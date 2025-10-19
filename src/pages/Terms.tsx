import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";

const Terms = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Terms of Service | Finityo Debt Payoff"
        description="Terms that govern your use of Finityo's website and services."
        canonical="https://finityo-debt.com/terms"
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
          <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
          <p className="text-muted-foreground mb-8"><em>Effective date: October 18, 2025</em></p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance</h2>
            <p className="leading-relaxed">
              By using Finityo, you agree to these Terms and our Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Service description</h2>
            <p className="leading-relaxed">
              Finityo lets you connect accounts through Plaid, choose Snowball or Avalanche, and see estimated payoff timelines.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Eligibility</h2>
            <p className="leading-relaxed">
              You must be an adult able to form a binding contract.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Account & access</h2>
            <p className="leading-relaxed">
              You are responsible for safeguarding login credentials. Read-only access is provided via Plaid.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Your content</h2>
            <p className="leading-relaxed">
              You own your content but grant Finityo a limited license to use it for providing the service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Prohibited use</h2>
            <p className="leading-relaxed">
              No scraping, interference, or unlawful activity.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Disclaimers</h2>
            <p className="leading-relaxed">
              Educational purposes only. No guarantee of becoming debt-free by projected dates.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Limitation of liability</h2>
            <p className="leading-relaxed">
              Our liability is limited to fees paid in the last 12 months, or $1 if on the free tier.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Governing law</h2>
            <p className="leading-relaxed">
              Texas law applies. Venue is Comal County, Texas.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Contact</h2>
            <div className="bg-muted p-6 rounded-lg">
              <p className="mb-0">
                Email:{" "}
                <a href="mailto:hello@finityo-debt.com" className="text-primary hover:underline">
                  hello@finityo-debt.com
                </a>
              </p>
            </div>
          </section>
        </article>
      </div>
    </div>
  );
};

export default Terms;
