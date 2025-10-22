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
            <h2 className="text-2xl font-semibold mb-4">1. Plaid financial data connection</h2>
            
            <h3 className="text-xl font-semibold mt-4 mb-3">What is Plaid?</h3>
            <p className="leading-relaxed mb-4">
              Plaid Technologies, Inc. ("Plaid") is a trusted third-party technology service provider that enables Finityo 
              to securely connect to your financial institution and retrieve your financial data. Plaid is used by thousands 
              of financial applications and is compliant with industry security standards.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">Data Types Collected via Plaid</h3>
            <p className="leading-relaxed mb-4">
              When you connect your financial accounts through Plaid, the following types of data may be accessed:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Account Holder Information:</strong> Your name, contact information (email, phone number, address)</li>
              <li><strong>Account Details:</strong> Account numbers, account types (checking, savings, credit), routing numbers</li>
              <li><strong>Balance Information:</strong> Current balances and available balances</li>
              <li><strong>Transaction History:</strong> Transaction dates, amounts, merchant names, and transaction categories</li>
              <li><strong>Credit Card Information:</strong> Credit card balances, credit limits, Annual Percentage Rates (APRs), minimum payment amounts, and payment due dates</li>
              <li><strong>Student Loan Details:</strong> Loan balances, interest rates, loan servicer information, repayment status</li>
              <li><strong>Mortgage Information:</strong> Mortgage balances, interest rates, payment amounts, property details (if applicable)</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">Purpose of Data Collection</h3>
            <p className="leading-relaxed mb-4">
              This financial data is used <strong>exclusively</strong> to provide you with:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Comprehensive debt tracking across all your financial accounts</li>
              <li>Accurate debt payoff planning using Snowball or Avalanche strategies</li>
              <li>Debt payment timeline calculations and projections</li>
              <li>Visualization of your debt payoff progress</li>
            </ul>
            <p className="leading-relaxed mb-4">
              We do not use your financial data for marketing, selling to third parties, or any purpose other than 
              providing the Finityo debt management service.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">Read-Only Access</h3>
            <div className="bg-muted p-6 rounded-lg mb-4">
              <p className="font-semibold mb-2">⚠️ Important Security Information</p>
              <p className="mb-0">
                Finityo and Plaid have <strong>read-only access</strong> to your financial data. This means:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>We <strong>cannot</strong> move money from your accounts</li>
                <li>We <strong>cannot</strong> make payments or initiate transactions</li>
                <li>We <strong>cannot</strong> change your account settings</li>
                <li>We can <strong>only view</strong> the information described above</li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold mt-6 mb-3">Plaid's Use of Your Data</h3>
            <p className="leading-relaxed mb-4">
              Plaid may use your financial data to:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Provide and maintain the connection between Finityo and your financial institution</li>
              <li>Improve their services and develop new features</li>
              <li>Comply with legal obligations and regulatory requirements</li>
              <li>Detect and prevent fraud or security threats</li>
              <li>As further described in Plaid's End User Privacy Policy</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">Plaid's Security Measures</h3>
            <p className="leading-relaxed mb-4">
              Plaid employs industry-standard security practices to protect your data, including:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Bank-level 256-bit encryption for data transmission</li>
              <li>Multi-factor authentication support</li>
              <li>SOC 2 Type II compliance certification</li>
              <li>Regular security audits and penetration testing</li>
              <li>Compliance with financial industry regulations</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">How to Revoke Access</h3>
            <p className="leading-relaxed mb-4">
              You can revoke Plaid's and Finityo's access to your financial data at any time using these methods:
            </p>
            <ol className="list-decimal pl-6 mb-4 space-y-2">
              <li>
                <strong>Through Finityo Dashboard:</strong>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Log into your Finityo account</li>
                  <li>Navigate to your Dashboard</li>
                  <li>Find the "Connected Accounts" section</li>
                  <li>Click "Remove" or "Disconnect" next to the institution you wish to disconnect</li>
                </ul>
              </li>
              <li>
                <strong>Through My Data Page:</strong>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Visit the "My Data" page (accessible from your Profile)</li>
                  <li>View all connected accounts</li>
                  <li>Click "Disconnect This Account" for any connection you wish to remove</li>
                </ul>
              </li>
              <li>
                <strong>Contact Support:</strong>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Email info@finityo.com with your request</li>
                  <li>We will disconnect your account within 24 hours</li>
                </ul>
              </li>
            </ol>
            <p className="leading-relaxed mb-4">
              After disconnection, we will cease accessing new data immediately. Previously retrieved data will be retained 
              according to our data retention policy (see Privacy Policy Section 5.1).
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">Plaid Contact Information</h3>
            <div className="bg-muted p-6 rounded-lg mb-4">
              <p className="mb-2">For questions about Plaid's privacy practices or to exercise your rights regarding data held by Plaid:</p>
              <ul className="space-y-2">
                <li>
                  <strong>Plaid Privacy Policy:</strong>{" "}
                  <a 
                    href="https://plaid.com/legal/#end-user-privacy-policy" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    https://plaid.com/legal/#end-user-privacy-policy
                  </a>
                </li>
                <li>
                  <strong>Plaid Support:</strong>{" "}
                  <a 
                    href="https://support.plaid.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    https://support.plaid.com/
                  </a>
                </li>
                <li>
                  <strong>Privacy Inquiries:</strong> privacy@plaid.com
                </li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold mt-6 mb-3">Your Rights</h3>
            <p className="leading-relaxed">
              Under Plaid's Privacy Policy, you have certain rights regarding your data, including the right to access, 
              correct, delete, or export your data. Please refer to Plaid's Privacy Policy or contact Plaid directly 
              to exercise these rights with respect to data held by Plaid.
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
