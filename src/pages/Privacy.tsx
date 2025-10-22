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
            <ul className="list-disc pl-6 space-y-2 mb-6">
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

            <h3 className="text-xl font-semibold mt-6 mb-3">1.1 Cookies, Analytics & Tracking</h3>
            <p className="leading-relaxed mb-4">
              We use cookies and similar tracking technologies to understand how users interact with Finityo, 
              improve our services, and troubleshoot issues.
            </p>
            
            <h4 className="font-semibold mb-2">What We Track:</h4>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>
                <strong>Session Information:</strong> We track user sessions to maintain your logged-in state 
                and provide a consistent experience. Session IDs are anonymized and do not contain personal information.
              </li>
              <li>
                <strong>Page Views:</strong> We record which pages you visit within Finityo (e.g., dashboard, 
                debt charts, AI advisor) to understand feature usage and improve user experience.
              </li>
              <li>
                <strong>Feature Interactions:</strong> We track when you use specific features (e.g., connecting 
                a bank account, running a debt calculation) to identify popular features and areas for improvement.
              </li>
              <li>
                <strong>Technical Data:</strong> We collect browser type, device type, operating system, screen 
                resolution, and referring website to optimize our service across different platforms.
              </li>
            </ul>

            <h4 className="font-semibold mb-2">What We DON'T Track:</h4>
            <div className="bg-muted p-4 rounded-lg mb-4">
              <p className="font-semibold mb-2">⚠️ Important Privacy Protection</p>
              <ul className="list-disc pl-6 space-y-1 text-sm">
                <li>
                  We <strong>do not</strong> track or log specific financial data (account balances, debt amounts, 
                  institution names, transaction details) in our analytics.
                </li>
                <li>
                  We <strong>do not</strong> send your Plaid-sourced financial information to any analytics service.
                </li>
                <li>
                  We <strong>do not</strong> share identifiable financial data with third-party analytics providers.
                </li>
                <li>
                  Page view tracking only records that you visited a financial page (e.g., "/dashboard"), 
                  not the data displayed on that page.
                </li>
              </ul>
            </div>

            <h4 className="font-semibold mb-2">Analytics Services:</h4>
            <p className="leading-relaxed mb-4">
              We use our own analytics system to track usage patterns. We do not currently use third-party 
              analytics services like Google Analytics. If we add third-party analytics in the future, 
              we will update this policy and ensure financial data remains protected.
            </p>

            <h4 className="font-semibold mb-2">Cookie Types:</h4>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>
                <strong>Essential Cookies:</strong> Required for authentication and core functionality. 
                These cannot be disabled without breaking the service.
              </li>
              <li>
                <strong>Analytics Cookies:</strong> Used to understand usage patterns and improve features. 
                These collect anonymized data only.
              </li>
            </ul>

            <h4 className="font-semibold mb-2">Your Choices:</h4>
            <p className="leading-relaxed mb-2">
              You can control cookies through your browser settings:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-1 text-sm">
              <li>Most browsers allow you to refuse or delete cookies</li>
              <li>You can set your browser to notify you when you receive a cookie</li>
              <li>Browser settings vary; check your browser's help section for instructions</li>
            </ul>
            <p className="text-sm text-muted-foreground mb-4">
              <strong>Note:</strong> Blocking essential cookies may prevent you from using certain features 
              of Finityo, including logging in and connecting financial accounts.
            </p>

            <h4 className="font-semibold mb-2">Do Not Track (DNT):</h4>
            <p className="leading-relaxed">
              Some browsers have a "Do Not Track" feature. While we respect user privacy, we currently 
              do not respond to DNT signals because there is no industry standard for how to interpret them. 
              Our analytics only collect anonymized, non-financial usage data regardless of DNT settings.
            </p>
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
