import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

type PlaidHealth = {
  hasItem: boolean;
  status: "ok" | "warning" | "error" | "none";
  reason?: string;
};

export const ReauthPlaidCard: React.FC = () => {
  const [health, setHealth] = useState<PlaidHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          if (!cancelled) {
            setHealth({ hasItem: false, status: "none" });
            setLoading(false);
          }
          return;
        }

        // Check plaid_items and plaid_item_status tables
        const { data: items } = await supabase
          .from("plaid_items")
          .select("*, plaid_item_status(*)")
          .eq("user_id", user.id);

        if (!cancelled) {
          if (!items || items.length === 0) {
            setHealth({ hasItem: false, status: "none" });
          } else {
            // Check if any items need update
            const needsUpdate = items.some((item: any) => 
              item.plaid_item_status?.needs_update === true
            );
            if (needsUpdate) {
              setHealth({ 
                hasItem: true, 
                status: "warning", 
                reason: "Your bank connection needs to be refreshed." 
              });
            } else {
              setHealth({ hasItem: true, status: "ok" });
            }
          }
        }
      } catch (e) {
        if (!cancelled) {
          setHealth({ hasItem: false, status: "none", reason: "Unable to check connection." });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || !health) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4 text-xs text-muted-foreground md:p-5">
        Checking your bank connection…
      </div>
    );
  }

  if (!health.hasItem) {
    return (
      <div className="rounded-2xl border border-sky-700/60 bg-card p-4 text-xs text-foreground md:p-5">
        <div className="text-sm font-semibold text-sky-300">
          Connect a bank to power your plan
        </div>
        <p className="mt-1 text-muted-foreground">
          You haven&apos;t linked a bank yet. Finityo works best when it can see at least your
          debt accounts.
        </p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => navigate("/setup/start")}
            className="rounded-lg border border-sky-400/70 bg-sky-500/20 px-3 py-1.5 text-[11px] font-semibold text-sky-100 hover:bg-sky-500/30"
          >
            Connect a bank
          </button>
        </div>
      </div>
    );
  }

  if (health.status === "ok") {
    return null;
  }

  const statusColor = health.status === "warning" ? "text-amber-300" : "text-red-300";
  const borderColor = health.status === "warning" ? "border-amber-500/40" : "border-red-500/40";

  return (
    <div className={`rounded-2xl ${borderColor} bg-card p-4 text-xs text-foreground md:p-5`}>
      <div className={`text-sm font-semibold ${statusColor}`}>
        Bank connection needs attention
      </div>
      <p className="mt-1 text-muted-foreground">
        {health.reason || "Your Plaid connection looks like it expired or needs to be refreshed."}
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => navigate("/setup/start")}
          className="rounded-lg border border-sky-400/70 bg-sky-500/20 px-3 py-1.5 text-[11px] font-semibold text-sky-100 hover:bg-sky-500/30"
        >
          Re-link bank
        </button>
      </div>
    </div>
  );
};

export default ReauthPlaidCard;
