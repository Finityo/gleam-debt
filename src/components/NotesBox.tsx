// ===================================
// src/components/NotesBox.tsx
// ===================================
import React from "react";
import { usePlan } from "@/context/PlanContext";

export default function NotesBox() {
  const { notes, setNotes } = usePlan();

  return (
    <div className="p-4 border rounded bg-white space-y-2 max-w-xl">
      <h2 className="text-lg font-semibold">My Notes</h2>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Add thoughts, goals, reminders..."
        className="w-full h-32 border rounded p-2 text-sm"
      />
    </div>
  );
}
