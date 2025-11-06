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
                <Route path="/visualization" element={<VisualizationLive />} />
              </Routes>
            </LayoutLive>
          </BrowserRouter>
          <Toaster />
        </PlanProviderLive>
      </QueryClientProvider>
    </>
  );
}
