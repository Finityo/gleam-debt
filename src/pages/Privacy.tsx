import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Privacy Policy | Finityo Debt Payoff"
        description="How Finityo collects, uses, and protects your information. Read-only via Plaid."
        canonical="https://finityo-debt.com/privacy"
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
          <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8"><em>Last updated: October 18, 2025</em></p>

          <p className="leading-relaxed mb-6">
            Welcome to Finityo ("we", "us", "our"). This Privacy Policy explains how we collect, use, disclose, 
            and protect information about you when you use our website and services.
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Information we collect</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Account and financial data:</strong> Read-only access through Plaid (balances, debts, transactions).
              </li>
              <li>
                <strong>Personal details:</strong> Name, email address, profile info.
              </li>
              <li>
                <strong>Usage & device info:</strong> IP address, browser, device type, pages visited.
              </li>
              <li>
                <strong>Cookies:</strong> For performance and feature improvement.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. How we use your information</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide and operate the service</li>
              <li>Improve features and performance</li>
              <li>Communicate with you about updates/support</li>
              <li>Protect the service and detect misuse</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Sharing & disclosure</h2>
            <p className="leading-relaxed">
              We do not sell your personal data. We may share with trusted service providers or disclose if required by law.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Security & retention</h2>
            <p className="leading-relaxed">
              We use reasonable measures to protect your data and only retain it as long as needed or legally required.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Your rights</h2>
            <p className="leading-relaxed">
              You may request access, correction, deletion, or export of your data. Contact us for verification.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. International transfers</h2>
            <p className="leading-relaxed">
              Your data may be processed in the United States or other jurisdictions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Children</h2>
            <p className="leading-relaxed">
              Not directed to children under 13. Contact us if data was collected improperly.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Changes</h2>
            <p className="leading-relaxed">
              We may update this policy. Continued use means you accept changes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Contact</h2>
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

export default Privacy;
