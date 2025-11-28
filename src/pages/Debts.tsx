// =======================================================
// FILE: src/pages/Debts.tsx
// Unified debts page: select all, bulk edit, manual ordering,
// inline category editing, import/export, quick edit.
// =======================================================

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUnifiedPlan } from "@/engine/useUnifiedPlan";
import { usePlan } from "@/context/PlanContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Trash2,
  Pencil,
  FileSpreadsheet,
  Download,
  Upload,
  ListChecks,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

import {
  debtToCSV,
  downloadCSV,
  parseExcelFile,
  downloadTemplate,
  exportDebtsToXLSX,
} from "@/lib/csvExport";

import type { DebtInput } from "@/lib/debtPlan";
import { DebtQuickEdit } from "@/components/DebtQuickEdit";
import { ExcelImportModal } from "@/components/ExcelImportModal";
import { BulkDebtEditor } from "@/components/BulkDebtEditor";

export default function DebtsPage() {
  const { debtsUsed, settingsUsed } = useUnifiedPlan();
  const { updateDebts, reset } = usePlan();
  
  const debts = debtsUsed;
  const settings = settingsUsed;
  const navigate = useNavigate();

  const [quickEditDebt, setQuickEditDebt] = useState<DebtInput | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulk, setShowBulk] = useState(false);

  // ---------------------------------------------------------------------------
  // Selection helpers (including Select All)
  // ---------------------------------------------------------------------------

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    );
  };

  const isAllSelected = debts.length > 0 && selectedIds.length === debts.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(debts.map(d => d.id));
    }
  };

  const clearSelection = () => setSelectedIds([]);

  // ---------------------------------------------------------------------------
  // Manual ordering helpers (array-order based)
  // ---------------------------------------------------------------------------

  const moveDebt = (id: string, direction: "up" | "down") => {
    if (debts.length < 2) return;

    const index = debts.findIndex(d => d.id === id);
    if (index === -1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= debts.length) return;

    const next = [...debts];
    const temp = next[targetIndex];
    next[targetIndex] = next[index];
    next[index] = temp;

    updateDebts(next);
  };

  // ---------------------------------------------------------------------------
  // CRUD helpers
  // ---------------------------------------------------------------------------

  const handleAdd = () => {
    const newDebt: DebtInput = {
      id: crypto.randomUUID(),
      name: "New Debt",
      balance: 1000,
      apr: 15,
      minPayment: 50,
      include: true,
      category: "",
    };

    updateDebts([...debts, newDebt]);
    toast.success("Debt added");
    setIsAddOpen(false);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this debt?")) return;

    const next = debts.filter(d => d.id !== id);
    updateDebts(next);
    setSelectedIds(prev => prev.filter(x => x !== id));
    toast.success("Debt deleted");
  };

  const handleQuickEditSave = (updated: DebtInput) => {
    const next = debts.map(d => (d.id === updated.id ? { ...d, ...updated } : d));
    updateDebts(next);
    toast.success("Debt updated");
    setQuickEditDebt(null);
  };

  // ---------------------------------------------------------------------------
  // Import / Export
  // ---------------------------------------------------------------------------

  const handleExportCSV = () => {
    const csvData = debtToCSV(
      debts.map(d => ({
        name: d.name,
        balance: d.balance,
        apr: d.apr,
        minPayment: d.minPayment,
      })),
    );
    downloadCSV("debts.csv", csvData);
    toast.success("CSV exported");
  };

  const handleExportXLSX = () => {
    exportDebtsToXLSX(
      debts.map(d => ({
        name: d.name,
        balance: d.balance,
        apr: d.apr,
        minPayment: d.minPayment,
      })),
    );
    toast.success("Excel file exported");
  };

  const handleDownloadTemplate = () => {
    downloadTemplate();
    toast.success("Template downloaded");
  };

  const handleClearAll = async () => {
    await reset();
    setSelectedIds([]);
    toast.success("All debts cleared");
  };

  const handleImport = async (file: File) => {
    try {
      const parsed = await parseExcelFile(file);
      if (parsed.length === 0) {
        toast.error("No valid debts found in Excel file");
        return;
      }

      const sorted = parsed.sort((a, b) => {
        if (settings.strategy === "snowball") {
          return a.balance - b.balance;
        }
        return b.apr - a.apr;
      });

      const importedDebts: DebtInput[] = sorted.map((d) => ({
        id: crypto.randomUUID(),
        name: d.name,
        balance: d.balance,
        apr: d.apr,
        minPayment: d.minPayment,
        include: true,
        category: d.category ?? "",
        dueDay: d.dueDay,
      }));

      const next = [...debts, ...importedDebts];
      updateDebts(next);

      setShowImport(false);
      toast.success(
        `Imported ${parsed.length} debt(s) sorted by ${settings.strategy} method`,
      );
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Failed to import Excel/CSV file");
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4 p-4">
      {/* Back */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-1 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      {/* Header + Delete All */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">My Debts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your debt accounts and keep everything in sync with your payoff
            plan.
          </p>
        </div>

        {debts.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete All
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete all debts?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all {debts.length} debt(s) and clear
                  your current payoff plan. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleClearAll}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Action Row */}
      <Card className="flex flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDownloadTemplate}
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Template
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowImport(true)}
          >
            <Upload className="mr-2 h-4 w-4" />
            Import Excel/CSV
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportXLSX}
          >
            <Download className="mr-2 h-4 w-4" />
            Export Excel
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>

          <div className="ml-auto flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowBulk(true)}
              disabled={selectedIds.length === 0}
            >
              <ListChecks className="mr-2 h-4 w-4" />
              Bulk Edit ({selectedIds.length})
            </Button>

            <Button type="button" size="sm" onClick={() => setIsAddOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Debt
            </Button>
          </div>
        </div>
      </Card>

      {/* Empty state */}
      {debts.length === 0 && (
        <Card className="flex flex-col items-center justify-center gap-2 p-8 text-center">
          <p className="text-sm font-medium">No debts added yet</p>
          <p className="text-sm text-muted-foreground">
            Add your first debt to get started with your payoff plan.
          </p>
        </Card>
      )}

      {/* Debts list */}
      {debts.length > 0 && (
        <Card className="p-4">
          {/* Header row with Select All + legend */}
          <div className="mb-2 grid grid-cols-[auto,2fr,1fr,1fr,1fr,1.5fr,auto] items-center gap-3 text-xs font-medium text-muted-foreground">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={toggleSelectAll}
                aria-label="Select all debts"
              />
            </div>
            <div>Debt</div>
            <div className="text-right">Balance</div>
            <div className="text-right">APR</div>
            <div className="text-right">Min Payment</div>
            <div>Category</div>
            <div className="text-right">Actions</div>
          </div>

          <div className="flex flex-col gap-2">

            {debts.map((debt, index) => {
              const isSelected = selectedIds.includes(debt.id);

              return (
                <div
                  key={debt.id}
                  className="grid grid-cols-[auto,2fr,1fr,1fr,1fr,1.5fr,auto] items-center gap-3 rounded-md border bg-card p-3"
                >
                  {/* Row checkbox */}
                  <div className="flex items-center justify-center">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelect(debt.id)}
                      aria-label={`Select ${debt.name}`}
                    />
                  </div>

                  {/* Name + ordering controls */}
                  <div className="space-y-1">
                    <div className="text-sm font-medium leading-tight">
                      {debt.name}
                    </div>
                    {debt.include === false && (
                      <div className="text-xs text-amber-600">
                        Excluded from plan
                      </div>
                    )}
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        disabled={index === 0}
                        onClick={() => moveDebt(debt.id, "up")}
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        disabled={index === debts.length - 1}
                        onClick={() => moveDebt(debt.id, "down")}
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Balance */}
                  <div className="text-right text-sm font-mono">
                    ${debt.balance.toFixed(2)}
                  </div>

                  {/* APR */}
                  <div className="text-right text-sm font-mono">
                    {debt.apr.toFixed(1)}%
                  </div>

                  {/* Min Payment */}
                  <div className="text-right text-sm font-mono">
                    ${debt.minPayment.toFixed(2)}
                  </div>

                  {/* Category (inline editable) */}
                  <div>
                    <Input
                      value={debt.category ?? ""}
                      onChange={(e) => {
                        const next = debts.map((d) =>
                          d.id === debt.id
                            ? { ...d, category: e.target.value }
                            : d
                        );
                        updateDebts(next);
                      }}
                      placeholder="e.g. Credit Card, Auto"
                      className="h-8 text-xs"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setQuickEditDebt(debt)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(debt.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Quick Edit Modal */}
      <DebtQuickEdit
        open={!!quickEditDebt}
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

      {/* Bulk Edit Modal */}
      <BulkDebtEditor
        open={showBulk}
        debts={debts}
        selected={selectedIds}
        onClose={() => setShowBulk(false)}
        onClearSelection={clearSelection}
        onApply={(updated) => {
          updateDebts(updated);
          clearSelection();
        }}
      />

      {/* Add Debt Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Debt</DialogTitle>
          </DialogHeader>
          <DebtForm onSubmit={handleAdd} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Debt Form (used in Add dialog)
// ---------------------------------------------------------------------------

type DebtFormProps = {
  debt?: DebtInput;
  onChange?: (d: DebtInput) => void;
  onSubmit: () => void;
};

function DebtForm({ debt, onChange, onSubmit }: DebtFormProps) {
  const [local, setLocal] = useState<DebtInput>(
    debt || {
      id: crypto.randomUUID(),
      name: "",
      balance: 0,
      apr: 0,
      minPayment: 0,
      include: true,
      category: "",
    }
  );

  const handleChange = (field: keyof DebtInput, value: any) => {
    const updated = { ...local, [field]: value };
    setLocal(updated);
    onChange?.(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <div className="space-y-1">
        <label className="text-sm font-medium">Debt Name</label>
        <Input
          value={local.name}
          onChange={(e) => handleChange("name", e.target.value)}
          placeholder="Credit Card"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <label className="text-sm font-medium">Balance ($)</label>
          <Input
            type="number"
            value={local.balance}
            onChange={(e) =>
              handleChange("balance", Number(e.target.value || 0))
            }
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">APR (%)</label>
          <Input
            type="number"
            value={local.apr}
            onChange={(e) => handleChange("apr", Number(e.target.value || 0))}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Minimum Payment ($)</label>
          <Input
            type="number"
            value={local.minPayment}
            onChange={(e) =>
              handleChange("minPayment", Number(e.target.value || 0))
            }
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Category</label>
        <Input
          value={local.category ?? ""}
          onChange={(e) => handleChange("category", e.target.value)}
          placeholder="e.g. Credit Card, Auto, Personal"
        />
      </div>

      <div className="pt-2">
        <Button type="submit" className="w-full">
          {debt ? "Update Debt" : "Add Debt"}
        </Button>
      </div>
    </form>
  );
}
