import React from "react";
import { useNavigate } from "react-router-dom";
import { useNormalizedPlan } from "@/engine/useNormalizedPlan";

export default function PlanPage() {
  const navigate = useNavigate();
  const { plan, months, totals, recompute } = useNormalizedPlan();

  if (!plan) {
    return (
      <div className="p-4">
        {/* TOP NAV */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-md bg-gray-800 text-white"
          >
            Back
          </button>
          <button
            onClick={recompute}
            className="px-4 py-2 rounded-md bg-blue-600 text-white"
          >
            Recalculate
          </button>
        </div>

        <h2 className="text-xl font-semibold mb-2">Debt Plan</h2>
        <p>No plan computed yet.</p>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24">
      {/* TOP NAV */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 rounded-md bg-gray-800 text-white"
        >
          Back
        </button>
        <button
          onClick={recompute}
          className="px-4 py-2 rounded-md bg-blue-600 text-white"
        >
          Recalculate
        </button>
      </div>

      {/* PAGE CONTENT... existing plan UI */}
      {/* Keep your same logic here */}

      {/* BOTTOM STICKY BAR */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 shadow-2xl border-t border-neutral-700 p-3 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 rounded-md bg-gray-800 text-white"
        >
          Back
        </button>
        <button
          onClick={recompute}
          className="px-4 py-2 rounded-md bg-blue-600 text-white"
        >
          Recalculate
        </button>
      </div>
    </div>
  );
}
