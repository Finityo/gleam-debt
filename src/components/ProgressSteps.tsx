import React from "react";
import { useLocation } from "react-router-dom";

const steps = [
  { path: "/setup/start", label: "Start" },
  { path: "/setup/debts", label: "Debts" },
  { path: "/setup/plan",  label: "Compute" },
  { path: "/setup/chart", label: "Results" },
];

export default function ProgressSteps() {
  const { pathname } = useLocation();
  const index = Math.max(0, steps.findIndex(s => pathname.startsWith(s.path)));
  const pct = ((index + 1) / steps.length) * 100;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between text-white/80 text-xs mb-2">
        {steps.map((s, i) => (
          <div key={s.path} className={`transition-colors ${i <= index ? "text-white" : "text-white/50"}`}>
            {s.label}
          </div>
        ))}
      </div>
      <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
