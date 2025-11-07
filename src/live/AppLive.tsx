import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { PlanProviderLive } from "./context/PlanContextLive";
import { LayoutLive } from "./components/LayoutLive";
import DashboardLive from "./pages/DashboardLive";
import DebtsLive from "./pages/DebtsLive";
import DebtPlanLive from "./pages/DebtPlanLive";
import VisualizationLive from "./pages/VisualizationLive";
import CalendarLive from "./pages/plan/CalendarLive";
import SummaryLive from "./pages/plan/SummaryLive";
import CompareLive from "./pages/plan/CompareLive";
import NotesLive from "./pages/NotesLive";
import BadgesLive from "./pages/BadgesLive";
import ShareLive from "./pages/ShareLive";
import CoachLive from "./pages/CoachLive";
import PricingLive from "./pages/PricingLive";
import AuthLive from "./pages/AuthLive";

const queryClient = new QueryClient();

export default function AppLive() {
  console.log("🔍 Finityo Build Mode:", import.meta.env.VITE_MODE);

  return (
    <>
      {/* ===== LIVE MODE BADGE ===== */}
      <div className="fixed top-2 right-2 px-3 py-1 bg-emerald-600/80 text-white rounded-full text-xs z-50">
        LIVE MODE
      </div>

      <QueryClientProvider client={queryClient}>
        <PlanProviderLive>
          <BrowserRouter>
            <LayoutLive>
              <Routes>
                <Route path="/" element={<DashboardLive />} />
                <Route path="/dashboard" element={<DashboardLive />} />
                <Route path="/debts" element={<DebtsLive />} />
                <Route path="/plan" element={<DebtPlanLive />} />
                <Route path="/plan/calendar" element={<CalendarLive />} />
                <Route path="/plan/summary" element={<SummaryLive />} />
                <Route path="/plan/compare" element={<CompareLive />} />
                <Route path="/visualization" element={<VisualizationLive />} />
                <Route path="/notes" element={<NotesLive />} />
                <Route path="/badges" element={<BadgesLive />} />
                <Route path="/share" element={<ShareLive />} />
                <Route path="/coach" element={<CoachLive />} />
                <Route path="/pricing" element={<PricingLive />} />
                <Route path="/auth" element={<AuthLive />} />
              </Routes>
            </LayoutLive>
          </BrowserRouter>
          <Toaster />
        </PlanProviderLive>
      </QueryClientProvider>
    </>
  );
}
