import { useState, useEffect } from "react";
import { Card } from "./Card";
import { Btn } from "./Btn";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type CoachComment = {
  id: string;
  share_id: string;
  coach_name: string;
  comment_text: string;
  created_at: string;
  resolved: boolean;
};

type Props = {
  shareId: string;
  coachName?: string;
};

export function CoachSuggestions({ shareId, coachName = "Coach" }: Props) {
  const [comments, setComments] = useState<CoachComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadComments();
  }, [shareId]);

  async function loadComments() {
    try {
      const { data, error } = await supabase
        .from("coach_comments")
        .select("*")
        .eq("share_id", shareId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setComments((data as any) || []);
    } catch (err) {
      console.error("Failed to load comments:", err);
    }
  }

  async function addComment() {
    const text = newComment.trim();
    if (!text) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("coach_comments")
        .insert({
          share_id: shareId,
          coach_name: coachName,
          comment_text: text,
          resolved: false
        } as any);

      if (error) throw error;

      setNewComment("");
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
        .update({ resolved: !currentStatus } as any)
        .eq("id", id);

      if (error) throw error;

      await loadComments();
      toast({ title: currentStatus ? "Marked as active" : "Resolved" });
    } catch (err) {
      console.error("Failed to toggle status:", err);
      toast({ title: "Failed to update status", variant: "destructive" });
    }
  }

  return (
    <Card title="Coach Suggestions">
      <div className="space-y-3">
        <div>
          <textarea
            rows={3}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Leave a suggestion for improvement..."
            className="w-full border rounded-base p-2 text-sm"
          />
          <div className="mt-2">
            <Btn onClick={addComment} disabled={loading || !newComment.trim()}>
              Add Suggestion
            </Btn>
          </div>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {comments.length === 0 ? (
            <div className="text-sm text-gray-500 py-4 text-center">
              No suggestions yet
            </div>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className={`border rounded-base p-3 ${
                  comment.resolved ? "glass text-muted-foreground" : "glass-intense"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="text-xs text-gray-500">
                    <span className="font-medium">{comment.coach_name}</span>
                    {" · "}
                    {new Date(comment.created_at).toLocaleDateString()}
                  </div>
                  {comment.resolved && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                      Resolved
                    </span>
                  )}
                </div>
                <p className="text-sm mb-2">{comment.comment_text}</p>
                <Btn
                  variant="outline"
                  className="text-xs"
                  onClick={() => toggleResolved(comment.id, comment.resolved)}
                >
                  {comment.resolved ? "Mark Active" : "Resolve"}
                </Btn>
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
}
