import { useRef } from "react";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Download, Upload, Database } from "lucide-react";
import { toast } from "sonner";

// Validation schema for imported data
const importSchema = z.object({
  debts: z.array(z.any()).optional(),
  settings: z.any().optional(),
  notes: z.string().optional(),
  scenarios: z.array(z.any()).optional(),
});

type Props = {
  getState: () => any;
  setState: (s: any) => void;
};

export function DataPorter({ getState, setState }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  function exportJSON() {
    try {
      const state = getState();
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `Finityo_Backup_${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success("Backup exported successfully");
    } catch (e) {
      console.error("Export failed:", e);
      toast.error("Failed to export backup");
    }
  }

  function importJSON(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large (max 10MB)");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result);
        const obj = JSON.parse(text);

        // Validate structure
        importSchema.parse(obj);

        setState(obj);
        toast.success("Backup restored successfully");
      } catch (e) {
        console.error("Import failed:", e);
        if (e instanceof z.ZodError) {
          toast.error("Invalid backup file format");
        } else if (e instanceof SyntaxError) {
          toast.error("Invalid JSON file");
        } else {
          toast.error("Failed to restore backup");
        }
      }
    };
    reader.onerror = () => {
      toast.error("Failed to read file");
    };
    reader.readAsText(file);

    // Reset input
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Backup & Restore
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Export your data to a JSON file for backup, or restore from a previous backup.
        </p>
        <div className="flex gap-2">
          <Button onClick={exportJSON} variant="outline" className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            Export Backup
          </Button>
          <Button
            onClick={() => inputRef.current?.click()}
            variant="outline"
            className="flex-1"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import Backup
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={importJSON}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          ⚠️ Importing will replace all current data. Export a backup first!
        </p>
      </CardContent>
    </Card>
  );
}
