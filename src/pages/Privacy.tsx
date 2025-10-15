import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const Privacy = () => {
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

        <div className="prose prose-slate max-w-none dark:prose-invert">
          <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">Last Updated: October 15, 2025</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
            <p>
              Welcome to Debt Snowball Planner ("we," "our," or "us"). We are committed to protecting your privacy and ensuring the security of your personal and financial information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our debt management application and services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
            
            <h3 className="text-xl font-semibold mb-3">Personal Information</h3>
            <p>We collect information that you provide directly to us, including:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Email address and password for account creation</li>
              <li>Phone number (if you choose phone authentication)</li>
              <li>Name and profile information</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">Financial Information via Plaid</h3>
            <p>When you connect your financial accounts through Plaid, we collect:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Credit card account information (creditor name, last 4 digits, balance, APR)</li>
              <li>Loan account information</li>
              <li>Minimum payment amounts and due dates</li>
              <li>Transaction data related to debt accounts</li>
              <li>Account holder information</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">Usage Information</h3>
            <p>We automatically collect certain information about your use of our services:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Device information (browser type, operating system)</li>
              <li>IP address and general location data</li>
              <li>Pages visited and features used</li>
              <li>Date and time of access</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Provide debt management services:</strong> Calculate snowball and avalanche payoff strategies, track your progress, and generate personalized debt payoff plans</li>
              <li><strong>Maintain your account:</strong> Authenticate your identity, manage your preferences, and provide customer support</li>
              <li><strong>Improve our services:</strong> Analyze usage patterns, develop new features, and enhance user experience</li>
              <li><strong>Communicate with you:</strong> Send service updates, security alerts, and respond to your inquiries</li>
              <li><strong>Ensure security:</strong> Detect and prevent fraud, unauthorized access, and other illegal activities</li>
              <li><strong>Comply with legal obligations:</strong> Meet regulatory requirements and respond to legal requests</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">How We Share Your Information</h2>
            
            <h3 className="text-xl font-semibold mb-3">With Your Consent</h3>
            <p>We will share your information with third parties only with your explicit consent.</p>

            <h3 className="text-xl font-semibold mb-3">Service Providers</h3>
            <p>We share information with trusted service providers who assist us in operating our platform:</p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Plaid Technologies, Inc.:</strong> To securely connect and retrieve your financial account information</li>
              <li><strong>Cloud hosting providers:</strong> To store and process your data securely</li>
              <li><strong>Authentication services:</strong> To manage secure user login and access</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">Legal Requirements</h3>
            <p>We may disclose your information if required by law or in response to valid legal processes, such as:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Court orders or subpoenas</li>
              <li>Government or regulatory requests</li>
              <li>To protect our rights, property, or safety, or that of our users</li>
              <li>To prevent fraud or illegal activity</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">Business Transfers</h3>
            <p>In the event of a merger, acquisition, or sale of assets, your information may be transferred to the acquiring entity, subject to the same privacy protections.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
            <p>We implement industry-standard security measures to protect your information:</p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Encryption:</strong> All data is encrypted in transit using SSL/TLS protocols and at rest using industry-standard encryption</li>
              <li><strong>Secure authentication:</strong> Passwords are hashed using bcrypt, and we support multi-factor authentication</li>
              <li><strong>Access controls:</strong> Strict role-based access controls limit who can access your data</li>
              <li><strong>Regular security audits:</strong> We conduct regular security assessments and vulnerability testing</li>
              <li><strong>Plaid security:</strong> Financial data connections are secured through Plaid's bank-level security infrastructure</li>
            </ul>
            <p className="mt-4">
              However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your information, we cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Your Rights and Choices</h2>
            
            <h3 className="text-xl font-semibold mb-3">Access and Update</h3>
            <p>You can access and update your account information at any time through your account settings.</p>

            <h3 className="text-xl font-semibold mb-3">Delete Your Account</h3>
            <p>You may request to delete your account and associated data by contacting us. Note that some information may be retained as required by law or for legitimate business purposes.</p>

            <h3 className="text-xl font-semibold mb-3">Disconnect Financial Accounts</h3>
            <p>You can disconnect linked financial accounts at any time through the dashboard or by revoking access through your financial institution.</p>

            <h3 className="text-xl font-semibold mb-3">Data Portability</h3>
            <p>You can export your debt data in CSV or Excel format at any time.</p>

            <h3 className="text-xl font-semibold mb-3">Opt-Out of Communications</h3>
            <p>You can opt out of non-essential communications through your account preferences. You cannot opt out of service-related or security communications.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Data Retention</h2>
            <p>We retain your information for as long as your account is active or as needed to provide you services. We will retain and use your information as necessary to:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Comply with legal obligations</li>
              <li>Resolve disputes</li>
              <li>Enforce our agreements</li>
              <li>Maintain security and prevent fraud</li>
            </ul>
            <p className="mt-4">
              When you delete your account, we will delete or anonymize your personal information within 30 days, except where retention is required by law.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Third-Party Services</h2>
            
            <h3 className="text-xl font-semibold mb-3">Plaid</h3>
            <p>
              We use Plaid to connect to your financial accounts. When you link an account, you are subject to Plaid's Privacy Policy. Plaid does not share your credentials with us. For more information, visit{" "}
              <a href="https://plaid.com/legal/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                https://plaid.com/legal/
              </a>
            </p>

            <h3 className="text-xl font-semibold mb-3">Links to Other Websites</h3>
            <p>
              Our service may contain links to third-party websites. We are not responsible for the privacy practices or content of these external sites. We encourage you to review their privacy policies.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Children's Privacy</h2>
            <p>
              Our services are not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If you believe we have inadvertently collected information from a child, please contact us immediately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">International Data Transfers</h2>
            <p>
              Your information may be transferred to and maintained on servers located outside of your state, province, country, or other governmental jurisdiction where data protection laws may differ. By using our services, you consent to the transfer of your information to our facilities and service providers.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">California Privacy Rights</h2>
            <p>If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA):</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Right to know what personal information is collected, used, shared, or sold</li>
              <li>Right to delete personal information</li>
              <li>Right to opt-out of the sale of personal information (we do not sell your information)</li>
              <li>Right to non-discrimination for exercising your privacy rights</li>
            </ul>
            <p className="mt-4">To exercise these rights, please contact us using the information below.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. We will notify you of any material changes by posting the new policy on this page and updating the "Last Updated" date. Your continued use of our services after such changes constitutes your acceptance of the updated policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p>If you have questions, concerns, or requests regarding this Privacy Policy or our privacy practices, please contact us at:</p>
            <div className="bg-muted p-6 rounded-lg mt-4">
              <p className="mb-2"><strong>Debt Snowball Planner</strong></p>
              <p className="mb-2">Email: privacy@debtsnowball.app</p>
              <p className="mb-2">Support: support@debtsnowball.app</p>
              <p>Address: [Your Business Address]</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Consent</h2>
            <p>
              By using our services, you acknowledge that you have read and understood this Privacy Policy and agree to its terms. If you do not agree with this policy, please do not use our services.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Privacy;