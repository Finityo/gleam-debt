import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FileDown } from "lucide-react";

const PlaidSubmission = () => {
  const handleSavePDF = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        {/* Save as PDF Button - Hidden in print view */}
        <div className="print:hidden mb-8">
          <div className="bg-accent/10 border border-accent/30 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-4">
              <FileDown className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">Save This Document as PDF</h3>
                <p className="text-muted-foreground mb-4">
                  Click the button below to open the print dialog. Select "Save as PDF" as your printer destination to create a PDF file you can submit to Plaid.
                </p>
                <Button onClick={handleSavePDF} size="lg" className="gap-2">
                  <FileDown className="w-4 h-4" />
                  Save as PDF
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Cover Page */}
        <div className="mb-12 text-center page-break-after">
          <h1 className="text-5xl font-bold mb-4">Debt Snowball Planner</h1>
          <h2 className="text-3xl text-muted-foreground mb-8">
            Plaid Production Access Application
          </h2>
          <p className="text-xl mb-4">Application Documentation Package</p>
          <p className="text-lg text-muted-foreground">Submitted: October 15, 2025</p>
          
          <div className="mt-12 bg-muted p-8 rounded-lg inline-block">
            <p className="text-lg font-semibold mb-2">Contact Information</p>
            <p>Email: support@debtsnowball.app</p>
            <p>Website: https://debtsnowball.app</p>
          </div>
        </div>

        {/* Executive Summary */}
        <section className="mb-12 page-break-before">
          <h2 className="text-3xl font-bold mb-6">Executive Summary</h2>
          <Card>
            <CardContent className="p-6 space-y-4">
              <p className="text-lg">
                <strong>Application Name:</strong> Debt Snowball Planner
              </p>
              <p className="text-lg">
                <strong>Purpose:</strong> A comprehensive debt management application that helps users accelerate their journey to financial freedom using proven snowball and avalanche debt payoff strategies.
              </p>
              <p className="text-lg">
                <strong>Plaid Use Case:</strong> Securely connect users' credit card and loan accounts to automatically import debt balances, APRs, minimum payments, and due dates for streamlined debt tracking and payoff planning.
              </p>
              <p className="text-lg">
                <strong>Data Accessed:</strong> Account balances, APRs, minimum payment amounts, due dates, creditor names, and last 4 digits of account numbers.
              </p>
              <p className="text-lg">
                <strong>User Benefit:</strong> Eliminates manual data entry, provides real-time account updates, and delivers personalized debt payoff strategies based on actual financial data.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Detailed Product Description */}
        <section className="mb-12 page-break-before">
          <h2 className="text-3xl font-bold mb-6">Product Description</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-semibold mb-4">Core Features</h3>
              <Card>
                <CardContent className="p-6">
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <span className="font-semibold mr-2">•</span>
                      <div>
                        <strong>Account Connection via Plaid:</strong> Users securely link their credit cards, personal loans, and other debt accounts through Plaid's trusted infrastructure
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold mr-2">•</span>
                      <div>
                        <strong>Snowball & Avalanche Strategies:</strong> Compare and select between debt snowball (smallest balance first) and avalanche (highest APR first) payoff methods
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold mr-2">•</span>
                      <div>
                        <strong>Payoff Calendar:</strong> Month-by-month visualization of debt reduction progress, showing projected payoff dates and cumulative savings
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold mr-2">•</span>
                      <div>
                        <strong>Progress Tracking:</strong> Real-time dashboard displaying total debt, monthly budget allocation, and estimated debt-free date
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold mr-2">•</span>
                      <div>
                        <strong>Export Capabilities:</strong> Generate printable summaries and export data in CSV/Excel formats for record-keeping
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold mr-2">•</span>
                      <div>
                        <strong>Secure Authentication:</strong> Email and phone-based authentication with industry-standard security practices
                      </div>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div>
              <h3 className="text-2xl font-semibold mb-4">How Plaid Integration Works</h3>
              <Card>
                <CardContent className="p-6">
                  <ol className="space-y-3">
                    <li className="flex items-start">
                      <span className="font-semibold mr-3">1.</span>
                      <div>
                        User clicks "Connect Accounts" from the dashboard
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold mr-3">2.</span>
                      <div>
                        Plaid Link interface opens, allowing secure authentication with their financial institution
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold mr-3">3.</span>
                      <div>
                        User selects which debt accounts to connect (credit cards, loans)
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold mr-3">4.</span>
                      <div>
                        Application imports: account name, last 4 digits, current balance, APR, minimum payment, and due date
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold mr-3">5.</span>
                      <div>
                        Debt payoff algorithms calculate optimal payment strategies based on this data
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold mr-3">6.</span>
                      <div>
                        Users receive personalized payoff plans showing exactly how to eliminate debt faster
                      </div>
                    </li>
                  </ol>
                </CardContent>
              </Card>
            </div>

            <div>
              <h3 className="text-2xl font-semibold mb-4">Security & Privacy Commitment</h3>
              <Card>
                <CardContent className="p-6">
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <span className="font-semibold mr-2">•</span>
                      <div>
                        All data encrypted in transit (SSL/TLS) and at rest
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold mr-2">•</span>
                      <div>
                        Row-level security policies ensure users can only access their own data
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold mr-2">•</span>
                      <div>
                        Comprehensive Privacy Policy compliant with CCPA and GDPR principles
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold mr-2">•</span>
                      <div>
                        No sharing of financial data with third parties (except Plaid for account connections)
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold mr-2">•</span>
                      <div>
                        Users maintain full control: can disconnect accounts and delete data at any time
                      </div>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <Separator className="my-12" />

        {/* Application Screenshots */}
        <section className="mb-12 page-break-before">
          <h2 className="text-3xl font-bold mb-6">Application Screenshots</h2>
          
          {/* Landing Page */}
          <div className="mb-10">
            <h3 className="text-2xl font-semibold mb-4">1. Landing Page</h3>
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground mb-4">
                  The landing page introduces users to the debt management system, showcasing key statistics and features. Users can begin their journey by clicking "Get Started Free" or sign in to existing accounts.
                </p>
                <div className="border rounded-lg overflow-hidden bg-muted">
                  <img 
                    src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" 
                    alt="Landing Page Screenshot" 
                    className="w-full"
                    style={{ minHeight: '400px', backgroundColor: '#f0f0f0' }}
                  />
                  <div className="p-4 bg-background">
                    <p className="text-sm font-medium">Key Elements:</p>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                      <li>• Hero section with clear value proposition</li>
                      <li>• Statistics dashboard showing debt tracking capabilities</li>
                      <li>• Feature highlights (Auto-Connect, Snowball & Avalanche, Income Tracking)</li>
                      <li>• Sample debt cards demonstrating the interface</li>
                      <li>• Call-to-action buttons for registration</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Login Page */}
          <div className="mb-10 page-break-before">
            <h3 className="text-2xl font-semibold mb-4">2. Authentication Page</h3>
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground mb-4">
                  Secure authentication interface supporting both email/password and phone number login methods. Users can create new accounts or sign in to existing ones.
                </p>
                <div className="border rounded-lg overflow-hidden bg-muted">
                  <img 
                    src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" 
                    alt="Login Page Screenshot" 
                    className="w-full"
                    style={{ minHeight: '400px', backgroundColor: '#f0f0f0' }}
                  />
                  <div className="p-4 bg-background">
                    <p className="text-sm font-medium">Key Elements:</p>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                      <li>• Email/Password authentication option</li>
                      <li>• Phone number authentication with OTP verification</li>
                      <li>• Tabbed interface for Sign In / Sign Up</li>
                      <li>• Input validation and error handling</li>
                      <li>• Clean, user-friendly design</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Dashboard - Snowball Plan */}
          <div className="mb-10 page-break-before">
            <h3 className="text-2xl font-semibold mb-4">3. Dashboard - Snowball Plan Tab</h3>
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground mb-4">
                  The main dashboard provides a comprehensive debt management interface with tabbed views. The Snowball Plan tab allows users to compare snowball and avalanche strategies and view their prioritized debt list.
                </p>
                <div className="border rounded-lg overflow-hidden bg-muted">
                  <img 
                    src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" 
                    alt="Dashboard Snowball Tab Screenshot" 
                    className="w-full"
                    style={{ minHeight: '400px', backgroundColor: '#f0f0f0' }}
                  />
                  <div className="p-4 bg-background">
                    <p className="text-sm font-medium">Key Elements:</p>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                      <li>• Strategy selector (Snowball vs Avalanche)</li>
                      <li>• Debt table showing creditor, balance, min payment, APR</li>
                      <li>• Estimated payoff timeline for each debt</li>
                      <li>• Color-coded priority system</li>
                      <li>• Plaid connection status and account data display</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Dashboard - Payoff Calendar */}
          <div className="mb-10 page-break-before">
            <h3 className="text-2xl font-semibold mb-4">4. Dashboard - Payoff Calendar Tab</h3>
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground mb-4">
                  The Payoff Calendar provides a month-by-month breakdown of the debt elimination journey, showing cumulative progress and remaining balances.
                </p>
                <div className="border rounded-lg overflow-hidden bg-muted">
                  <img 
                    src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" 
                    alt="Payoff Calendar Screenshot" 
                    className="w-full"
                    style={{ minHeight: '400px', backgroundColor: '#f0f0f0' }}
                  />
                  <div className="p-4 bg-background">
                    <p className="text-sm font-medium">Key Elements:</p>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                      <li>• Month-by-month payment schedule</li>
                      <li>• Debt paid each month</li>
                      <li>• Cumulative payment tracking</li>
                      <li>• Remaining balance projection</li>
                      <li>• Visual progress indicators</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Dashboard - Printable Summary */}
          <div className="mb-10 page-break-before">
            <h3 className="text-2xl font-semibold mb-4">5. Dashboard - Printable Summary Tab</h3>
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground mb-4">
                  The Printable Summary tab offers a clean, creditor-focused report suitable for printing or exporting. Perfect for record-keeping or sharing with financial advisors.
                </p>
                <div className="border rounded-lg overflow-hidden bg-muted">
                  <img 
                    src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" 
                    alt="Printable Summary Screenshot" 
                    className="w-full"
                    style={{ minHeight: '400px', backgroundColor: '#f0f0f0' }}
                  />
                  <div className="p-4 bg-background">
                    <p className="text-sm font-medium">Key Elements:</p>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                      <li>• Creditor name and last 4 digits</li>
                      <li>• Current balance and APR</li>
                      <li>• Minimum payment requirements</li>
                      <li>• Inclusion status in payoff plan</li>
                      <li>• Print-optimized layout</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Dashboard - Mobile View */}
          <div className="mb-10 page-break-before">
            <h3 className="text-2xl font-semibold mb-4">6. Dashboard - Mobile View Tab</h3>
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground mb-4">
                  Touch-optimized mobile interface with larger fonts and spacing for on-the-go debt tracking. Responsive design ensures a seamless experience across all devices.
                </p>
                <div className="border rounded-lg overflow-hidden bg-muted">
                  <img 
                    src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" 
                    alt="Mobile View Screenshot" 
                    className="w-full"
                    style={{ minHeight: '400px', backgroundColor: '#f0f0f0' }}
                  />
                  <div className="p-4 bg-background">
                    <p className="text-sm font-medium">Key Elements:</p>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                      <li>• Card-based layout optimized for mobile</li>
                      <li>• Larger touch targets and fonts</li>
                      <li>• Essential debt information at a glance</li>
                      <li>• Swipe-friendly interface</li>
                      <li>• Responsive design for all screen sizes</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator className="my-12" />

        {/* Privacy Policy Section */}
        <section className="mb-12 page-break-before">
          <h2 className="text-3xl font-bold mb-6">Privacy Policy</h2>
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground mb-4">
                Our complete Privacy Policy is available at: <strong>https://debtsnowball.app/privacy</strong>
              </p>
              <p className="text-muted-foreground mb-6">
                Below is a summary of our key privacy commitments:
              </p>

              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-lg mb-2">Data Collection</h4>
                  <p className="text-muted-foreground">
                    We collect only the information necessary to provide debt management services: user account details (email/phone), and financial account data via Plaid (balances, APRs, minimum payments, creditor names).
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-lg mb-2">Data Usage</h4>
                  <p className="text-muted-foreground">
                    Information is used exclusively to: (1) Calculate personalized debt payoff strategies, (2) Track user progress toward financial goals, (3) Provide customer support, and (4) Improve our services.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-lg mb-2">Data Sharing</h4>
                  <p className="text-muted-foreground">
                    We do not sell user data. Information is shared only with: (1) Plaid for account connections, (2) Cloud infrastructure providers for secure hosting, and (3) As required by law.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-lg mb-2">Security Measures</h4>
                  <p className="text-muted-foreground">
                    All data is encrypted in transit (SSL/TLS) and at rest. We implement row-level security policies, regular security audits, and industry-standard authentication practices including password hashing and optional multi-factor authentication.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-lg mb-2">User Rights</h4>
                  <p className="text-muted-foreground">
                    Users can: (1) Access and update their information anytime, (2) Disconnect financial accounts, (3) Export their data in CSV/Excel, (4) Request account deletion, and (5) Opt-out of non-essential communications.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-lg mb-2">Compliance</h4>
                  <p className="text-muted-foreground">
                    We adhere to CCPA requirements for California residents and follow GDPR principles for data protection. Our practices are regularly reviewed to ensure ongoing compliance.
                  </p>
                </div>
              </div>

              <div className="mt-8 p-4 bg-muted rounded-lg">
                <p className="font-semibold mb-2">Contact for Privacy Inquiries:</p>
                <p className="text-muted-foreground">Email: privacy@debtsnowball.app</p>
                <p className="text-muted-foreground">Support: support@debtsnowball.app</p>
              </div>
            </CardContent>
          </Card>
        </section>

        <Separator className="my-12" />

        {/* Technical Implementation */}
        <section className="mb-12 page-break-before">
          <h2 className="text-3xl font-bold mb-6">Technical Implementation</h2>
          
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold text-lg mb-3">Technology Stack</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• <strong>Frontend:</strong> React, TypeScript, Tailwind CSS</li>
                  <li>• <strong>Backend:</strong> Serverless Edge Functions</li>
                  <li>• <strong>Database:</strong> PostgreSQL with Row-Level Security</li>
                  <li>• <strong>Authentication:</strong> Email/Password and Phone OTP</li>
                  <li>• <strong>Financial Data:</strong> Plaid API Integration</li>
                  <li>• <strong>Hosting:</strong> Cloud infrastructure with automatic scaling</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold text-lg mb-3">Plaid API Usage</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• <strong>Products Used:</strong> Auth, Transactions, Liabilities</li>
                  <li>• <strong>Account Types:</strong> Credit cards, personal loans, lines of credit</li>
                  <li>• <strong>Data Points:</strong> Account name, last 4 digits, balance, APR, minimum payment, due date</li>
                  <li>• <strong>Update Frequency:</strong> On-demand updates when user refreshes</li>
                  <li>• <strong>Token Storage:</strong> Encrypted access tokens stored securely</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold text-lg mb-3">Security Infrastructure</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• All API endpoints require JWT authentication</li>
                  <li>• Input validation using Zod schemas on all edge functions</li>
                  <li>• Row-Level Security ensures data isolation between users</li>
                  <li>• Passwords hashed with bcrypt</li>
                  <li>• CORS properly configured for production domains</li>
                  <li>• Regular security scans and vulnerability assessments</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Closing Statement */}
        <section className="mb-12 page-break-before">
          <h2 className="text-3xl font-bold mb-6">Closing Statement</h2>
          <Card>
            <CardContent className="p-6">
              <p className="text-lg mb-4">
                Debt Snowball Planner is committed to helping users achieve financial freedom through innovative, secure, and user-friendly debt management tools. Our integration with Plaid enables seamless account connectivity while maintaining the highest standards of data security and user privacy.
              </p>
              <p className="text-lg mb-4">
                We have implemented comprehensive security measures, transparent privacy practices, and a robust technical infrastructure to ensure user trust and data protection. Our application serves a genuine need in the personal finance space, empowering individuals to take control of their debt and build better financial futures.
              </p>
              <p className="text-lg mb-6">
                We respectfully request Production access to Plaid's API to serve our growing user base and continue our mission of making debt elimination accessible, trackable, and achievable for everyone.
              </p>
              <div className="mt-8 p-6 bg-muted rounded-lg">
                <p className="font-semibold text-lg mb-2">Thank you for your consideration.</p>
                <p className="text-muted-foreground">Debt Snowball Planner Team</p>
                <p className="text-muted-foreground">support@debtsnowball.app</p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>

      <style>{`
        @media print {
          .print\\:hidden {
            display: none !important;
          }
          .page-break-before {
            page-break-before: always;
          }
          .page-break-after {
            page-break-after: always;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
};

export default PlaidSubmission;