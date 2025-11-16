import React from "react";
import type { ReactNode } from "react";
import type { FeatureKey } from "@/lib/featureFlags";
import { canUseFeature } from "@/lib/featureFlags";
import { PLAN_LABELS } from "@/lib/planTypes";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type PlanGateProps = {
  feature: FeatureKey;
  children: ReactNode;
  compact?: boolean;
};

export const PlanGate: React.FC<PlanGateProps> = ({ feature, children, compact }) => {
  const [profile, setProfile] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const navigate = useNavigate();

  React.useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from("profiles")
            .select("subscription_tier")
            .eq("user_id", user.id)
            .single();
          setProfile(data);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-border bg-card p-4 text-xs text-muted-foreground">
        Loading your access…
      </div>
    );
  }

  const plan = (profile?.subscription_tier ?? "free") as "free" | "essentials" | "ultimate";

  if (canUseFeature(plan, feature)) {
    return <>{children}</>;
  }

  const label = PLAN_LABELS[plan];

  if (compact) {
    return (
      <div className="mt-2 flex items-center justify-between rounded-xl border border-amber-500/50 bg-card px-3 py-2 text-[11px] text-foreground">
        <span>
          This feature is not available on your current plan ({label}).
        </span>
        <button
          type="button"
          onClick={() => navigate("/pricing")}
          className="rounded-lg border border-amber-400/70 bg-amber-500/20 px-2 py-1 text-[11px] font-semibold text-amber-100 hover:bg-amber-500/30"
        >
          View plans
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-amber-500/40 bg-card p-4 text-xs text-foreground md:p-5">
      <div>
        <div className="text-sm font-semibold text-amber-300">
          Upgrade to unlock this feature
        </div>
        <p className="mt-2 text-muted-foreground">
          This part of Finityo is available on the{" "}
          <span className="font-semibold">Essentials</span> and{" "}
          <span className="font-semibold">Ultimate</span> plans. You&apos;re currently on{" "}
          <span className="font-semibold">{label}</span>.
        </p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => navigate("/pricing")}
          className="rounded-lg border border-amber-400/80 bg-amber-500/20 px-3 py-1.5 text-[11px] font-semibold text-amber-100 hover:bg-amber-500/30"
        >
          See what&apos;s included
        </button>
      </div>
    </div>
  );
};

export default PlanGate;
