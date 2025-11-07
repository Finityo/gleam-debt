import { useEffect, useState } from "react";
import { PlanAPI, VersionRecord } from "@/lib/planAPI";
import { useAuth } from "@/context/AuthContext";
import { Btn } from "@/components/Btn";
import { format } from "date-fns";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function VersionDrawer({ open, onClose }: Props) {
  const { user } = useAuth();
  const [versions, setVersions] = useState<VersionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);

  async function loadVersions() {
    if (!user?.id) return;
    setLoading(true);
    try {
      const list = await PlanAPI.listVersions(user.id);
      setVersions(list.reverse()); // newest first
    } finally {
      setLoading(false);
    }
  }

  async function restore(v: VersionRecord) {
    if (!user?.id) return;
    setRestoring(v.versionId);

    try {
      await PlanAPI.restoreVersion(user.id, v.versionId);
      toast.success("Plan restored");
      onClose();
      window.location.reload();
    } catch (err) {
      toast.error("Failed");
    } finally {
      setRestoring(null);
    }
  }

  useEffect(() => {
    if (open) loadVersions();
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* BG */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative ml-auto w-80 h-full bg-[#131313] border-l border-white/10 p-4 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-white">Version History</h2>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-white text-sm"
          >
            ✕
          </button>
        </div>

        {loading && (
          <div className="text-gray-400 text-center mt-10">Loading…</div>
        )}

        {!loading && versions.length === 0 && (
          <div className="text-gray-400 text-center mt-10 text-sm">
            No versions yet
          </div>
        )}

        <div className="space-y-3">
          {versions.map((v) => (
            <div key={v.versionId} className="border border-white/10 p-3 rounded-md bg-white/5">
              <div className="text-white text-sm font-medium">
                {format(new Date(v.createdAt), "MMM d, yyyy • HH:mm")}
              </div>

              <div className="text-xs text-gray-400 mt-1">
                debts: {v.debts?.length ?? 0}
              </div>

              <Btn
                disabled={!!restoring}
                onClick={() => restore(v)}
                className="bg-finityo-cta text-black mt-3 w-full"
              >
                {restoring === v.versionId ? "Restoring…" : "Restore"}
              </Btn>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
