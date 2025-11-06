import React from "react";
import { useNavigate } from "react-router-dom";
import DemoShell from "./_DemoShell";
import { PopIn } from "@/components/Animate";
import { Rocket, TrendingDown, Calculator, BarChart3 } from "lucide-react";

export default function DemoStart() {
  const nav = useNavigate();
  
  return (
    <DemoShell 
      title="Finityo Investor Demo" 
      subtitle="Experience our powerful debt freedom engine"
    >
      <PopIn>
        <div className="space-y-6">
          <div className="text-center">
            <div className="inline-flex p-4 rounded-2xl bg-white/20 backdrop-blur-sm mb-4 border border-white/30">
              <Rocket className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 drop-shadow-sm">
              Welcome to Your Debt Freedom Journey
            </h2>
            <p className="text-white/80 max-w-2xl mx-auto">
              This interactive demo showcases Finityo&apos;s proprietary debt payoff engine. 
              See how we turn complex financial data into clear, actionable paths to debt freedom.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 mt-8">
            <div className="p-4 rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-400/30 border border-emerald-300/40">
                  <TrendingDown className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Smart Debt Analysis</h3>
                  <p className="text-sm text-white/70">
                    Enter your debts and let our engine find the optimal payoff strategy
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-cyan-400/30 border border-cyan-300/40">
                  <Calculator className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Real-Time Computation</h3>
                  <p className="text-sm text-white/70">
                    See instant calculations comparing snowball vs avalanche methods
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-teal-400/30 border border-teal-300/40">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Visual Insights</h3>
                  <p className="text-sm text-white/70">
                    Beautiful charts showing your path to becoming debt-free
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-indigo-400/30 border border-indigo-300/40">
                  <Rocket className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">AI-Powered Advice</h3>
                  <p className="text-sm text-white/70">
                    Get personalized recommendations after your plan is generated
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 rounded-xl bg-white/10 border border-white/30 backdrop-blur-sm">
            <p className="text-sm text-center text-white/80">
              <strong className="text-white">Note:</strong> This demo uses sample data to showcase our technology. 
              Real user data is securely encrypted and never shared.
            </p>
          </div>

          <div className="text-center mt-8">
            <button
              onClick={() => nav("/demo/debts")}
              className="px-6 py-3 rounded-2xl text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:brightness-110 transition-all text-lg font-semibold"
            >
              Start Demo
            </button>
          </div>
        </div>
      </PopIn>
    </DemoShell>
  );
}
