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
      className={`px-3 py-1 border rounded ${
        scenario === value ? "bg-black text-white" : "bg-white"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex gap-2 items-center">
      {opt("snowball", "Snowball")}
      {opt("avalanche", "Avalanche")}
      {opt("minimum", "Minimum Only")}
    </div>
  );
}
