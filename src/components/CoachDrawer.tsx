import { useState, useEffect } from "react";
import { X, MessageSquare } from "lucide-react";
import { Btn } from "./Btn";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type CoachComment = {
  id: string;
  share_id: string;
  coach_name: string;
  comment_text: string;
  resolved: boolean;
  created_at: string;
};

type Props = {
  planId: string;
  coachName?: string;
  open: boolean;
  onClose: () => void;
};

export function CoachDrawer({ planId, coachName = "Coach", open, onClose }: Props) {
  const [comments, setComments] = useState<CoachComment[]>([]);
  const [newText, setNewText] = useState("");
  const [tab, setTab] = useState<"active" | "resolved" | "all">("active");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadComments();
    }
  }, [open, planId]);

  async function loadComments() {
    try {
      const { data, error } = await supabase
        .from("coach_comments")
        .select("*")
        .eq("share_id", planId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (err) {
      console.error("Failed to load comments:", err);
    }
  }

  async function addComment() {
    const text = newText.trim();
    if (!text) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("coach_comments").insert({
        share_id: planId,
        coach_name: coachName,
        comment_text: text,
        resolved: false,
      });

      if (error) throw error;

      setNewText("");
      await loadComments();
      toast({ title: "Suggestion added" });
    } catch (err) {
      console.error("Failed to add comment:", err);
      toast({ title: "Failed to add suggestion", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function toggleResolved(id: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from("coach_comments")
        .update({ resolved: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      await loadComments();
      toast({ title: currentStatus ? "Marked as active" : "Resolved" });
    } catch (err) {
      console.error("Failed to toggle status:", err);
      toast({ title: "Failed to update", variant: "destructive" });
    }
  }

  async function deleteComment(id: string) {
    if (!confirm("Delete this suggestion?")) return;

    try {
      const { error } = await supabase
        .from("coach_comments")
        .delete()
        .eq("id", id);

      if (error) throw error;

      await loadComments();
      toast({ title: "Suggestion deleted" });
    } catch (err) {
      console.error("Failed to delete:", err);
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  }

  const filtered = comments.filter((c) => {
    if (tab === "all") return true;
    if (tab === "active") return !c.resolved;
    return c.resolved;
  });

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/30 z-40 transition-opacity ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside
        className={`fixed right-0 top-0 h-full w-full md:w-[420px] bg-white dark:bg-gray-900 z-50 shadow-2xl transform transition-transform ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <span className="font-semibold">Coach Suggestions</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div
          className="p-4 space-y-4 overflow-y-auto"
          style={{ height: "calc(100% - 64px)" }}
        >
          {/* Tabs */}
          <div className="flex gap-2">
            <Btn
              variant={tab === "active" ? "primary" : "outline"}
              onClick={() => setTab("active")}
              className="flex-1"
            >
              Active ({comments.filter((c) => !c.resolved).length})
            </Btn>
            <Btn
              variant={tab === "resolved" ? "primary" : "outline"}
              onClick={() => setTab("resolved")}
              className="flex-1"
            >
              Resolved ({comments.filter((c) => c.resolved).length})
            </Btn>
            <Btn
              variant={tab === "all" ? "primary" : "outline"}
              onClick={() => setTab("all")}
              className="flex-1"
            >
              All
            </Btn>
          </div>

          {/* New Comment */}
          <div className="bg-white dark:bg-gray-800 border rounded-lg p-4 space-y-3">
            <div className="font-medium text-sm">New Suggestion</div>
            <textarea
              rows={3}
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Type your suggestion…"
              className="w-full border rounded-md p-2 text-sm"
              disabled={loading}
            />
            <Btn
              onClick={addComment}
              disabled={loading || !newText.trim()}
              className="w-full"
            >
              {loading ? "Adding..." : "Add Suggestion"}
            </Btn>
          </div>

          {/* Comments List */}
          <div className="space-y-2">
            {filtered.map((comment) => (
              <div
                key={comment.id}
                className={`border rounded-lg p-3 ${
                  comment.resolved
                    ? "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                    : "bg-white dark:bg-gray-900"
                }`}
              >
                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                  <div>
                    <span className="font-medium">{comment.coach_name}</span>
                    {" · "}
                    <span>{new Date(comment.created_at).toLocaleDateString()}</span>
                  </div>
                  {comment.resolved && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                      ✓ Resolved
                    </span>
                  )}
                </div>

                <div className="text-sm mb-3">{comment.comment_text}</div>

                <div className="flex gap-2">
                  <button
                    onClick={() => toggleResolved(comment.id, comment.resolved)}
                    className="text-xs underline hover:no-underline"
                  >
                    {comment.resolved ? "Mark Active" : "Resolve"}
                  </button>
                  <button
                    onClick={() => deleteComment(comment.id)}
                    className="text-xs underline hover:no-underline text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="text-sm text-gray-500 text-center py-8">
                No {tab !== "all" ? tab : ""} suggestions yet
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
