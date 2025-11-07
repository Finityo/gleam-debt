import { useState } from "react";
import { usePlanLive } from "../context/PlanContextLive";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Share2, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function ShareLive() {
  const { plan, inputs } = usePlanLive();
  const [url, setUrl] = useState("");
  const [pin, setPin] = useState("");
  const [expiresIn, setExpiresIn] = useState(7);
  const [loading, setLoading] = useState(false);

  async function handleShare() {
    if (!plan) {
      toast.error("No plan to share — compute first");
      return;
    }

    setLoading(true);
    try {
      const snapshot = {
        debts: inputs.debts,
        settings: {
          strategy: inputs.strategy,
          extraMonthly: inputs.extraMonthly,
          oneTimeExtra: inputs.oneTimeExtra,
        },
        plan,
      };

      const shareData: any = {
        snapshot,
        expire_at: new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000).toISOString(),
      };

      if (pin) {
        // Simple hash using Web Crypto API
        const encoder = new TextEncoder();
        const data = encoder.encode(pin);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        shareData.pin_hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      }

      const { data, error } = await supabase
        .from("public_shares")
        .insert(shareData)
        .select("id")
        .single();

      if (error) throw error;

      const link = `${window.location.origin}/p/${data.id}`;
      setUrl(link);
      navigator.clipboard.writeText(link);
      toast.success("Link copied to clipboard!");
    } catch (error: any) {
      console.error("Share error:", error);
      toast.error(error.message || "Failed to create share link");
    } finally {
      setLoading(false);
    }
  }

  function copyUrl() {
    if (url) {
      navigator.clipboard.writeText(url);
      toast.success("Link copied!");
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-finityo-textMain mb-2">Share Plan</h1>
      <p className="text-finityo-textBody mb-6">
        Generate a shareable link for your debt payoff plan.
      </p>

      <Card className="p-6 space-y-4">
        <div>
          <Label htmlFor="pin">PIN (optional, for privacy)</Label>
          <Input
            id="pin"
            type="text"
            placeholder="4-digit PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value.slice(0, 4))}
            maxLength={4}
          />
        </div>

        <div>
          <Label htmlFor="expires">Expires in (days)</Label>
          <Input
            id="expires"
            type="number"
            value={expiresIn}
            onChange={(e) => setExpiresIn(Number(e.target.value || 7))}
            min={1}
            max={365}
          />
        </div>

        <Button onClick={handleShare} disabled={loading} className="w-full">
          <Share2 className="h-4 w-4 mr-2" />
          {loading ? "Creating link..." : "Generate Share Link"}
        </Button>

        {url && (
          <div className="mt-4 p-4 border border-border rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <Input value={url} readOnly className="flex-1" />
              <Button variant="outline" size="icon" onClick={copyUrl}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            {pin && (
              <p className="text-xs text-finityo-textBody mt-2">
                Protected with PIN: {pin}
              </p>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
