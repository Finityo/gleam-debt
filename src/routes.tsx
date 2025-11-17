import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { Suspense, lazy } from "react";
import { DemoPlanProvider } from "@/context/DemoPlanContext";
import { RequireAuth } from "@/components/RequireAuth";
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

// ===== DEMO (PUBLIC) =====
const DemoStart = lazy(() => import("@/pages/demo/start"));
const DemoDebts = lazy(() => import("@/pages/demo/debts"));
const DemoPlan = lazy(() => import("@/pages/demo/plan"));
const DemoChart = lazy(() => import("@/pages/demo/chart"));
const DemoPowerPack = lazy(() => import("@/pages/demo/DemoPlanPowerPack"));
const DemoCalendar = lazy(() => import("@/pages/demo/plan/calendar"));
const DemoSummary = lazy(() => import("@/pages/demo/plan/summary"));
const DemoCompare = lazy(() => import("@/pages/demo/plan/compare"));
const DemoImportExport = lazy(() => import("@/pages/demo/plan/import"));

// ===== CORE (PUBLIC) =====
const Index = lazy(() => import("@/pages/index"));
const Pricing = lazy(() => import("@/pages/pricing"));
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

// ===== ADMIN =====
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
const SupportDashboard = lazy(() => import("@/pages/SupportDashboard"));
const SecurityAudit = lazy(() => import("@/pages/SecurityAudit"));
const UserRoleManagement = lazy(() => import("@/pages/UserRoleManagement"));

// ===== OTHER =====
const TeamAccess = lazy(() => import("@/pages/TeamAccess"));
const PlaidSubmission = lazy(() => import("@/pages/PlaidSubmission"));
const DownloadPlaidProposal = lazy(() => import("@/pages/DownloadPlaidProposal"));
const DocumentExport = lazy(() => import("@/pages/DocumentExport"));
const OAuthRedirect = lazy(() => import("@/pages/OAuthRedirect"));
const PrintableSummary = lazy(() => import("@/pages/PrintableSummary"));
const MobileView = lazy(() => import("@/pages/Mobile"));
const DebtsNew = lazy(() => import("@/pages/DebtsNew"));
const PlaidConnect = lazy(() => import("@/features/PlaidConnect"));
const SignIn = lazy(() => import("@/pages/auth/SignIn"));
const SignUp = lazy(() => import("@/pages/auth/SignUp"));
const NotFound = lazy(() => import("@/pages/NotFound"));

// Demo layout wrapper
const DemoLayoutWrapper = () => (
  <DemoPlanProvider>
    <Suspense fallback={<Loader />}>
      <Outlet />
    </Suspense>
  </DemoPlanProvider>
);

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
          
          {/* ===== SETUP FLOW (PUBLIC) ===== */}
          <Route path="/setup" element={<DemoLayoutWrapper />}>
            <Route index element={<DemoStart />} />
            <Route path="start" element={<DemoStart />} />
            <Route path="debts" element={<DemoDebts />} />
            <Route path="plan" element={<DemoPlan />} />
            <Route path="plan/calendar" element={<DemoCalendar />} />
            <Route path="plan/summary" element={<DemoSummary />} />
            <Route path="plan/compare" element={<DemoCompare />} />
            <Route path="plan/import" element={<DemoImportExport />} />
            <Route path="chart" element={<DemoChart />} />
            <Route path="power-pack" element={<DemoPowerPack />} />
          </Route>
          
          {/* ===== SHARED PLANS (PUBLIC) ===== */}
          <Route path="/p/:id" element={<SharedPlanPage />} />
          
          {/* ===== PROTECTED ROUTES ===== */}
          <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/debts" element={<RequireAuth><Debts /></RequireAuth>} />
          <Route path="/debt-plan" element={<RequireAuth><DebtPlan /></RequireAuth>} />
          <Route path="/debt-chart" element={<RequireAuth><DebtChart /></RequireAuth>} />
          <Route path="/visualization" element={<RequireAuth><DebtVisualization /></RequireAuth>} />
          <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
          <Route path="/scenarios" element={<RequireAuth><Scenarios /></RequireAuth>} />
          <Route path="/financial-insights" element={<RequireAuth><FinancialInsights /></RequireAuth>} />
          <Route path="/ai-advisor" element={<RequireAuth><AIAdvisor /></RequireAuth>} />
          <Route path="/payoff-calendar" element={<RequireAuth><PayoffCalendar /></RequireAuth>} />
          <Route path="/share/history" element={<RequireAuth><ShareHistory /></RequireAuth>} />
          
          {/* ===== ADMIN ROUTES ===== */}
          <Route path="/admin" element={<RequireAuth><AdminDashboard /></RequireAuth>} />
          <Route path="/admin/roles" element={<RequireAuth><UserRoleManagement /></RequireAuth>} />
          <Route path="/admin/documents" element={<RequireAuth><DocumentExport /></RequireAuth>} />
          <Route path="/support-dashboard" element={<RequireAuth><SupportDashboard /></RequireAuth>} />
          <Route path="/security-audit" element={<RequireAuth><SecurityAudit /></RequireAuth>} />
          
          {/* ===== OTHER PROTECTED ===== */}
          <Route path="/team-access" element={<RequireAuth><TeamAccess /></RequireAuth>} />
          <Route path="/plaid-submission" element={<RequireAuth><PlaidSubmission /></RequireAuth>} />
          <Route path="/plaid-proposal" element={<RequireAuth><DownloadPlaidProposal /></RequireAuth>} />
          <Route path="/plaid-connect" element={<RequireAuth><PlaidConnect /></RequireAuth>} />
          <Route path="/oauth-redirect" element={<RequireAuth><OAuthRedirect /></RequireAuth>} />
          <Route path="/printable-summary" element={<RequireAuth><PrintableSummary /></RequireAuth>} />
          <Route path="/mobile-view" element={<RequireAuth><MobileView /></RequireAuth>} />
          <Route path="/debts-new" element={<RequireAuth><DebtsNew /></RequireAuth>} />
          
          {/* ===== TEAM PORTAL ROUTES ===== */}
          <Route path="/team/login" element={<TeamLogin />} />
          <Route path="/team/dashboard" element={<TeamDashboard />} />
          <Route path="/team/users" element={<TeamUsers />} />
          <Route path="/team/plans" element={<TeamPlans />} />
          <Route path="/team/logs" element={<TeamLogs />} />
          <Route path="/team/analytics" element={<TeamAnalytics />} />
          <Route path="/team/settings" element={<TeamSettings />} />
          
          {/* ===== FALLBACK ===== */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}
