import React, { useMemo, useState } from "react";
import { PlanResult } from "@/lib/debtPlan";

type Msg = { role: "user" | "ai"; text: string };

function advise(plan: PlanResult, q: string): string {
  const t = q.toLowerCase();
  const months = plan.totals.monthsToDebtFree;
  const interest = plan.totals.interest;
  const order = [...plan.debts]
    .filter(d => d.included)
    .sort((a,b) =>
      plan.strategy === "snowball"
        ? a.originalBalance - b.originalBalance || b.apr - a.apr
        : b.apr - a.apr || a.originalBalance - b.originalBalance
    )
    .map(d => d.name);

  if (t.includes("which") && (t.includes("first") || t.includes("order") || t.includes("priority"))) {
    return `Based on ${plan.strategy.toUpperCase()}, pay in this order: ${order.join(" → ")}.`;
  }
  if (t.includes("months") || t.includes("long")) {
    return `You'll be debt-free in about ${months} month(s).`;
  }
  if (t.includes("interest") || t.includes("save") || t.includes("savings")) {
    return `Total lifetime interest with this plan is ~$${interest.toFixed(2)}. Increase your extra to reduce it.`;
  }
  if (t.includes("snowball") || t.includes("avalanche")) {
    return `Snowball = fastest wins (motivation). Avalanche = lowest interest cost. You're using ${plan.strategy.toUpperCase()} now.`;
  }
  return `I can explain payoff order, months to debt-free, and interest savings. Try: "Which debt first?" or "How much interest will I pay?"`;
}

export default function AIChatDrawer({ plan }: { plan: PlanResult | null }) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");

  const enabled = !!plan;

  const boot = useMemo(() => {
    if (!plan) return [];
    return [{ role: "ai", text: `Plan ready. Ask me anything about your results.` } as Msg];
  }, [plan]);

  const all = [...boot, ...msgs];

  function send() {
    if (!text.trim() || !plan) return;
    const userMsg: Msg = { role: "user", text: text.trim() };
    const aiMsg: Msg = { role: "ai", text: advise(plan, text) };
    setMsgs(prev => [...prev, userMsg, aiMsg]);
    setText("");
  }

  if (!enabled) {
    return null;
  }

  return (
    <div className="fixed bottom-6 inset-x-0 flex justify-center z-50">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="rounded-2xl fin-card fin-glow px-4 py-2 text-white"
        >
          🤖 Ask Finityo AI
        </button>
      ) : (
        <div className="w-full max-w-xl mx-4 fin-card fin-glow rounded-2xl p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-white font-semibold">Finityo AI</div>
            <button onClick={() => setOpen(false)} className="text-white/60 hover:text-white">✕</button>
          </div>
          <div className="h-60 overflow-y-auto space-y-2 pr-1">
            {all.map((m, i) => (
              <div key={i} className={`${m.role === "ai" ? "text-emerald-300" : "text-white"} text-sm`}>
                <span className="opacity-70 mr-1">{m.role === "ai" ? "AI:" : "You:"}</span>
                {m.text}
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send()}
              placeholder="Ask about payoff order, months, interest…"
              className="flex-1 rounded-xl bg-white/10 text-white px-3 py-2 outline-none placeholder:text-white/50"
            />
            <button onClick={send} className="px-4 py-2 rounded-xl text-white fin-bar">Send</button>
          </div>
        </div>
      )}
    </div>
  );
}
