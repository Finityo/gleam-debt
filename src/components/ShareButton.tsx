import { useState } from "react";
import { Btn } from "@/components/Btn";

export function ShareButton({ snapshot }: { snapshot: any }) {
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

  return (
    <div className="space-y-2">
      <Btn onClick={onShare} variant="cta" className="w-full">
        Share Plan
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
