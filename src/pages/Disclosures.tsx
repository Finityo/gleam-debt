import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Lock, Eye } from "lucide-react";

const Disclosures = () => {
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
          <h1 className="text-4xl font-bold mb-2">Important Disclosures</h1>
          <p className="text-muted-foreground mb-8">Last Updated: October 19, 2025</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              Security & Data Protection
            </h2>
            
            <h3 className="text-xl font-semibold mb-3">Read-Only Access</h3>
            <div className="bg-accent/10 border-l-4 border-accent p-4 rounded mb-4">
              <p className="font-semibold text-accent mb-2">Your funds are safe. We cannot move money.</p>
              <p>
                Finityo uses read-only access to your financial accounts through Plaid. This means:
              </p>
              <ul className="list-disc pl-6 mt-2">
                <li>We can ONLY view account information (balances, APRs, minimum payments)</li>
                <li>We CANNOT initiate transfers, make payments, or withdraw funds</li>
                <li>We CANNOT change account settings or modify your accounts</li>
                <li>Your login credentials are NEVER stored by Finityo</li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold mb-3">Bank-Level Security</h3>
            <p>We implement industry-standard security measures:</p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>256-bit SSL encryption:</strong> All data transmitted between your device and our servers is encrypted</li>
              <li><strong>Data encryption at rest:</strong> Your financial information is encrypted in our secure databases</li>
              <li><strong>Secure authentication:</strong> Multi-factor authentication and OAuth 2.0 protocols</li>
              <li><strong>Regular security audits:</strong> Third-party penetration testing and vulnerability assessments</li>
              <li><strong>Compliance:</strong> We adhere to SOC 2 Type II standards and data protection regulations</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">Plaid Security</h3>
            <p>
              Plaid is used by thousands of financial apps including Venmo, Betterment, and Acorns. When you connect through Plaid:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Your credentials go directly to Plaid, not through Finityo</li>
              <li>Plaid uses bank-level 256-bit encryption</li>
              <li>Plaid never stores your username and password</li>
              <li>You can revoke access at any time through your bank or Plaid</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Eye className="w-6 h-6 text-primary" />
              Not a Financial Advisor
            </h2>
            
            <div className="bg-warning/10 border-l-4 border-warning p-4 rounded mb-4">
              <p className="font-semibold text-warning-foreground mb-2">Important: Finityo is a planning tool, not financial advice.</p>
              <p>
                We provide debt payoff calculations and planning tools, but we do not offer professional financial, 
                investment, tax, or legal advice.
              </p>
            </div>

            <h3 className="text-xl font-semibold mb-3">What We Provide</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>Mathematical calculations for debt payoff strategies (snowball and avalanche methods)</li>
              <li>Visual tracking and progress monitoring tools</li>
              <li>Automated import of debt account information</li>
              <li>Export capabilities for your financial data</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">What We Don't Provide</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>Personalized financial advice tailored to your specific situation</li>
              <li>Investment recommendations or portfolio management</li>
              <li>Tax planning or preparation services</li>
              <li>Credit repair or debt negotiation services</li>
              <li>Legal advice or representation</li>
              <li>Bankruptcy counseling</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">Consult a Professional</h3>
            <p>
              We strongly recommend consulting with qualified professionals for:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Financial Planning:</strong> Work with a Certified Financial Planner (CFP) for comprehensive financial advice</li>
              <li><strong>Debt Relief:</strong> Contact a certified credit counselor or debt management service for negotiation help</li>
              <li><strong>Tax Matters:</strong> Consult a CPA or tax professional about debt-related tax implications</li>
              <li><strong>Legal Issues:</strong> Speak with an attorney about bankruptcy, garnishment, or legal matters</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Accuracy of Information</h2>
            
            <h3 className="text-xl font-semibold mb-3">Calculation Estimates</h3>
            <p>Our debt payoff calculations are estimates based on:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Current balance, APR, and minimum payment information</li>
              <li>Assumption of consistent monthly payments</li>
              <li>Mathematical formulas for interest accrual</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">Variables That May Affect Accuracy</h3>
            <div className="bg-muted p-4 rounded mb-4">
              <p className="mb-2"><strong>Actual results may differ due to:</strong></p>
              <ul className="list-disc pl-6">
                <li>Interest rate changes (variable APR accounts)</li>
                <li>Additional fees, late charges, or penalties</li>
                <li>New purchases or balance transfers</li>
                <li>Changes in minimum payment requirements</li>
                <li>Promotional rate expirations</li>
                <li>Inconsistent payment amounts or timing</li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold mb-3">Your Responsibility</h3>
            <p>You are responsible for:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Verifying all imported account data for accuracy</li>
              <li>Updating information when rates or balances change</li>
              <li>Making actual payments to your creditors</li>
              <li>Monitoring your accounts directly with your financial institutions</li>
              <li>Reviewing monthly statements from your creditors</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Lock className="w-6 h-6 text-primary" />
              Data Privacy & Sharing
            </h2>
            
            <h3 className="text-xl font-semibold mb-3">How We Use Your Data</h3>
            <p>We collect and use your financial data solely to:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Provide debt payoff calculations and planning services</li>
              <li>Display your debts, balances, and payment schedules</li>
              <li>Generate progress reports and visualizations</li>
              <li>Export data in formats you request (CSV, PDF, Excel)</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">We Do NOT:</h3>
            <div className="bg-destructive/10 border-l-4 border-destructive p-4 rounded mb-4">
              <ul className="list-disc pl-6">
                <li><strong>Sell your data:</strong> We never sell, rent, or trade your personal or financial information</li>
                <li><strong>Share with marketers:</strong> Your data is not shared with advertisers or marketing companies</li>
                <li><strong>Share with creditors:</strong> We do not report to credit bureaus or share data with your creditors</li>
                <li><strong>Use for advertising:</strong> We don't use your financial data for targeted advertising</li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold mb-3">Third-Party Services</h3>
            <p>We share limited data with:</p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Plaid:</strong> To connect your financial accounts (subject to Plaid's privacy policy)</li>
              <li><strong>Cloud hosting:</strong> Secure servers that store encrypted data (AWS, Google Cloud, or similar)</li>
              <li><strong>Analytics:</strong> Anonymous usage data to improve our service (no personal financial data)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Limitations of Service</h2>
            
            <h3 className="text-xl font-semibold mb-3">What Finityo Does Not Do</h3>
            <div className="bg-muted p-4 rounded mb-4">
              <ul className="list-disc pl-6">
                <li>Make payments on your behalf</li>
                <li>Contact or negotiate with creditors</li>
                <li>Consolidate or refinance debt</li>
                <li>Repair or improve your credit score</li>
                <li>Provide credit counseling or debt management services</li>
                <li>Guarantee debt elimination or specific timelines</li>
                <li>Prevent collection actions by creditors</li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold mb-3">User Responsibilities</h3>
            <p>To successfully pay off debt using Finityo, you must:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Continue making all minimum payments on time</li>
              <li>Follow through with the payment plan you create</li>
              <li>Monitor your accounts for changes in rates or fees</li>
              <li>Avoid accumulating new debt while paying off existing debts</li>
              <li>Update your plan when circumstances change</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">No Guarantee of Results</h2>
            <p>
              While the snowball and avalanche methods are proven debt elimination strategies, Finityo cannot guarantee:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>That you will become debt-free by a specific date</li>
              <li>Specific savings on interest payments</li>
              <li>Improvements to your credit score</li>
              <li>That creditors won't change terms, rates, or fees</li>
              <li>Protection from collection activities or legal action</li>
            </ul>
            <p className="mt-4">
              Your success depends on your commitment to the plan, consistency in payments, and financial discipline.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Affiliate & Partner Disclosures</h2>
            <p>
              Finityo may display information about debt consolidation, credit cards, or other financial products. 
              Some of these may be affiliate partnerships where we receive compensation if you apply or sign up. 
              These recommendations do not constitute financial advice, and you should research products independently.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Contact & Support</h2>
            <p>
              For questions about security, data privacy, or service limitations, please contact us:
            </p>
            <div className="bg-muted p-6 rounded-lg mt-4">
              <p className="mb-2"><strong>Finityo Support</strong></p>
              <p className="mb-2">Email: support@finityo-debt.com</p>
              <p className="mb-2">Security: security@finityo-debt.com</p>
              <p className="mb-2">Privacy: privacy@finityo-debt.com</p>
              <p>Website: https://finityo-debt.com</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Updates to Disclosures</h2>
            <p>
              We may update these disclosures from time to time. Material changes will be posted on this page with 
              an updated "Last Updated" date. We encourage you to review this page periodically.
            </p>
          </section>
        </article>
      </div>
    </div>
  );
};

export default Disclosures;
