import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type StrategyChoice = "snowball" | "avalanche";

const Onboarding: React.FC = () => {
  const [step, setStep] = useState(1);
  const [strategy, setStrategy] = useState<StrategyChoice>("snowball");
  const [monthlyExtra, setMonthlyExtra] = useState<string>("100");
  const [goalDate, setGoalDate] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const next = () => setStep((s) => Math.min(4, s + 1));
  const back = () => setStep((s) => Math.max(1, s - 1));

  const completeOnboarding = async () => {
    try {
      setSaving(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Save calculator defaults
      await supabase.from("debt_calculator_settings").upsert(
        {
          user_id: user.id,
          strategy,
          extra_monthly: Number(monthlyExtra) || 0
        },
        { onConflict: "user_id" }
      );

      // Save goal if provided
      if (goalDate) {
        await supabase.from("debt_goals").insert({
          user_id: user.id,
          goal_type: "debt_free_by",
          label: "Initial debt-free target",
          target_date: goalDate,
          status: "active"
        });
      }

      // Mark onboarding complete
      await supabase.from("profiles").update({
        onboarding_completed: true
      }).eq("user_id", user.id);

      toast.success("Onboarding complete!");
      navigate("/dashboard");
    } catch (e: any) {
      setError(e.message ?? "Could not save your onboarding settings.");
      toast.error(e.message ?? "Could not save your onboarding settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8 text-foreground">
      <div className="w-full max-w-3xl rounded-3xl border border-border bg-card p-6 shadow-xl md:p-8">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Welcome to Finityo
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              A few quick steps and your payoff plan will be ready to roll.
            </p>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <span className={`h-1.5 w-5 rounded-full ${step >= 1 ? "bg-cyan-400" : "bg-muted"}`} />
            <span className={`h-1.5 w-5 rounded-full ${step >= 2 ? "bg-cyan-400" : "bg-muted"}`} />
            <span className={`h-1.5 w-5 rounded-full ${step >= 3 ? "bg-cyan-400" : "bg-muted"}`} />
            <span className={`h-1.5 w-5 rounded-full ${step >= 4 ? "bg-cyan-400" : "bg-muted"}`} />
          </div>
        </div>

        {error && (
          <div className="mt-3 rounded-lg bg-red-900/60 p-2 text-[11px] text-red-100">
            {error}
          </div>
        )}

        <div className="mt-4 rounded-2xl bg-muted/50 p-4 text-xs md:p-5">
          {step === 1 && (
            <>
              <h2 className="text-sm font-semibold text-foreground">
                Step 1 — Connect at least one bank or card
              </h2>
              <p className="mt-2 text-muted-foreground">
                Finityo works best when it can see your debt accounts directly through your bank or card provider.
              </p>
              <p className="mt-2 text-muted-foreground">
                You can connect a bank now or skip and add it later. We&apos;ll still build your plan from manually entered debts.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => navigate("/setup/start")}
                  className="rounded-lg border border-cyan-400/80 bg-cyan-500/20 px-3 py-1.5 text-[11px] font-semibold text-cyan-100 hover:bg-cyan-500/30"
                >
                  Connect a bank now
                </button>
                <button
                  type="button"
                  onClick={next}
                  className="rounded-lg border border-border bg-muted px-3 py-1.5 text-[11px] text-foreground hover:bg-muted/80"
                >
                  Skip for now
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-sm font-semibold text-foreground">
                Step 2 — Pick your payoff strategy
              </h2>
              <p className="mt-2 text-muted-foreground">
                Snowball builds momentum by paying off the smallest balances first. Avalanche saves more interest by targeting the highest APRs.
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setStrategy("snowball")}
                  className={`flex flex-col rounded-2xl border px-3 py-3 text-left text-[11px] ${
                    strategy === "snowball"
                      ? "border-cyan-400 bg-cyan-500/10"
                      : "border-border bg-card"
                  }`}
                >
                  <div className="text-xs font-semibold text-foreground">Snowball</div>
                  <p className="mt-1 text-muted-foreground">
                    Target your smallest balances first for quick wins and motivation.
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setStrategy("avalanche")}
                  className={`flex flex-col rounded-2xl border px-3 py-3 text-left text-[11px] ${
                    strategy === "avalanche"
                      ? "border-lime-400 bg-lime-500/10"
                      : "border-border bg-card"
                  }`}
                >
                  <div className="text-xs font-semibold text-foreground">Avalanche</div>
                  <p className="mt-1 text-muted-foreground">
                    Hit the highest interest rates first to minimize total interest paid.
                  </p>
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="text-sm font-semibold text-foreground">
                Step 3 — Extra firepower each month
              </h2>
              <p className="mt-2 text-muted-foreground">
                How much extra can you realistically add on top of your minimum payments each month?
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">$</span>
                <input
                  type="number"
                  min={0}
                  value={monthlyExtra}
                  onChange={(e) => setMonthlyExtra(e.target.value)}
                  className="w-32 rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground outline-none"
                />
                <span className="text-muted-foreground">per month</span>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                You can change this anytime from the plan settings. Even $25–$50 can knock months off your timeline.
              </p>
            </>
          )}

          {step === 4 && (
            <>
              <h2 className="text-sm font-semibold text-foreground">
                Step 4 — Optional target date
              </h2>
              <p className="mt-2 text-muted-foreground">
                If you have a specific date you&apos;d love to be debt free by, set it here. We&apos;ll use it for your Pace Monitor.
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs">
                <input
                  type="date"
                  value={goalDate}
                  onChange={(e) => setGoalDate(e.target.value)}
                  className="rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground outline-none"
                />
                <span className="text-[11px] text-muted-foreground">(optional)</span>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                If you skip this, we&apos;ll still track your progress and projections.
              </p>
            </>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={back}
                className="rounded-lg border border-border bg-card px-3 py-1.5 text-[11px] text-foreground hover:bg-muted"
              >
                Back
              </button>
            )}
          </div>
          <div className="flex gap-2">
            {step < 4 && (
              <button
                type="button"
                onClick={next}
                className="rounded-lg border border-cyan-400/80 bg-cyan-500/20 px-3 py-1.5 text-[11px] font-semibold text-cyan-100 hover:bg-cyan-500/30"
              >
                Next
              </button>
            )}
            {step === 4 && (
              <button
                type="button"
                onClick={completeOnboarding}
                disabled={saving}
                className="rounded-lg border border-lime-400/80 bg-lime-500/20 px-3 py-1.5 text-[11px] font-semibold text-lime-100 hover:bg-lime-500/30 disabled:opacity-60"
              >
                {saving ? "Finishing…" : "Finish and go to dashboard"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
