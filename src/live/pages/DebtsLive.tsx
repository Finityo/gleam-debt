import { useState, useEffect } from "react";
import { usePlanLive } from "../context/PlanContextLive";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, Edit2, Download, Upload, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { debtToCSV, downloadCSV, parseExcelFile } from "@/lib/csvExport";
import { supabase } from "@/integrations/supabase/client";
import { PlaidLink } from "@/components/PlaidLink";
import { ExcelImportModal } from "@/components/ExcelImportModal";
import type { DebtInput } from "@/lib/debtPlan";
import * as XLSX from "xlsx";

export default function DebtsLive() {
  const { inputs, setInputs, refreshFromBackend } = usePlanLive();
  const [editingDebt, setEditingDebt] = useState<DebtInput | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    refreshFromBackend();
  }, []);

  function handleAdd(debt: Partial<DebtInput>) {
    const newDebt: DebtInput = {
      id: crypto.randomUUID(),
      name: debt.name || "New Debt",
      balance: debt.balance || 0,
      apr: debt.apr || 0,
      minPayment: debt.minPayment || 0,
      include: true,
    };

    setInputs({ debts: [...inputs.debts, newDebt] });
    toast.success("Debt added");
    setIsOpen(false);
  }

  function handleUpdate(debt: DebtInput) {
    const updated = inputs.debts.map((d) => (d.id === debt.id ? debt : d));
    setInputs({ debts: updated });
    toast.success("Debt updated");
    setEditingDebt(null);
  }

  function handleDelete(id: string) {
    if (confirm("Delete this debt?")) {
      const updated = inputs.debts.filter((d) => d.id !== id);
      setInputs({ debts: updated });
      toast.success("Debt deleted");
    }
  }

  function handleDeleteAll() {
    if (confirm("Delete ALL debts? This cannot be undone.")) {
      setInputs({ debts: [] });
      toast.success("All debts deleted");
    }
  }

  async function handleImport(file: File) {
    try {
      const parsed = await parseExcelFile(file);
      if (parsed.length === 0) {
        toast.error("No valid debts found in Excel file");
        return;
      }

      // Sort based on strategy
      const sortedDebts = parsed.sort((a, b) => {
        if (inputs.strategy === "snowball") {
          // Snowball: smallest balance first
          return a.balance - b.balance;
        } else {
          // Avalanche: highest APR first
          return b.apr - a.apr;
        }
      });

      const imported = sortedDebts.map((d) => ({
        id: crypto.randomUUID(),
        name: d.name,
        balance: d.balance,
        apr: d.apr,
        minPayment: d.minPayment,
        include: true,
      }));

      setInputs({ debts: [...inputs.debts, ...imported] });
      setShowImport(false);
      toast.success(
        `Imported ${parsed.length} debt(s) sorted by ${inputs.strategy} method`
      );
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Failed to import Excel file");
    }
  }

  function handleExportCSV() {
    const csvData = debtToCSV(inputs.debts);
    downloadCSV("debts.csv", csvData);
    toast.success("CSV exported");
  }

  function handleExportJSON() {
    const blob = new Blob([JSON.stringify(inputs.debts, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.download = "debts.json";
    a.href = url;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("JSON exported");
  }

  function handleExportXLSX() {
    const ws = XLSX.utils.json_to_sheet(
      inputs.debts.map((d) => ({
        Name: d.name,
        Balance: d.balance,
        APR: d.apr,
        "Min Payment": d.minPayment,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Debts");
    XLSX.writeFile(wb, "debts.xlsx");
    toast.success("XLSX exported");
  }

  function handleDownloadTemplate() {
    const template = [
      { Name: "Credit Card", Balance: 5000, APR: 18.5, "Min Payment": 150 },
      { Name: "Car Loan", Balance: 15000, APR: 6.5, "Min Payment": 300 },
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "finityo_template.xlsx");
    toast.success("Template downloaded");
  }

  async function handlePlaidImport() {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("plaid-import-debts");
      if (error) throw error;

      if (data?.debts?.length) {
        setInputs({ debts: [...inputs.debts, ...data.debts] });
        toast.success(`Imported ${data.debts.length} debt(s) from Plaid`);
        await refreshFromBackend();
      } else {
        toast.info("No debts found to import");
      }
    } catch (error: any) {
      console.error("Plaid import error:", error);
      toast.error(error.message || "Failed to import from Plaid");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-finityo-textMain">My Debts</h1>
          <p className="text-sm text-finityo-textBody mt-1">Manage your debt accounts</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setShowImport(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Import Excel
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Export Options</DialogTitle>
              </DialogHeader>
              <div className="space-y-2">
                <Button onClick={handleExportCSV} variant="outline" className="w-full">
                  Export as CSV
                </Button>
                <Button onClick={handleExportJSON} variant="outline" className="w-full">
                  Export as JSON
                </Button>
                <Button onClick={handleExportXLSX} variant="outline" className="w-full">
                  Export as XLSX
                </Button>
                <Button onClick={handleDownloadTemplate} variant="secondary" className="w-full">
                  Download Template
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <PlaidLink onSuccess={handlePlaidImport} />

          {inputs.debts.length > 0 && (
            <Button variant="destructive" size="sm" onClick={handleDeleteAll}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete All
            </Button>
          )}

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Debt
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Debt</DialogTitle>
              </DialogHeader>
              <DebtForm onSubmit={handleAdd} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {inputs.debts.length === 0 && (
        <Card className="p-12 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-finityo-textMain">No debts added yet</p>
          <p className="text-sm text-finityo-textBody mt-1">Add your first debt to get started</p>
        </Card>
      )}

      <div className="grid gap-4">
        {inputs.debts.map((debt) => (
          <div key={debt.id} className="glass-card p-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-bold text-xl text-foreground mb-4">{debt.name}</h3>
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <div className="text-foreground/60 text-sm font-medium mb-1">Balance</div>
                    <div className="font-bold text-2xl bg-gradient-primary bg-clip-text text-transparent">
                      ${debt.balance.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-foreground/60 text-sm font-medium mb-1">APR</div>
                    <div className="font-bold text-2xl text-accent">{debt.apr.toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-foreground/60 text-sm font-medium mb-1">Min Payment</div>
                    <div className="font-bold text-2xl text-foreground">
                      ${debt.minPayment.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingDebt(debt)}
                  className="glass hover:shadow-glow"
                >
                  <Edit2 className="h-4 w-4 mr-1" />
                  Edit
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleDelete(debt.id)}
                  className="text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingDebt} onOpenChange={(open) => !open && setEditingDebt(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Debt</DialogTitle>
          </DialogHeader>
          {editingDebt && (
            <DebtForm debt={editingDebt} onSubmit={handleUpdate} />
          )}
        </DialogContent>
      </Dialog>

      {/* Excel Import Modal */}
      <ExcelImportModal
        open={showImport}
        onClose={() => setShowImport(false)}
        onImport={handleImport}
      />
    </div>
  );
}

function DebtForm({
  debt,
  onSubmit,
}: {
  debt?: DebtInput;
  onSubmit: (d: any) => void;
}) {
  const [local, setLocal] = useState<Partial<DebtInput>>(
    debt || { name: "", balance: 0, apr: 0, minPayment: 0 }
  );

  function handleChange(field: keyof DebtInput, value: any) {
    setLocal({ ...local, [field]: value });
  }

  function handleSubmit() {
    if (debt) {
      onSubmit({ ...debt, ...local });
    } else {
      onSubmit(local);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Debt Name</Label>
        <Input
          id="name"
          value={local.name || ""}
          onChange={(e) => handleChange("name", e.target.value)}
          placeholder="Credit Card"
        />
      </div>

      <div>
        <Label htmlFor="balance">Balance</Label>
        <Input
          id="balance"
          type="number"
          value={local.balance || ""}
          onChange={(e) => handleChange("balance", Number(e.target.value || 0))}
        />
      </div>

      <div>
        <Label htmlFor="apr">APR (%)</Label>
        <Input
          id="apr"
          type="number"
          step={0.1}
          value={local.apr || ""}
          onChange={(e) => handleChange("apr", Number(e.target.value || 0))}
        />
      </div>

      <div>
        <Label htmlFor="minPayment">Minimum Payment</Label>
        <Input
          id="minPayment"
          type="number"
          value={local.minPayment || ""}
          onChange={(e) => handleChange("minPayment", Number(e.target.value || 0))}
        />
      </div>

      <Button onClick={handleSubmit} className="w-full">
        {debt ? "Update" : "Add"} Debt
      </Button>
    </div>
  );
}
