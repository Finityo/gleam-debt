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
            <h2 className="text-2xl font-semibold mb-4">3. Plaid financial data services</h2>
            <p className="leading-relaxed mb-4">
              When you connect your financial accounts through Finityo, we use Plaid Inc. ("Plaid") to facilitate secure, 
              read-only access to your financial data. By using our service to link your financial accounts, you grant 
              Plaid and Finityo the right, power, and authority to access and transmit your personal and financial 
              information from your financial institution according to Plaid's terms and this privacy policy.
            </p>
            <p className="leading-relaxed mb-4">
              Plaid collects data from your financial institution such as account balances, transaction history, 
              account details, and other financial information necessary to provide debt tracking and payoff planning services.
            </p>
            <div className="bg-muted p-6 rounded-lg mb-4">
              <p className="mb-2 font-semibold">
                Plaid's Privacy Policy
              </p>
              <p className="mb-2">
                For information about how Plaid collects, uses, and shares your data, please review Plaid's 
                End User Privacy Policy:
              </p>
              <a 
                href="https://plaid.com/legal/#end-user-privacy-policy" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-primary hover:underline font-medium"
              >
                https://plaid.com/legal/#end-user-privacy-policy
              </a>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Sharing & disclosure</h2>
            <p className="leading-relaxed">
              We do not sell your personal data. We may share with trusted service providers (including Plaid for financial account connections) or disclose if required by law.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Security & retention</h2>
            <p className="leading-relaxed mb-4">
              We use reasonable technical and organizational measures to protect your data, including encryption of sensitive 
              financial information and secure token storage.
            </p>
            
            <h3 className="text-xl font-semibold mt-6 mb-3">5.1 Plaid Data Retention Policy</h3>
            <p className="leading-relaxed mb-4">
              <strong>Active Connections:</strong> Plaid-sourced financial data (account balances, transaction history, account 
              details, and liabilities) is retained for as long as your Finityo account remains active and your Plaid connection 
              is maintained. This data is necessary to provide debt tracking, payoff planning, and strategy calculations.
            </p>
            <p className="leading-relaxed mb-4">
              <strong>Disconnecting Accounts:</strong> You may disconnect any Plaid connection at any time from your Dashboard. 
              Upon disconnection, we will immediately cease accessing new data from that financial institution.
            </p>
            <p className="leading-relaxed mb-4">
              <strong>Post-Disconnection Retention:</strong> Data previously retrieved will be retained for 90 days after 
              disconnection to support any in-progress debt payoff calculations and allow you to export your data. After 90 days, 
              all Plaid-sourced data from that connection will be permanently deleted from our systems.
            </p>
            <p className="leading-relaxed mb-4">
              <strong>Account Closure:</strong> If you delete your Finityo account entirely, all Plaid connections will be 
              immediately terminated and all associated data (including Plaid-sourced financial data, account details, and 
              debt records) will be permanently deleted within 30 days.
            </p>
            <p className="leading-relaxed mb-4">
              <strong>User-Initiated Deletion:</strong> You may request deletion of specific Plaid data at any time by 
              contacting info@finityo.com. We will process deletion requests within 30 days and provide confirmation.
            </p>
            <p className="leading-relaxed mb-4">
              <strong>Secure Token Storage:</strong> Access tokens provided by Plaid are encrypted and stored securely in a vault. 
              These tokens are automatically revoked and deleted when you disconnect an account or close your Finityo account.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">5.2 Security Breach Notification</h3>
            <p className="leading-relaxed mb-4">
              In the event of a security breach involving your personal or financial data (including Plaid-sourced data), we are 
              committed to notifying affected users promptly and transparently.
            </p>
            <p className="leading-relaxed mb-4">
              <strong>Timeline:</strong> We will notify you within 72 hours of discovering a breach that affects your data.
            </p>
            <p className="leading-relaxed mb-4">
              <strong>Notification Method:</strong> You will be notified via email to the address on file. If the breach is 
              widespread, we will also post a prominent notice on our website homepage and within the application dashboard.
            </p>
            <p className="leading-relaxed mb-4">
              <strong>Information Provided:</strong> Our breach notification will include:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>What data was affected (e.g., account information, financial data, personal details)</li>
              <li>When the breach occurred and when it was discovered</li>
              <li>What steps we are taking to address the breach and prevent future incidents</li>
              <li>What steps you should take to protect yourself (e.g., monitoring accounts, changing passwords)</li>
              <li>Contact information for questions and support</li>
            </ul>
            <p className="leading-relaxed mb-4">
              <strong>Your Actions:</strong> If you receive a breach notification from us, we recommend immediately:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Reviewing your financial accounts for any suspicious or unauthorized activity</li>
              <li>Changing your Finityo password and any reused passwords on other services</li>
              <li>Monitoring your credit reports for unusual activity</li>
              <li>Following any specific guidance provided in our notification</li>
            </ul>
            <p className="leading-relaxed">
              <strong>Plaid-Related Breaches:</strong> If Plaid Technologies, Inc. experiences a security breach affecting 
              your data, Plaid will notify users directly according to their breach notification procedures. We will cooperate 
              fully with Plaid to ensure affected users are promptly informed and supported.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Your rights</h2>
            <p className="leading-relaxed">
              You may request access, correction, deletion, or export of your data. Contact us for verification.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. International transfers</h2>
            <p className="leading-relaxed">
              Your data may be processed in the United States or other jurisdictions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Children</h2>
            <p className="leading-relaxed">
              Not directed to children under 13. Contact us if data was collected improperly.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Changes</h2>
            <p className="leading-relaxed">
              We may update this policy. Continued use means you accept changes.
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
              <p className="mb-1 mt-3 text-sm">Privacy Inquiries: info@finityo.com</p>
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

export default Privacy;
