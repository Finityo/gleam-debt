// ===================================
// src/components/ScenarioInfo.tsx
// ===================================
import React, { useState } from "react";

export default function ScenarioInfo() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block text-center">
      <button
        onClick={() => setOpen(!open)}
        className="text-gray-600"
      >
        ⓘ
      </button>
      <p className="text-xs text-gray-500">Strategy info</p>

      {open && (
        <div className="absolute z-10 mt-2 w-64 p-3 bg-white border rounded shadow text-sm space-y-2">
          <div>
            <strong>Snowball</strong><br />
            Start with smallest balances.<br />
            Good when you need momentum + motivation.
          </div>

          <div>
            <strong>Avalanche</strong><br />
            Start with highest interest rates.<br />
            Best for saving the most interest long-term.
          </div>

          <div>
            <strong>Minimum Only</strong><br />
            Slowest + most expensive.<br />
            Pay only minimums → debt lasts much longer.
          </div>
        </div>
      )}
    </div>
  );
}
