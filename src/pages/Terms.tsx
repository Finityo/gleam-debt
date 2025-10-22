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
            
            <h3 className="text-xl font-semibold mt-6 mb-3">2.5 Third-Party Financial Data Services (Plaid)</h3>
            <p className="leading-relaxed mb-4">
              When you use Finityo to link your financial accounts, you grant Finityo and Plaid Technologies, Inc. ("Plaid") 
              the right, power, and authority to act on your behalf to access and transmit your personal and financial information 
              from the relevant financial institution according to Plaid's terms and this agreement.
            </p>
            <p className="leading-relaxed mb-4">
              By connecting your financial accounts through Finityo, you explicitly authorize:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Finityo to access your financial institution data via Plaid's services</li>
              <li>Plaid to retrieve your financial data (account details, balances, transactions, and liabilities) from your financial institution on Finityo's behalf</li>
              <li>Your financial institution to share your data with Plaid as requested by Finityo</li>
              <li>Read-only access limited to the specific purposes described in our Privacy Policy and Disclosures</li>
            </ul>
            <p className="leading-relaxed mb-4">
              This authorization is limited to:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Retrieving account holder information (name, contact details)</li>
              <li>Account details (account numbers, types, routing numbers)</li>
              <li>Balance information (current and available balances)</li>
              <li>Transaction history</li>
              <li>Liability information (credit card balances, APRs, payment due dates, student loans, mortgages)</li>
            </ul>
            <p className="leading-relaxed mb-4">
              <strong>No Payment Capability:</strong> Neither Finityo nor Plaid can move money, make payments, or initiate 
              transactions from your accounts. Access is strictly read-only.
            </p>
            <div className="bg-muted p-6 rounded-lg mb-4">
              <p className="font-semibold mb-2">Plaid's Terms and Privacy</p>
              <p className="mb-2">
                By connecting accounts via Plaid, you also agree to Plaid's End User Services Agreement and acknowledge 
                Plaid's privacy practices:
              </p>
              <ul className="space-y-2">
                <li>
                  <a 
                    href="https://plaid.com/legal/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-medium"
                  >
                    Plaid End User Services Agreement
                  </a>
                </li>
                <li>
                  <a 
                    href="https://plaid.com/legal/#end-user-privacy-policy" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-medium"
                  >
                    Plaid End User Privacy Policy
                  </a>
                </li>
              </ul>
            </div>
            <p className="leading-relaxed">
              You acknowledge that Plaid may use your financial data to provide and improve their services, comply with 
              legal obligations, and as described in Plaid's Privacy Policy. You have the right to revoke this authorization 
              at any time by disconnecting your accounts through Finityo's dashboard or contacting us at info@finityo.com.
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
              <p className="mb-2 font-semibold">Finityo</p>
              <p className="mb-1"><em>Business entity registration pending - currently in beta testing phase</em></p>
              <p className="mb-1">
                Email:{" "}
                <a href="mailto:info@finityo.com" className="text-primary hover:underline">
                  info@finityo.com
                </a>
              </p>
              <p className="mb-1">State: Texas</p>
              <p className="mb-0 text-sm text-muted-foreground mt-2">
                Full legal entity details will be updated upon official company registration.
              </p>
            </div>
          </section>
        </article>
      </div>
    </div>
  );
};

export default Terms;
