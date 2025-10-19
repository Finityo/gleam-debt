import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const Terms = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
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
          <p className="text-muted-foreground mb-8">Last Updated: October 19, 2025</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Agreement to Terms</h2>
            <p>
              By accessing or using Finityo ("Service", "we", "our", "us"), you agree to be bound by these Terms of Service. 
              If you disagree with any part of these terms, you may not access the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Description of Service</h2>
            <p>
              Finityo is a debt payoff planning tool that helps users create personalized debt elimination strategies using 
              snowball and avalanche methods. The Service connects to your financial accounts via Plaid to automatically 
              import debt information and generate month-by-month payoff plans.
            </p>
            <p className="mt-4">
              <strong>Important:</strong> Finityo is a planning and tracking tool only. We do not provide financial advice, 
              make payments on your behalf, or manage your accounts. All payment decisions and actions remain your responsibility.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">User Accounts</h2>
            <h3 className="text-xl font-semibold mb-3">Registration</h3>
            <p>To use certain features, you must register for an account. You agree to:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain the security of your password and account</li>
              <li>Accept responsibility for all activities that occur under your account</li>
              <li>Notify us immediately of any unauthorized use</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">Eligibility</h3>
            <p>You must be at least 18 years old to use this Service. By using the Service, you represent that you meet this requirement.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Financial Account Connection</h2>
            <h3 className="text-xl font-semibold mb-3">Plaid Integration</h3>
            <p>
              When you connect your financial accounts through Plaid, you authorize us to access your account information 
              on a read-only basis. We cannot and will not move money, make payments, or modify your accounts.
            </p>

            <h3 className="text-xl font-semibold mb-3">Your Responsibilities</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>You are responsible for maintaining accurate account credentials</li>
              <li>You must disconnect accounts you no longer wish to track</li>
              <li>You agree to review imported data for accuracy</li>
              <li>You remain responsible for making all debt payments on time</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Acceptable Use</h2>
            <p>You agree NOT to:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Use the Service for any illegal purpose or in violation of any laws</li>
              <li>Attempt to gain unauthorized access to our systems or other users' accounts</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Upload viruses, malware, or other malicious code</li>
              <li>Impersonate another person or entity</li>
              <li>Scrape, copy, or distribute content from the Service without permission</li>
              <li>Use automated systems to access the Service without our consent</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Disclaimer of Financial Advice</h2>
            <p>
              <strong>Important Notice:</strong> Finityo is a planning and calculation tool, NOT a financial advisor. 
              We do not provide:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Professional financial advice</li>
              <li>Investment recommendations</li>
              <li>Tax advice</li>
              <li>Legal guidance</li>
              <li>Credit counseling or debt relief services</li>
            </ul>
            <p className="mt-4">
              Our debt payoff calculations are estimates based on mathematical formulas. Actual results may vary based on 
              interest rate changes, fees, additional charges, and your payment behavior. We recommend consulting with a 
              qualified financial professional for personalized advice.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Data Accuracy</h2>
            <p>
              While we strive to provide accurate calculations and data imports, we cannot guarantee 100% accuracy. 
              You are responsible for:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Verifying all imported account information</li>
              <li>Correcting any inaccuracies in your debt data</li>
              <li>Making actual payments to your creditors on time</li>
              <li>Monitoring your actual account balances with your creditors</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Fees and Payment</h2>
            <p>
              Finityo offers both free and paid subscription tiers. Free features may have limitations on the number of 
              debts, exports, or advanced features. Paid subscription terms will be clearly disclosed before purchase.
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>All fees are non-refundable unless required by law</li>
              <li>We reserve the right to change pricing with 30 days notice</li>
              <li>You may cancel your subscription at any time</li>
              <li>Cancellation takes effect at the end of your current billing period</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Intellectual Property</h2>
            <p>
              The Service, including all content, features, functionality, software, and design, is owned by Finityo 
              and protected by copyright, trademark, and other intellectual property laws.
            </p>
            <p className="mt-4">
              You are granted a limited, non-exclusive, non-transferable license to use the Service for personal, 
              non-commercial purposes. You may not reproduce, distribute, modify, or create derivative works without our permission.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, FINITYO SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, 
              CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Loss of profits, revenue, or data</li>
              <li>Missed debt payments or late fees resulting from use of our Service</li>
              <li>Credit score impacts</li>
              <li>Business interruption</li>
              <li>Errors or inaccuracies in calculations</li>
            </ul>
            <p className="mt-4">
              OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless Finityo, its affiliates, officers, directors, employees, and agents 
              from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Your use or misuse of the Service</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any third-party rights</li>
              <li>Your financial decisions based on information from the Service</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Termination</h2>
            <p>
              We may terminate or suspend your account and access to the Service immediately, without prior notice, for:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Violation of these Terms</li>
              <li>Suspected fraudulent, abusive, or illegal activity</li>
              <li>Extended periods of inactivity</li>
              <li>At our sole discretion for any reason</li>
            </ul>
            <p className="mt-4">
              Upon termination, your right to use the Service will immediately cease. You may request a copy of your data 
              within 30 days of termination.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. Material changes will be notified via email or 
              prominent notice within the Service. Your continued use after changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Dispute Resolution</h2>
            <h3 className="text-xl font-semibold mb-3">Governing Law</h3>
            <p>
              These Terms shall be governed by the laws of [Your State/Country], without regard to conflict of law provisions.
            </p>

            <h3 className="text-xl font-semibold mb-3">Arbitration</h3>
            <p>
              Any dispute arising from these Terms or the Service shall be resolved through binding arbitration, 
              except that either party may seek injunctive relief in court for intellectual property or confidentiality breaches.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
            <p>For questions about these Terms, contact us at:</p>
            <div className="bg-muted p-6 rounded-lg mt-4">
              <p className="mb-2"><strong>Finityo</strong></p>
              <p className="mb-2">Email: legal@finityo-debt.com</p>
              <p className="mb-2">Support: support@finityo-debt.com</p>
              <p>Website: https://finityo-debt.com</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Severability</h2>
            <p>
              If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited 
              to the minimum extent necessary, and the remaining provisions will remain in full force and effect.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Entire Agreement</h2>
            <p>
              These Terms, together with our Privacy Policy, constitute the entire agreement between you and Finityo 
              regarding the use of the Service.
            </p>
          </section>
        </article>
      </div>
    </div>
  );
};

export default Terms;
