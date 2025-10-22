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
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const MyData = lazy(() => import("./pages/MyData"));
const NotFound = lazy(() => import("./pages/NotFound"));

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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        {/* ✅ Toast Systems */}
        <Toaster />
        <Sonner />

        <BrowserRouter>
          {/* ✅ Suspense handles lazy page loading */}
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
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/my-data" element={<MyData />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
