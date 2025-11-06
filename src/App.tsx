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
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { useAutoLogout } from "@/hooks/useAutoLogout";
import { PlanProvider } from "@/context/PlanContext";

// ✅ Lazy-load pages for better performance
const Index = lazy(() => import("./pages/Index"));
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

import { DemoPlanProvider } from "@/context/DemoPlanContext";

// Demo pages - DemoLayout is NOT lazy-loaded to avoid context issues
import DemoLayout from "./pages/demo/DemoLayout";
const DemoStart = lazy(() => import("./pages/demo/DemoStart"));
const DemoDebts = lazy(() => import("./pages/demo/DemoDebts"));
const DemoPlan = lazy(() => import("./pages/demo/DemoPlan"));
const DemoChart = lazy(() => import("./pages/demo/DemoChart"));
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

const AppRoutes = () => {
  useAutoLogout();
  
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/team-access" element={<TeamAccess />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/debts" element={<Debts />} />
              <Route path="/debt-plan" element={<DebtPlan />} />
              <Route path="/debt-chart" element={<DebtChart />} />
              <Route path="/about" element={<About />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/disclosures" element={<Disclosures />} />
              <Route path="/plaid-submission" element={<PlaidSubmission />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/ai-advisor" element={<AIAdvisor />} />
              <Route path="/plaid-proposal" element={<DownloadPlaidProposal />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/support-dashboard" element={<SupportDashboard />} />
              <Route path="/security-audit" element={<SecurityAudit />} />
              <Route path="/admin/roles" element={<UserRoleManagement />} />
              <Route path="/admin/documents" element={<DocumentExport />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/oauth-redirect" element={<OAuthRedirect />} />
              <Route path="/demo-old" element={<Demo />} />
              <Route path="/demo-test" element={<DemoTest />} />
              <Route path="/install" element={<Install />} />
              <Route path="/payoff-calendar" element={<PayoffCalendar />} />
              <Route path="/printable-summary" element={<PrintableSummary />} />
              <Route path="/mobile-view" element={<MobileView />} />
              <Route path="/debt-plan-new" element={<DebtPlanNew />} />
              <Route path="/debt-chart-new" element={<DebtChartNew />} />
              <Route path="/debt-visualization" element={<DebtVisualization />} />
              
              {/* Demo routes with shared context provider */}
              <Route path="/demo" element={<DemoLayout />}>
                <Route index element={<DemoStart />} />
                <Route path="start" element={<DemoStart />} />
                <Route path="debts" element={<DemoDebts />} />
                <Route path="plan" element={<DemoPlan />} />
                <Route path="chart" element={<DemoChart />} />
              </Route>
              
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
        <PlanProvider>
          {/* ✅ Toast Systems */}
          <Toaster />
          <Sonner />

          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </PlanProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
