import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";

// ===== ROUTE METADATA =====
export const ROUTE_META = [
  { path: "/", title: "Home" },
  { path: "/setup/start", title: "Try Setup" },
  { path: "/pricing", title: "Pricing" },
  { path: "/onboarding", title: "Onboarding" },
  { path: "/blog", title: "Blog" },
  { path: "/resources", title: "Resources" },
  { path: "/auth", title: "Sign In" },
  { path: "/dashboard", title: "Dashboard", protected: true },
  { path: "/debts", title: "Manage Debts", protected: true },
  { path: "/debt-plan", title: "Debt Plan", protected: true },
  { path: "/debt-chart", title: "Payoff Chart", protected: true },
  { path: "/visualization", title: "Debt Visualization", protected: true },
  { path: "/scenarios", title: "Scenarios", protected: true },
  { path: "/financial-insights", title: "Financial Insights", protected: true },
  { path: "/settings", title: "Settings", protected: true },
  { path: "/audit-dashboard", title: "Audit Dashboard", protected: true },
];

// ===== ROUTE SEARCH UTILITY =====
export function searchRoutes(q: string) {
  return ROUTE_META.filter((r) =>
    r.title.toLowerCase().includes(q.toLowerCase())
  );
}

// ===== LOADER =====
const Loader = () => (
  <div className="flex flex-col items-center justify-center h-screen text-center">
    <svg
      className="animate-spin h-10 w-10 text-blue-600 mb-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v8H4z"
      ></path>
    </svg>
    <p className="text-gray-500 dark:text-gray-300">Loading Finityo...</p>
  </div>
);

// ===== CORE (PUBLIC) =====
const Index = lazy(() => import("@/pages/index"));
const PricingNew = lazy(() => import("@/pages/PricingNew"));
const Onboarding = lazy(() => import("@/pages/Onboarding"));
const AuthPage = lazy(() => import("@/pages/auth"));
const Hero = lazy(() => import("@/pages/Hero"));
const About = lazy(() => import("@/pages/About"));
const Privacy = lazy(() => import("@/pages/Privacy"));
const Terms = lazy(() => import("@/pages/Terms"));
const Disclosures = lazy(() => import("@/pages/Disclosures"));
const Blog = lazy(() => import("@/pages/Blog"));
const BlogPost = lazy(() => import("@/pages/BlogPost"));
const BlogList = lazy(() => import("@/pages/BlogList"));
const Resources = lazy(() => import("@/pages/Resources"));
const Sitemap = lazy(() => import("@/pages/Sitemap"));
const Install = lazy(() => import("@/pages/Install"));

// ===== SHARE (PUBLIC) =====
const SharedPlanPage = lazy(() => import("@/pages/p/[id]"));

// ===== AUTH PROTECTED =====
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Debts = lazy(() => import("@/pages/Debts"));
const DebtPlan = lazy(() => import("@/pages/DebtPlan"));
const DebtChart = lazy(() => import("@/pages/DebtChart"));
const DebtVisualization = lazy(() => import("@/pages/DebtVisualization"));
const Settings = lazy(() => import("@/pages/Settings"));
const Profile = lazy(() => import("@/pages/Profile"));
const Scenarios = lazy(() => import("@/pages/Scenarios"));
const AIAdvisor = lazy(() => import("@/pages/AIAdvisor"));
const PayoffCalendar = lazy(() => import("@/pages/PayoffCalendar"));
const SharePreview = lazy(() => import("@/pages/Plan/SharePreview"));

// ===== TEAM PORTAL =====
const TeamLogin = lazy(() => import("@/pages/team/TeamLogin"));
const TeamDashboard = lazy(() => import("@/pages/team/TeamDashboard"));
const TeamUsers = lazy(() => import("@/pages/team/TeamUsers"));
const TeamPlans = lazy(() => import("@/pages/team/TeamPlans"));
const TeamLogs = lazy(() => import("@/pages/team/TeamLogs"));
const TeamAnalytics = lazy(() => import("@/pages/team/TeamAnalytics"));
const TeamSettings = lazy(() => import("@/pages/team/TeamSettings"));
const ShareHistory = lazy(() => import("@/pages/ShareHistory"));
const FinancialInsights = lazy(() => import("@/pages/FinancialInsights"));
const PlanPage = lazy(() => import("@/pages/plan/index"));

// ===== ADMIN =====
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
const SupportDashboard = lazy(() => import("@/pages/SupportDashboard"));
const SecurityAudit = lazy(() => import("@/pages/SecurityAudit"));
const UserRoleManagement = lazy(() => import("@/pages/UserRoleManagement"));
const MyLogs = lazy(() => import("@/pages/MyLogs"));
const AuditDashboard = lazy(() => import("@/pages/AuditDashboard"));

