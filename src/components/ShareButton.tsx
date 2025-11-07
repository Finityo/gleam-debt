import { useState } from "react";
import { shareSnapshot } from "@/live/api/share";
import { getBadges } from "@/lib/badges";
import { DebtPlan, Debt, UserSettings } from "@/lib/computeDebtPlan";
import { Button } from "./ui/button";
import { Share2, Check } from "lucide-react";

type Props = {
  plan: DebtPlan;
  debts: Debt[];
  settings: UserSettings;
  notes: string;
};

export default function ShareButton({ plan, debts, settings, notes }: Props) {
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState("");

  async function onShare() {
    try {
      setLoading(true);

      const badges = getBadges(plan);
      const snapshot = { debts, settings, plan, notes, badges };
      const { id } = await shareSnapshot(snapshot);

      const link = `${window.location.origin}/p/${id}`;
      setUrl(link);

      navigator.clipboard.writeText(link).catch(() => {});
    } catch (error) {
      console.error("Share error:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={onShare}
        disabled={loading}
        variant="outline"
        size="sm"
      >
        {url ? (
          <>
            <Check className="h-4 w-4 mr-2" />
            Link Copied!
          </>
        ) : (
          <>
            <Share2 className="h-4 w-4 mr-2" />
            {loading ? "Sharing..." : "Share Plan"}
          </>
        )}
      </Button>

      {url && (
        <div className="text-xs text-muted-foreground">
          <a href={url} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
            {url}
          </a>
        </div>
      )}
    </div>
  );
}
