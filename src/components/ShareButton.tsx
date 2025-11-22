import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Btn } from "@/components/Btn";

export function ShareButton({ snapshot, plan, debts, userName }: { 
  snapshot?: any;
  plan?: any;
  debts?: any[];
  userName?: string;
}) {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");

  async function onShare() {
    try {
      const id = crypto.randomUUID();
      localStorage.setItem(`finityo:snapshot:${id}`, JSON.stringify(snapshot));
      const link = `${window.location.origin}/p/${id}`;
      setUrl(link);
      navigator.clipboard.writeText(link).catch(() => {});
    } catch {}
  }

  function onSharePreview() {
    navigate("/plan/share", { state: { plan, debts, userName } });
  }

  return (
    <div className="space-y-2">
      <Btn onClick={onSharePreview} variant="cta" className="w-full">
        Share as Image
      </Btn>
      <Btn onClick={onShare} variant="outline" className="w-full">
        Share Link
      </Btn>

      {url && (
        <div className="text-xs text-finityo-textBody break-all">
          Copied:
          <div className="text-blue-400 underline">{url}</div>
        </div>
      )}
    </div>
  );
}
