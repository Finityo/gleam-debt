import { useEffect, useState } from "react";
import { Card } from "./Card";
import { Btn } from "./Btn";
import { SectionLabel } from "./SectionLabel";
import { addCoachComment, getCoachComments, toggleResolved, CoachComment } from "@/lib/coach";

type Props = {
  planId: string;
  coachName: string;
};

export function CoachPanel({ planId, coachName }: Props) {
  const [comments, setComments] = useState<CoachComment[]>([]);
  const [text, setText] = useState("");

  useEffect(() => {
    (async () => {
      setComments(await getCoachComments(planId));
    })();
  }, [planId]);

  async function submit() {
    if (!text.trim()) return;
    const c: CoachComment = {
      id: "c-" + Math.random().toString(36).slice(2, 9),
      coachName,
      text,
      createdAt: new Date().toISOString(),
    };
    await addCoachComment(planId, c);
    setComments(await getCoachComments(planId));
    setText("");
  }

  async function toggle(id: string) {
    await toggleResolved(planId, id);
    setComments(await getCoachComments(planId));
  }

  return (
    <Card title="Coach Suggestions">
      <div className="space-y-3">
        <textarea
          className="w-full border border-brand-border rounded-base p-2 text-sm bg-background text-foreground"
          rows={3}
          placeholder="Leave suggestion..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <Btn onClick={submit}>Add Suggestion</Btn>

        <SectionLabel>All Suggestions</SectionLabel>
        <div className="space-y-2">
          {comments.map((c) => (
            <div
              key={c.id}
              className={`border border-brand-border rounded-base p-3 text-sm ${
                c.resolved ? "bg-muted text-muted-foreground" : "bg-card"
              }`}
            >
              <div className="font-medium">{c.coachName}</div>
              <div className="text-sm mt-1 whitespace-pre-wrap">{c.text}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {new Date(c.createdAt).toLocaleString()}
              </div>

              <button
                className="text-xs underline mt-2 text-primary"
                onClick={() => toggle(c.id)}
              >
                {c.resolved ? "Mark Active" : "Resolve"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
