// ===================================
// src/components/ScenarioSwitcher.tsx
// ===================================
import React from "react";
import { Scenario } from "@/lib/computeDebtPlan";

type Props = {
  scenario: Scenario;
  onChange: (s: Scenario) => void;
};

export default function ScenarioSwitcher({ scenario, onChange }: Props) {
  const opt = (value: Scenario, label: string) => (
    <button
      key={value}
      onClick={() => onChange(value)}
      className={`px-4 py-2 rounded-md border transition-all duration-200 font-medium ${
        scenario === value
          ? "bg-primary text-primary-foreground border-primary shadow-sm"
          : "bg-background text-foreground border-border hover:bg-accent hover:text-accent-foreground hover:border-accent"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex gap-2 items-center flex-wrap">
      {opt("snowball", "🏂 Snowball")}
      {opt("avalanche", "🏔️ Avalanche")}
      {opt("minimum", "💤 Minimum Only")}
    </div>
  );
}
