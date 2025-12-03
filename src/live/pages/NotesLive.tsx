import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { loadPlanSettings, saveNotes } from "@/lib/planStore";

export default function NotesLive() {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadNotesFromStore();
  }, []);

  async function loadNotesFromStore() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const settings = await loadPlanSettings(user.id);
      setNotes(settings.notes || "");
    } catch (error) {
      console.error("Failed to load notes:", error);
    }
  }

  async function handleSaveNotes() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      await saveNotes(user.id, notes);
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
          <Button onClick={handleSaveNotes} disabled={loading}>
            {loading ? "Saving..." : "Save Notes"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
