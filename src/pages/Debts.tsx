import { useState } from "react";
import { useApp } from "@/context/AppStore";
import AppLayout from "@/layouts/AppLayout";
import { Card } from "@/components/Card";
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
import { Plus, Trash2, Edit2, CreditCard, Download, Upload } from "lucide-react";
import type { Debt } from "@/lib/computeDebtPlan";
import { toast } from "sonner";
import { debtToCSV, downloadCSV, parseExcelFile } from "@/lib/csvExport";
import { DebtQuickEdit } from "@/components/DebtQuickEdit";
import { ExcelImportModal } from "@/components/ExcelImportModal";

export default function DebtsPage() {
  const { state, addDebt, updateDebt, deleteDebt } = useApp();
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [quickEditDebt, setQuickEditDebt] = useState<Debt | null>(null);
  const [showImport, setShowImport] = useState(false);

  function handleAdd() {
    addDebt({
      name: "New Debt",
      balance: 1000,
      apr: 15,
      minPayment: 50,
    });
    toast.success("Debt added");
    setIsOpen(false);
  }

  function handleUpdate() {
    if (!editingDebt) return;
    updateDebt(editingDebt.id, editingDebt);
    toast.success("Debt updated");
    setEditingDebt(null);
  }

  function handleDelete(id: string) {
    if (confirm("Delete this debt?")) {
      deleteDebt(id);
      toast.success("Debt deleted");
    }
  }

  function handleQuickEditSave(debt: Debt) {
    updateDebt(debt.id, debt);
    toast.success("Debt updated");
    setQuickEditDebt(null);
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
        if (state.settings.strategy === "snowball") {
          // Snowball: smallest balance first
          return a.balance - b.balance;
        } else {
          // Avalanche: highest APR first
          return b.apr - a.apr;
        }
      });

      // Add imported debts
      sortedDebts.forEach((debt) => {
        addDebt({
          name: debt.name,
          balance: debt.balance,
          apr: debt.apr,
          minPayment: debt.minPayment,
        });
      });

      setShowImport(false);
      toast.success(
        `Imported ${parsed.length} debt(s) sorted by ${state.settings.strategy} method`
      );
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Failed to import Excel file");
    }
  }

  function handleExportCSV() {
    const csvData = debtToCSV(
      state.debts.map((d) => ({
        name: d.name,
        balance: d.balance,
        apr: d.apr,
        minPayment: d.minPayment,
      }))
    );
    downloadCSV("debts.csv", csvData);
    toast.success("CSV exported");
  }

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <CreditCard className="h-8 w-8" />
              My Debts
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your debt accounts
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowImport(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Import from Excel
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
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

        {state.debts.length === 0 && (
          <Card>
            <div className="text-center py-12">
              <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No debts added yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add your first debt to get started
              </p>
            </div>
          </Card>
        )}

        <div className="grid gap-3">
          {state.debts.map((debt) => (
            <div key={debt.id} className="glass-card p-4 animate-fade-in">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base text-foreground mb-3 truncate">{debt.name}</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-foreground/60 text-xs font-medium mb-0.5">Balance</div>
                      <div className="font-bold text-base bg-gradient-primary bg-clip-text text-transparent">
                        ${debt.balance.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-foreground/60 text-xs font-medium mb-0.5">APR</div>
                      <div className="font-bold text-base text-accent">{debt.apr.toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="text-foreground/60 text-xs font-medium mb-0.5">Min Payment</div>
                      <div className="font-bold text-base text-foreground">
                        ${debt.minPayment.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuickEditDebt(debt)}
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

        {/* Quick Edit Modal */}
        <DebtQuickEdit
          debt={quickEditDebt}
          onClose={() => setQuickEditDebt(null)}
          onSave={handleQuickEditSave}
        />

        {/* Excel Import Modal */}
        <ExcelImportModal
          open={showImport}
          onClose={() => setShowImport(false)}
          onImport={handleImport}
        />
      </div>
    </AppLayout>
  );
}

function DebtForm({
  debt,
  onChange,
  onSubmit,
}: {
  debt?: Debt | null;
  onChange?: (d: Debt) => void;
  onSubmit: () => void;
}) {
  const [local, setLocal] = useState<Partial<Debt>>(
    debt || { name: "", balance: 0, apr: 0, minPayment: 0 }
  );

  function handleChange(field: keyof Debt, value: any) {
    const updated = { ...local, [field]: value };
    setLocal(updated);
    if (onChange && debt) {
      onChange({ ...debt, ...updated });
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
          value={local.balance || 0}
          onChange={(e) => handleChange("balance", Number(e.target.value || 0))}
        />
      </div>

      <div>
        <Label htmlFor="apr">APR (%)</Label>
        <Input
          id="apr"
          type="number"
          step={0.1}
          value={local.apr || 0}
          onChange={(e) => handleChange("apr", Number(e.target.value || 0))}
        />
      </div>

      <div>
        <Label htmlFor="minPayment">Minimum Payment</Label>
        <Input
          id="minPayment"
          type="number"
          value={local.minPayment || 0}
          onChange={(e) => handleChange("minPayment", Number(e.target.value || 0))}
        />
      </div>

      <Button onClick={onSubmit} className="w-full">
        {debt ? "Update" : "Add"} Debt
      </Button>
    </div>
  );
}
