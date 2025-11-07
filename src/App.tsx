import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { useAutoLogout } from "@/hooks/useAutoLogout";
import { PlanProvider } from "@/context/PlanContext";
import { ScenarioProvider } from "@/context/ScenarioContext";
import { AuthProvider } from "@/context/AuthContext";
import { AppProvider } from "@/context/AppStore";
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <AppProvider>
              <ScenarioProvider>
                <PlanProvider>
                  <AppWrapper />
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