// ===== OTHER =====
const TeamAccess = lazy(() => import("@/pages/TeamAccess"));
const PlaidSubmission = lazy(() => import("@/pages/PlaidSubmission"));
const DownloadPlaidProposal = lazy(() => import("@/pages/DownloadPlaidProposal"));
const DocumentExport = lazy(() => import("@/pages/DocumentExport"));
const OAuthRedirect = lazy(() => import("@/pages/OAuthRedirect"));
const PrintableSummary = lazy(() => import("@/pages/PrintableSummary"));
const DebtsNew = lazy(() => import("@/pages/DebtsNew"));
const PlaidConnect = lazy(() => import("@/features/PlaidConnect"));
const SignIn = lazy(() => import("@/pages/auth/SignIn"));
const SignUp = lazy(() => import("@/pages/auth/SignUp"));
const NotFound = lazy(() => import("@/pages/NotFound"));

export function AppRoutes() {
  return (
    <>
      <AnalyticsTracker />
      <Suspense fallback={<Loader />}>
        <Routes>
          {/* ===== PUBLIC ROUTES ===== */}
          <Route path="/" element={<Hero />} />
          <Route path="/pricing" element={<PricingNew />} />
          <Route path="/about" element={<About />} />
          <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/disclosures" element={<Disclosures />} />
            <Route path="/blog" element={<BlogList />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/sitemap" element={<Sitemap />} />
            <Route path="/install" element={<Install />} />
          
          {/* ===== AUTH ROUTES ===== */}
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/auth/signin" element={<SignIn />} />
          <Route path="/auth/signup" element={<SignUp />} />
          
          {/* ===== ONBOARDING ===== */}
          <Route path="/onboarding" element={<Onboarding />} />
          
          {/* ===== SHARED PLANS (PUBLIC) ===== */}
          <Route path="/p/:id" element={<SharedPlanPage />} />
          
          {/* ===== APP ROUTES ===== */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/debts" element={<Debts />} />
          <Route path="/debt-plan" element={<DebtPlan />} />
          <Route path="/debt-chart" element={<DebtChart />} />
          <Route path="/visualization" element={<DebtVisualization />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/scenarios" element={<Scenarios />} />
          <Route path="/financial-insights" element={<FinancialInsights />} />
          <Route path="/ai-advisor" element={<AIAdvisor />} />
          <Route path="/payoff-calendar" element={<PayoffCalendar />} />
          <Route path="/share/history" element={<ShareHistory />} />
          <Route path="/plan/share" element={<SharePreview />} />
          <Route path="/plan" element={<PlanPage />} />
          
          {/* ===== ADMIN ROUTES ===== */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/roles" element={<UserRoleManagement />} />
          <Route path="/admin/documents" element={<DocumentExport />} />
          <Route path="/support-dashboard" element={<SupportDashboard />} />
          <Route path="/security-audit" element={<SecurityAudit />} />
          <Route path="/audit-dashboard" element={<AuditDashboard />} />
          
          {/* ===== OTHER ===== */}
          <Route path="/team-access" element={<TeamAccess />} />
          <Route path="/plaid-submission" element={<PlaidSubmission />} />
          <Route path="/plaid-proposal" element={<DownloadPlaidProposal />} />
          <Route path="/plaid-connect" element={<PlaidConnect />} />
          <Route path="/oauth-redirect" element={<OAuthRedirect />} />
          <Route path="/printable-summary" element={<PrintableSummary />} />
          <Route path="/debts-new" element={<DebtsNew />} />
          <Route path="/my-logs" element={<MyLogs />} />
          
          {/* ===== TEAM PORTAL ROUTES ===== */}
          <Route path="/team/login" element={<TeamLogin />} />
          <Route path="/team/dashboard" element={<TeamDashboard />} />
          <Route path="/team/users" element={<TeamUsers />} />
          <Route path="/team/plans" element={<TeamPlans />} />
          <Route path="/team/logs" element={<TeamLogs />} />
          <Route path="/team/analytics" element={<TeamAnalytics />} />
          <Route path="/team/settings" element={<TeamSettings />} />
          
          {/* ===== SETUP REDIRECTS (legacy/demo routes) ===== */}
          <Route path="/setup/start" element={<Navigate to="/onboarding" replace />} />
          <Route path="/setup/debts" element={<Navigate to="/debts" replace />} />
          <Route path="/setup/plan" element={<Navigate to="/debt-plan" replace />} />
          <Route path="/setup/chart" element={<Navigate to="/debt-chart" replace />} />
          <Route path="/setup/*" element={<Navigate to="/onboarding" replace />} />
          
          {/* ===== DEMO REDIRECTS (legacy routes) ===== */}
          <Route path="/demo/debts" element={<Navigate to="/debts" replace />} />
          <Route path="/demo/start" element={<Navigate to="/onboarding" replace />} />
          <Route path="/demo/plan" element={<Navigate to="/debt-plan" replace />} />
          <Route path="/demo/chart" element={<Navigate to="/debt-chart" replace />} />
          <Route path="/demo/*" element={<Navigate to="/" replace />} />
          
          {/* ===== FALLBACK ===== */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}
