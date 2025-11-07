import React, { useState } from "react";
import { MonthDrawer } from "@/components/MonthDrawer";

const money = (n: number) => "$" + (n ?? 0).toLocaleString();

export function PlanList({ plan }: { plan: any }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMonth, setDrawerMonth] = useState<any>(null);

  const openMonth = (m: any) => {
    setDrawerMonth(m);
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-3">
      {plan?.months?.map((m: any) => (
        <button
          key={m.monthIndex}
          onClick={() => openMonth(m)}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3
                     hover:bg-white/10 transition text-left"
        >
          <div className="flex justify-between items-center">
            <div className="text-finityo-textMain font-medium">
              Month {m.monthIndex + 1}
            </div>
            <div className="text-sm text-finityo-primary">
              Remaining: {money(m.remaining)}
            </div>
          </div>
        </button>
      ))}

      <MonthDrawer
        open={drawerOpen}
        month={drawerMonth}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
