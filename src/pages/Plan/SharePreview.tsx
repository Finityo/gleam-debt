import { useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toPng } from "html-to-image";
import ShareCardPreview from "@/components/share/ShareCardPreview";

/**
 * SharePreview Page
 * - Receives plan/debts from navigation state (from ShareButton).
 * - Renders ShareCardPreview full-screen.
 * - Exports to PNG + native share when available.
 */

export default function SharePreview() {
  const navigate = useNavigate();
  const location = useLocation();
  const cardRef = useRef<HTMLDivElement>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { plan, debts, userName } = (location.state || {}) as any;

  const fileName = useMemo(() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const stamp = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    return `Finityo_Payoff_Summary_${stamp}.png`;
  }, []);

  const exportPng = async () => {
    if (!cardRef.current) return;
    setBusy(true);
    setError(null);
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });
      return dataUrl;
    } catch (e: any) {
      console.error(e);
      setError("Couldn't generate the image. Try again.");
      return null;
    } finally {
      setBusy(false);
    }
  };

  const handleDownload = async () => {
    const dataUrl = await exportPng();
    if (!dataUrl) return;
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleNativeShare = async () => {
    const dataUrl = await exportPng();
    if (!dataUrl) return;

    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], fileName, { type: "image/png" });

      if (navigator.share && (navigator as any).canShare?.({ files: [file] })) {
        await navigator.share({
          title: "My Finityo Debt Plan",
          text: "Here's my Finityo payoff snapshot.",
          files: [file],
        });
      } else {
        await handleDownload();
      }
    } catch (e) {
      await handleDownload();
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <button
            className="text-sm text-muted-foreground hover:text-foreground touch-native"
            onClick={() => navigate(-1)}
          >
            ← Back
          </button>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-2 rounded-lg border border-border bg-card text-sm font-medium hover:bg-accent disabled:opacity-60 touch-native"
              onClick={handleDownload}
              disabled={busy}
            >
              {busy ? "Working…" : "Download PNG"}
            </button>
            <button
              className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-60 touch-native"
              onClick={handleNativeShare}
              disabled={busy}
            >
              {busy ? "Working…" : "Share"}
            </button>
          </div>
        </div>

        {error ? (
          <div className="mb-4 p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-sm">
            {error}
          </div>
        ) : null}

        <div className="flex justify-center">
          <ShareCardPreview ref={cardRef} plan={plan} debts={debts} userName={userName} />
        </div>
      </div>
    </div>
  );
}
