import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { useAutoLogout } from "@/hooks/useAutoLogout";
import { ScenarioProvider } from "@/context/ScenarioContext";
import { AuthProvider } from "@/context/AuthContext";
import { AppProvider, useApp } from "@/context/AppStore";
import { DebtEngineProvider } from "@/engine/DebtEngineContext";
import { NotificationsPanel } from "@/components/NotificationsPanel";
import { NextHandler } from "@/components/NextHandler";
import { AppRoutes } from "@/routes";

const queryClient = new QueryClient();

const AppWrapper = () => {
  useAutoLogout();
  
  return (
    <>
      <NextHandler />
      <AppRoutes />
    </>
  );
};

const EngineLayer = () => {
  const { state } = useApp();
  const debts = state.debts || [];
  const settings = state.settings || {};
  return (
    <DebtEngineProvider debts={debts} settings={settings}>
      <ScenarioProvider>
        <AppWrapper />
        <NotificationsPanel />
        <Toaster />
        <Sonner />
      </ScenarioProvider>
    </DebtEngineProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark" enableSystem={false}>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <AppProvider>
              <EngineLayer />
            </AppProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
