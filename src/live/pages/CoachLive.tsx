import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { coachAdd, coachGet, coachToggle, coachDelete, CoachComment } from "@/lib/coach";
import { Lightbulb, Check, X } from "lucide-react";

export default function CoachLive() {
  const [comments, setComments] = useState<CoachComment[]>([]);
  const [text, setText] = useState("");
  const planId = "live-plan"; // For demo purposes

  useEffect(() => {
    loadComments();
  }, []);

  async function loadComments() {
    const data = await coachGet(planId);
    setComments(data);
  }

  async function handleSubmit() {
    if (!text.trim()) {
      toast.error("Please enter a comment");
      return;
    }

    const newComment: CoachComment = {
      id: crypto.randomUUID(),
      coachName: "You",
      text: text.trim(),
      createdAt: new Date().toISOString(),
      resolved: false,
    };

    await coachAdd(planId, newComment);
    setText("");
    await loadComments();
    toast.success("Comment added");
  }

  async function handleToggle(id: string) {
    await coachToggle(planId, id);
    await loadComments();
  }

  async function handleDelete(id: string) {
    if (confirm("Delete this comment?")) {
      await coachDelete(planId, id);
      await loadComments();
      toast.success("Comment deleted");
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-6">
        <Lightbulb className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-finityo-textMain">Coach Mode</h1>
          <p className="text-finityo-textBody">Suggestions and feedback on your plan.</p>
        </div>
      </div>

      <Card className="p-6 mb-6">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment or suggestion..."
          className="min-h-[100px] text-finityo-textMain"
        />
        <div className="mt-4 flex justify-end">
          <Button onClick={handleSubmit}>Add Comment</Button>
        </div>
      </Card>

      <div className="space-y-4">
        {comments.length === 0 ? (
          <Card className="p-12 text-center">
            <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-finityo-textMain">No comments yet</p>
            <p className="text-sm text-finityo-textBody mt-1">
              Start by adding suggestions or feedback
            </p>
          </Card>
        ) : (
          comments.map((comment) => (
            <Card
              key={comment.id}
              className={`p-4 ${comment.resolved ? "opacity-50" : ""}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-finityo-textMain">
                      {comment.coachName}
                    </span>
                    {comment.resolved && (
                      <Badge variant="secondary" className="text-xs">
                        Resolved
                      </Badge>
                    )}
                    <span className="text-xs text-finityo-textBody">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-finityo-textBody">{comment.text}</p>
                  {comment.area && (
                    <p className="text-xs text-finityo-textBody mt-2">
                      {comment.area.type}: {comment.area.label}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleToggle(comment.id)}
                  >
                    {comment.resolved ? (
                      <X className="h-4 w-4" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDelete(comment.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
