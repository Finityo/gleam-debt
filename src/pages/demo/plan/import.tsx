import { PageShell } from "@/components/PageShell";
import { usePlan } from "@/context/PlanContext";
import { PopIn } from "@/components/Animate";
import { Btn } from "@/components/Btn";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function DemoImportExportPage() {
  const { debts, updateDebts } = usePlan();
  const navigate = useNavigate();

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Stub — Tupac can add SheetJS parsing
    alert("Import stub — Tupac will parse CSV/XLSX here.");
  }

  function handleExport() {
    const blob = new Blob([JSON.stringify(debts, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.download = "debts.json";
    a.href = url;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <PageShell>
      <div className="max-w-xl mx-auto px-4 py-10">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <h1 className="text-3xl font-bold text-finityo-textMain mb-2">
          Import / Export
        </h1>
        <p className="text-finityo-textBody mb-8">
          Load debts from spreadsheet or export your data.
        </p>

        <PopIn>
          <div className="space-y-6">
            <div>
              <Label>Import CSV / XLSX</Label>
              <Input type="file" accept=".csv,.xlsx" onChange={handleImport} />
            </div>

            <div>
              <Btn variant="cta" className="w-full" onClick={handleExport}>
                Export JSON
              </Btn>
            </div>
          </div>
        </PopIn>

        <div className="pt-8">
          <Btn variant="outline" onClick={() => history.back()}>
            Back
          </Btn>
        </div>
      </div>
    </PageShell>
  );
}
