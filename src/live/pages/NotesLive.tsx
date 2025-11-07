import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function NotesLive() {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadNotes();
  }, []);

  async function loadNotes() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("user_plan_data")
        .select("notes")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      if (data?.notes) setNotes(data.notes);
    } catch (error) {
      console.error("Failed to load notes:", error);
    }
  }

  async function saveNotes() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("user_plan_data")
        .upsert({ user_id: user.id, notes, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);

      if (error) throw error;
      toast.success("Notes saved");
    } catch (error: any) {
      console.error("Failed to save notes:", error);
      toast.error(error.message || "Failed to save notes");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-finityo-textMain mb-2">My Notes</h1>
      <p className="text-finityo-textBody mb-6">
        Keep track of your thoughts, goals, and strategies.
      </p>

      <Card className="p-6">
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Enter your notes here..."
          className="min-h-[300px] text-finityo-textMain"
        />
        <div className="mt-4 flex justify-end">
          <Button onClick={saveNotes} disabled={loading}>
            {loading ? "Saving..." : "Save Notes"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
