import React from "react";
import DemoShell from "./_DemoShell";
import GlassCard from "@/components/GlassCard";
import NextBack from "@/components/NextBack";
import { Rocket, TrendingDown, Calculator, BarChart3 } from "lucide-react";

export default function DemoStart() {
  return (
    <DemoShell 
      title="Finityo Investor Demo" 
      subtitle="Experience our powerful debt freedom engine"
    >
      <GlassCard>
        <div className="space-y-6">
          <div className="text-center">
            <div className="inline-flex p-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 mb-4">
              <Rocket className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Welcome to Your Debt Freedom Journey
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              This interactive demo showcases Finityo's proprietary debt payoff engine. 
              See how we turn complex financial data into clear, actionable paths to debt freedom.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 mt-8">
            <div className="p-4 rounded-xl border border-border/50 bg-card/50">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/20">
                  <TrendingDown className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Smart Debt Analysis</h3>
                  <p className="text-sm text-muted-foreground">
                    Enter your debts and let our engine find the optimal payoff strategy
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-border/50 bg-card/50">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/20">
                  <Calculator className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Real-Time Computation</h3>
                  <p className="text-sm text-muted-foreground">
                    See instant calculations comparing snowball vs avalanche methods
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-border/50 bg-card/50">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900/20">
                  <BarChart3 className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Visual Insights</h3>
                  <p className="text-sm text-muted-foreground">
                    Beautiful charts showing your path to becoming debt-free
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-border/50 bg-card/50">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                  <Rocket className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">AI-Powered Advice</h3>
                  <p className="text-sm text-muted-foreground">
                    Get personalized recommendations after your plan is generated
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border border-emerald-500/20">
            <p className="text-sm text-center text-muted-foreground">
              <strong className="text-foreground">Note:</strong> This demo uses sample data to showcase our technology. 
              Real user data is securely encrypted and never shared.
            </p>
          </div>
        </div>

        <NextBack next="/demo/debts" />
      </GlassCard>
    </DemoShell>
  );
}
