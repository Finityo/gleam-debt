import { useMemo, useState } from "react";
import { Card } from "./Card";
import { Btn } from "./Btn";
import { toast } from "sonner";

type Props = {
  shareId: string;
};

export function CoachInviteBar({ shareId }: Props) {
  const [name, setName] = useState("");
  
  const inviteUrl = useMemo(() => {
    const base = `${window.location.origin}/p/${shareId}`;
    const qp = name.trim() ? `?coach=${encodeURIComponent(name.trim())}` : "";
    return `${base}${qp}`;
  }, [name, shareId]);

  function copy() {
    navigator.clipboard.writeText(inviteUrl)
      .then(() => toast.success("Link copied to clipboard"))
      .catch(() => toast.error("Failed to copy link"));
  }

  return (
    <Card title="Invite a Coach">
      <div className="grid md:grid-cols-3 gap-2 items-center">
        <div className="md:col-span-1 text-sm text-muted-foreground">
          Coach name (optional)
        </div>
        <div className="md:col-span-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Maria Gomez"
            className="border border-brand-border rounded-base p-2 text-sm w-full bg-background text-foreground"
          />
        </div>
        <div className="md:col-span-3">
          <div className="text-xs text-muted-foreground break-all mb-2">
            {inviteUrl}
          </div>
          <Btn onClick={copy} variant="outline">
            Copy Invite Link
          </Btn>
        </div>
      </div>
    </Card>
  );
}
