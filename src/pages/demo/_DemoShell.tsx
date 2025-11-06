import React from "react";
import GlassCard from "@/components/GlassCard";
import { DemoPlanProvider } from "@/context/DemoPlanContext";

export default function DemoShell({ 
  children, 
  title, 
  subtitle 
}: { 
  children: React.ReactNode; 
  title: string; 
  subtitle?: string;
}) {
  return (
    <DemoPlanProvider>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950 dark:via-teal-950 dark:to-cyan-950 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <GlassCard className="mb-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent mb-2">
                {title}
              </h1>
              {subtitle && (
                <p className="text-muted-foreground text-lg">{subtitle}</p>
              )}
            </div>
          </GlassCard>
          
          <div className="space-y-6">
            {children}
          </div>
        </div>
      </div>
    </DemoPlanProvider>
  );
}
