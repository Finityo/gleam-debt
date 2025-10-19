import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import TeamAccess from "./pages/TeamAccess";
import Dashboard from "./pages/Dashboard";
import Debts from "./pages/Debts";
import DebtPlan from "./pages/DebtPlan";
import DebtChart from "./pages/DebtChart";
import About from "./pages/About";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Disclosures from "./pages/Disclosures";
import PlaidSubmission from "./pages/PlaidSubmission";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import DownloadPlaidProposal from "./pages/DownloadPlaidProposal";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
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
            <Route path="/plaid-proposal" element={<DownloadPlaidProposal />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
