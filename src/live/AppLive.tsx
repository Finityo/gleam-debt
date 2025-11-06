import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { PlanProviderLive } from "./context/PlanContextLive";

const DashboardLive = lazy(() => import("./pages/DashboardLive"));
const DebtsLive = lazy(() => import("./pages/DebtsLive"));
const DebtPlanLive = lazy(() => import("./pages/DebtPlanLive"));
const VisualizationLive = lazy(() => import("./pages/VisualizationLive"));

const Loader = () => (
  <div className="flex flex-col items-center justify-center h-screen text-center">
    <svg className="animate-spin h-10 w-10 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
    </svg>
    <p className="text-gray-500 dark:text-gray-300">Loading Finityo Live...</p>
  </div>
);

const queryClient = new QueryClient();

export default function AppLive() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <PlanProviderLive>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Suspense fallback={<Loader />}>
                <Routes>
                  <Route path="/" element={<DashboardLive />} />
                  <Route path="/debts" element={<DebtsLive />} />
                  <Route path="/plan" element={<DebtPlanLive />} />
                  <Route path="/visualization" element={<VisualizationLive />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </PlanProviderLive>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
