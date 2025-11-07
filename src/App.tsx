// ==================== src/App.tsx ====================
// 🔧 Main Application Entry Point
// Sets up global providers (React Query, Theme, Tooltip, Toasts)
// and mounts lazy-loaded route pages for performance.
// -----------------------------------------------------

import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { useAutoLogout } from "@/hooks/useAutoLogout";
import { PlanProvider } from "@/context/PlanContext";
import { DemoPlanProvider } from "@/context/DemoPlanContext";
import { ScenarioProvider } from "@/context/ScenarioContext";
import { AuthProvider } from "@/context/AuthContext";
import { AppProvider } from "@/context/AppStore";
import { NotificationsPanel } from "@/components/NotificationsPanel";
import { RequireAuth } from "@/components/RequireAuth";

// ===== Finityo Mode Check =====
console.log("🔍 Finityo Build Mode:", import.meta.env.VITE_MODE);

// ✅ Lazy-load pages for better performance
const Index = lazy(() => import("./pages/Index"));
const Hero = lazy(() => import("./pages/Hero"));
const Auth = lazy(() => import("./pages/Auth"));
const TeamAccess = lazy(() => import("./pages/TeamAccess"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Debts = lazy(() => import("./pages/Debts"));
const DebtPlan = lazy(() => import("./pages/DebtPlan"));
const DebtChart = lazy(() => import("./pages/DebtChart"));
const About = lazy(() => import("./pages/About"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Disclosures = lazy(() => import("./pages/Disclosures"));
const PlaidSubmission = lazy(() => import("./pages/PlaidSubmission"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AIAdvisor = lazy(() => import("./pages/AIAdvisor"));
const DownloadPlaidProposal = lazy(() => import("./pages/DownloadPlaidProposal"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Profile = lazy(() => import("./pages/Profile"));
const SupportDashboard = lazy(() => import("./pages/SupportDashboard"));
const SecurityAudit = lazy(() => import("./pages/SecurityAudit"));
const UserRoleManagement = lazy(() => import("./pages/UserRoleManagement"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const DocumentExport = lazy(() => import("./pages/DocumentExport"));
const OAuthRedirect = lazy(() => import("./pages/OAuthRedirect"));
const Demo = lazy(() => import("./pages/Demo"));
const DemoTest = lazy(() => import("./pages/DemoTest"));
const Install = lazy(() => import("./pages/Install"));
const NotFound = lazy(() => import("./pages/NotFound"));
const PayoffCalendar = lazy(() => import("./pages/PayoffCalendar"));
const PrintableSummary = lazy(() => import("./pages/PrintableSummary"));
const MobileView = lazy(() => import("./pages/Mobile"));
const DebtPlanNew = lazy(() => import("./pages/DebtPlanNew"));
const DebtChartNew = lazy(() => import("./pages/DebtChartNew"));
const DebtVisualization = lazy(() => import("./pages/DebtVisualization"));
const DebtsNew = lazy(() => import("./pages/DebtsNew"));
const PlanSimple = lazy(() => import("./pages/PlanSimple"));
const ChartSimple = lazy(() => import("./pages/ChartSimple"));
const SharedPlan = lazy(() => import("./pages/SharedPlan"));
const ShareHistory = lazy(() => import("./pages/ShareHistory"));
const Scenarios = lazy(() => import("./pages/Scenarios"));
const Settings = lazy(() => import("./pages/Settings"));
const SignIn = lazy(() => import("./pages/auth/SignIn"));
const SignUp = lazy(() => import("./pages/auth/SignUp"));

// Demo pages
const DemoStart = lazy(() => import("./pages/demo/DemoStart"));
const DemoDebts = lazy(() => import("./pages/demo/DemoDebts"));
const DemoPlan = lazy(() => import("./pages/demo/DemoPlan"));
const DemoChart = lazy(() => import("./pages/demo/DemoChart"));
const DemoPlanPowerPack = lazy(() => import("./pages/demo/DemoPlanPowerPack"));
const Sitemap = lazy(() => import("./pages/Sitemap"));

// ✅ Simple branded loading screen
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

const queryClient = new QueryClient();

// Inline demo layout wrapper to avoid bundling issues
const DemoLayoutWrapper = () => (
  <DemoPlanProvider>
    <Suspense fallback={<Loader />}>
      <Outlet />
    </Suspense>
  </DemoPlanProvider>
);

const AppRoutes = () => {
  useAutoLogout();
  
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/hero" element={<Hero />} />
              <Route path="/auth/signin" element={<SignIn />} />
              <Route path="/auth/signup" element={<SignUp />} />
              <Route path="/about" element={<About />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/disclosures" element={<Disclosures />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/install" element={<Install />} />
              <Route path="/p/:id" element={<SharedPlan />} />
              
              {/* Demo routes (public) */}
              <Route path="/demo" element={<DemoLayoutWrapper />}>
                <Route index element={<DemoStart />} />
                <Route path="start" element={<DemoStart />} />
                <Route path="debts" element={<DemoDebts />} />
                <Route path="plan" element={<DemoPlan />} />
                <Route path="chart" element={<DemoChart />} />
                <Route path="power-pack" element={<DemoPlanPowerPack />} />
              </Route>
              
              {/* Protected routes */}
              <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
              <Route path="/auth" element={<RequireAuth><Auth /></RequireAuth>} />
              <Route path="/team-access" element={<RequireAuth><TeamAccess /></RequireAuth>} />
              <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
              <Route path="/debts" element={<RequireAuth><Debts /></RequireAuth>} />
              <Route path="/debt-plan" element={<RequireAuth><DebtPlan /></RequireAuth>} />
              <Route path="/debt-chart" element={<RequireAuth><DebtChart /></RequireAuth>} />
              <Route path="/plaid-submission" element={<RequireAuth><PlaidSubmission /></RequireAuth>} />
              <Route path="/admin" element={<RequireAuth><AdminDashboard /></RequireAuth>} />
              <Route path="/ai-advisor" element={<RequireAuth><AIAdvisor /></RequireAuth>} />
              <Route path="/plaid-proposal" element={<RequireAuth><DownloadPlaidProposal /></RequireAuth>} />
              <Route path="/support-dashboard" element={<RequireAuth><SupportDashboard /></RequireAuth>} />
              <Route path="/security-audit" element={<RequireAuth><SecurityAudit /></RequireAuth>} />
              <Route path="/admin/roles" element={<RequireAuth><UserRoleManagement /></RequireAuth>} />
              <Route path="/admin/documents" element={<RequireAuth><DocumentExport /></RequireAuth>} />
              <Route path="/oauth-redirect" element={<RequireAuth><OAuthRedirect /></RequireAuth>} />
              <Route path="/demo-old" element={<RequireAuth><Demo /></RequireAuth>} />
              <Route path="/demo-test" element={<RequireAuth><DemoTest /></RequireAuth>} />
              <Route path="/payoff-calendar" element={<RequireAuth><PayoffCalendar /></RequireAuth>} />
              <Route path="/printable-summary" element={<RequireAuth><PrintableSummary /></RequireAuth>} />
              <Route path="/mobile-view" element={<RequireAuth><MobileView /></RequireAuth>} />
              <Route path="/debt-plan-new" element={<RequireAuth><DebtPlanNew /></RequireAuth>} />
              <Route path="/debt-chart-new" element={<RequireAuth><DebtChartNew /></RequireAuth>} />
              <Route path="/debt-visualization" element={<RequireAuth><DebtVisualization /></RequireAuth>} />
              <Route path="/debts-new" element={<RequireAuth><DebtsNew /></RequireAuth>} />
              <Route path="/plan-simple" element={<RequireAuth><PlanSimple /></RequireAuth>} />
              <Route path="/chart-simple" element={<RequireAuth><ChartSimple /></RequireAuth>} />
              <Route path="/share/history" element={<RequireAuth><ShareHistory /></RequireAuth>} />
              <Route path="/scenarios" element={<RequireAuth><Scenarios /></RequireAuth>} />
              <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
              
              <Route path="/sitemap" element={<Sitemap />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <AppProvider>
              <ScenarioProvider>
                <PlanProvider>
                  <AppRoutes />
                  <NotificationsPanel />
                  <Toaster />
                  <Sonner />
                </PlanProvider>
              </ScenarioProvider>
            </AppProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
