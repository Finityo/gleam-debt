import { useState } from "react";
import { useNavigate } from "react-router-dom";

import AppLayout from "@/layouts/AppLayout";
import { usePlan } from "@/context/PlanContext";

import { Card } from "@/components/Card";
import { DebtQuickEdit } from "@/components/DebtQuickEdit";
import { ExcelImportModal } from "@/components/ExcelImportModal";
import { BulkDebtEditor } from "@/components/BulkDebtEditor";

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
  Edit2,
  Trash2,
  FileSpreadsheet,
  Download,
  Upload,
} from "lucide-react";

import { toast } from "sonner";
import type { DebtInput as Debt } from "@/lib/debtPlan";
import {
  debtToCSV,
  downloadCSV,
  parseExcelFile,
  downloadTemplate,
  exportDebtsToXLSX,
} from "@/lib/csvExport";

export default function DebtsPage() {
  // ✅ Unified engine plan context
  const { debts, updateDebts, settings, reset } = usePlan();
  const navigate = useNavigate();

  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [quickEditDebt, setQuickEditDebt] = useState<Debt | null>(null);
  const [showImport, setShowImport] = useState(false);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulk, setShowBulk] = useState(false);

  // ---------------------------------------------------------------------------
  // Selection helpers (including Select All)
  // ---------------------------------------------------------------------------

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const isAllSelected =
    debts.length > 0 && selectedIds.length === debts.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(debts.map((d) => d.id));
    }
  };

  const clearSelection = () => setSelectedIds([]);

  // ---------------------------------------------------------------------------
  // Manual ordering helpers (array-order based)
  // ---------------------------------------------------------------------------

  const moveDebt = (id: string, direction: "up" | "down") => {
    if (debts.length < 2) return;

    const index = debts.findIndex((d) => d.id === id);
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
    const newDebt: Debt = {
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

  const handleUpdate = () => {
    if (!editingDebt) return;

    const next = debts.map((d) => (d.id === editingDebt.id ? editingDebt : d));
    updateDebts(next);
    toast.success("Debt updated");
    setEditingDebt(null);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this debt?")) return;

    const next = debts.filter((d) => d.id !== id);
    updateDebts(next);

    // Also remove from selection if selected
    setSelectedIds((prev) => prev.filter((x) => x !== id));

    toast.success("Debt deleted");
  };

  const handleQuickEditSave = (updated: Debt) => {
    const next = debts.map((d) => (d.id === updated.id ? updated : d));
    updateDebts(next);
    toast.success("Debt updated");
    setQuickEditDebt(null);
  };

  // ---------------------------------------------------------------------------
  // Import / Export
  // ---------------------------------------------------------------------------

  const handleExportCSV = () => {
    const csvData = debtToCSV(
      debts.map((d) => ({
        name: d.name,
        balance: d.balance,
        apr: d.apr,
        minPayment: d.minPayment,
      }))
    );
    downloadCSV("debts.csv", csvData);
    toast.success("CSV exported");
  };

  const handleExportXLSX = () => {
    exportDebtsToXLSX(
      debts.map((d) => ({
        name: d.name,
        balance: d.balance,
        apr: d.apr,
        minPayment: d.minPayment,
      }))
    );
    toast.success("Excel file exported");
  };

  const handleDownloadTemplate = () => {
    downloadTemplate();
    toast.success("Template downloaded");
  };

  const handleClearAll = async () => {
    await reset(); // Clears debts + plan + cloud sync in PlanContext
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

      const importedDebts: Debt[] = sorted.map((d) => ({
        id: crypto.randomUUID(),
        name: d.name,
        balance: d.balance,
        apr: d.apr,
        minPayment: d.minPayment,
        include: true,
        category: d.category ?? "",
      }));

      const next = [...debts, ...importedDebts];
      updateDebts(next);

      setShowImport(false);
      toast.success(
        `Imported ${parsed.length} debt(s) sorted by ${settings.strategy} method`
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
    <AppLayout>
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 pb-10 pt-4">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="mb-1 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>

        {/* Header + Delete All */}
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">My Debts</h1>
            <p className="text-sm text-muted-foreground">
              Manage your debt accounts and keep everything in sync with your
              plan.
            </p>
          </div>

          {debts.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="mr-1 h-4 w-4" />
                  Delete All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete all debts?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all {debts.length} debt(s) and
                    clear your current plan. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={handleClearAll}
                  >
                    Delete All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {/* Action Row */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
            >
              <FileSpreadsheet className="mr-1 h-4 w-4" />
              Template
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowImport(true)}
            >
              <Upload className="mr-1 h-4 w-4" />
              Import Excel/CSV
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportXLSX}
              disabled={debts.length === 0}
            >
              <Download className="mr-1 h-4 w-4" />
              Export Excel
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={debts.length === 0}
            >
              <Download className="mr-1 h-4 w-4" />
              Export CSV
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={debts.length === 0}
              onClick={() => setShowBulk(true)}
            >
              Bulk Edit ({selectedIds.length})
            </Button>

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button type="button" size="sm">
                  <Edit2 className="mr-1 h-4 w-4" />
                  Add Debt
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Debt</DialogTitle>
                </DialogHeader>
                <DebtForm
                  debt={editingDebt ?? undefined}
                  onChange={setEditingDebt}
                  onSubmit={handleAdd}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Empty state */}
        {debts.length === 0 && (
          <Card className="mt-3 flex flex-col items-center justify-center gap-2 px-6 py-8 text-center">
            <p className="text-sm font-medium">No debts added yet</p>
            <p className="text-xs text-muted-foreground">
              Add your first debt to get started with your payoff plan.
            </p>
          </Card>
        )}

        {/* Debts list */}
        {debts.length > 0 && (
          <div className="mt-2 space-y-2">
            {/* Header row with Select All + legend */}
            <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 cursor-pointer"
                  checked={isAllSelected}
                  onChange={toggleSelectAll}
                />
                <span>Select All</span>
              </div>
              <span className="hidden gap-4 sm:flex">
                <span className="w-24 text-right">Balance</span>
                <span className="w-16 text-right">APR</span>
                <span className="w-28 text-right">Min Payment</span>
                <span className="w-24 text-right">Category</span>
              </span>
            </div>

            {debts.map((debt, index) => {
              const isSelected = selectedIds.includes(debt.id);
              return (
                <Card
                  key={debt.id}
                  className={`flex flex-col gap-3 border px-3 py-3 sm:flex-row sm:items-center sm:justify-between ${
                    isSelected ? "border-primary/60 bg-primary/5" : ""
                  }`}
                >
                  <div className="flex flex-1 items-start gap-3">
                    {/* Row checkbox */}
                    <div className="mt-1">
                      <input
                        type="checkbox"
                        className="h-4 w-4 cursor-pointer"
                        checked={isSelected}
                        onChange={() => toggleSelect(debt.id)}
                      />
                    </div>

                    <div className="flex flex-1 flex-col gap-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-medium">{debt.name}</div>

                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <button
                            type="button"
                            onClick={() => moveDebt(debt.id, "up")}
                            disabled={index === 0}
                            className="inline-flex h-6 w-6 items-center justify-center rounded border bg-background text-muted-foreground hover:bg-accent disabled:opacity-40"
                          >
                            <ArrowUp className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveDebt(debt.id, "down")}
                            disabled={index === debts.length - 1}
                            className="inline-flex h-6 w-6 items-center justify-center rounded border bg-background text-muted-foreground hover:bg-accent disabled:opacity-40"
                          >
                            <ArrowDown className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                        <div>
                          <div className="text-muted-foreground">Balance</div>
                          <div className="font-mono">
                            ${debt.balance.toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">APR</div>
                          <div className="font-mono">
                            {debt.apr.toFixed(1)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">
                            Min Payment
                          </div>
                          <div className="font-mono">
                            ${debt.minPayment.toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">
                            Category
                          </div>
                          <Input
                            className="mt-0.5 h-8"
                            placeholder="e.g. Credit Card"
                            value={debt.category ?? ""}
                            onChange={(e) => {
                              const next = debts.map((d) =>
                                d.id === debt.id
                                  ? { ...d, category: e.target.value }
                                  : d
                              );
                              updateDebts(next);
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setQuickEditDebt(debt)}
                    >
                      <Edit2 className="mr-1 h-3 w-3" />
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => handleDelete(debt.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Add Debt Dialog */}
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          {/* Trigger lives in the action row */}
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Debt</DialogTitle>
            </DialogHeader>
            <DebtForm
              debt={editingDebt ?? undefined}
              onChange={setEditingDebt}
              onSubmit={handleAdd}
            />
          </DialogContent>
        </Dialog>

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
      </div>
    </AppLayout>
  );
}

// ---------------------------------------------------------------------------
// Debt Form (used in Add dialog)
// ---------------------------------------------------------------------------

function DebtForm({
  debt,
  onChange,
  onSubmit,
}: {
  debt?: Debt;
  onChange?: (d: Debt) => void;
  onSubmit: () => void;
}) {
  const [local, setLocal] = useState<Debt>(
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

  const handleChange = (field: keyof Debt, value: any) => {
    const updated = { ...local, [field]: value };
    setLocal(updated);
    onChange?.(updated);
  };

  return (
    <form
      className="space-y-4 pt-2"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div className="space-y-1">
        <Label>Debt Name</Label>
        <Input
          value={local.name}
          onChange={(e) => handleChange("name", e.target.value)}
          placeholder="Credit Card"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label>Balance ($)</Label>
          <Input
            type="number"
            inputMode="decimal"
            value={local.balance}
            onChange={(e) =>
              handleChange("balance", Number(e.target.value || 0))
            }
          />
        </div>
        <div className="space-y-1">
          <Label>APR (%)</Label>
          <Input
            type="number"
            inputMode="decimal"
            value={local.apr}
            onChange={(e) => handleChange("apr", Number(e.target.value || 0))}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label>Minimum Payment ($)</Label>
          <Input
            type="number"
            inputMode="decimal"
            value={local.minPayment}
            onChange={(e) =>
              handleChange("minPayment", Number(e.target.value || 0))
            }
          />
        </div>
        <div className="space-y-1">
          <Label>Category</Label>
          <Input
            value={local.category ?? ""}
            onChange={(e) => handleChange("category", e.target.value)}
            placeholder="e.g. Credit Card, Auto, Personal"
          />
        </div>
      </div>

      <div className="pt-2">
        <Button type="submit" className="w-full">
          {debt ? "Update Debt" : "Add Debt"}
        </Button>
      </div>
    </form>
  );
}
