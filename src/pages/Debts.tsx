// ============================================================================
// src/pages/Debts.tsx
// Unified debts page (new layout, bulk edit, manual ordering, categories)
// ============================================================================

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import AppLayout from "@/layouts/AppLayout";
import { usePlan } from "@/context/PlanContext";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
  FileSpreadsheet,
  Upload,
  Download,
  Plus,
  Trash2,
  Settings,
} from "lucide-react";

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

type Debt = DebtInput & { id: string };

export default function DebtsPage() {
  const navigate = useNavigate();
  const { debts, updateDebts, settings, reset } = usePlan();

  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [quickEditDebt, setQuickEditDebt] = useState<Debt | null>(null);
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

      const importedDebts: Debt[] = sorted.map(d => ({
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
    <AppLayout>
      <div className="mx-auto flex max-w-5xl flex-col gap-4 p-4 sm:p-6">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="mb-1 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        {/* Header + Delete All */}
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              My Debts
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your debt accounts and keep everything in sync with your plan.
            </p>
          </div>

          {debts.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="mr-1 h-4 w-4" />
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
        <Card className="flex flex-col gap-3 border border-dashed border-border/70 bg-muted/40 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={handleDownloadTemplate}
            >
              <FileSpreadsheet className="mr-1 h-4 w-4" />
              Template
            </Button>

            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setShowImport(true)}
            >
              <Upload className="mr-1 h-4 w-4" />
              Import Excel/CSV
            </Button>

            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={handleExportXLSX}
            >
              <Download className="mr-1 h-4 w-4" />
              Export Excel
            </Button>

            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={handleExportCSV}
            >
              <Download className="mr-1 h-4 w-4" />
              Export CSV
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setShowBulk(true)}
              disabled={selectedIds.length === 0}
            >
              <Settings className="mr-1 h-4 w-4" />
              Bulk Edit ({selectedIds.length})
            </Button>

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button size="sm" type="button">
                  <Plus className="mr-1 h-4 w-4" />
                  Add Debt
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Debt</DialogTitle>
                </DialogHeader>
                <DebtForm
                  debt={editingDebt ?? undefined}
                  onChange={setEditingDebt as (d: Debt) => void}
                  onSubmit={handleAdd}
                />
              </DialogContent>
            </Dialog>
          </div>
        </Card>

        {/* Empty state */}
        {debts.length === 0 && (
          <Card className="mt-2 border-dashed bg-muted/40 p-6 text-center">
            <p className="font-medium">No debts added yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add your first debt to get started with your payoff plan.
            </p>
          </Card>
        )}

        {/* Debts list */}
        {debts.length > 0 && (
          <div className="mt-2 space-y-2">
            {/* Header row with Select All + legend */}
            <div className="grid grid-cols-[auto,1.6fr,1fr,1fr,1fr,1.4fr,auto] items-center gap-2 rounded-md bg-muted px-3 py-2 text-xs font-semibold text-muted-foreground">
              <div>
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={toggleSelectAll}
                />
              </div>
              <div>Debt</div>
              <div className="text-right">Balance</div>
              <div className="text-right">APR</div>
              <div className="text-right">Min Payment</div>
              <div>Category</div>
              <div className="text-right">Actions</div>
            </div>

            {debts.map((debt, index) => {
              const isSelected = selectedIds.includes(debt.id);

              return (
                <div
                  key={debt.id}
                  className={`grid grid-cols-[auto,1.6fr,1fr,1fr,1fr,1.4fr,auto] items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm shadow-sm ${
                    isSelected ? "border-primary/60 bg-primary/5" : ""
                  }`}
                >
                  {/* Row checkbox */}
                  <div>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelect(debt.id)}
                    />
                  </div>

                  {/* Name + ordering controls */}
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col">
                      <span className="font-medium">{debt.name}</span>
                      {debt.include === false && (
                        <span className="text-[11px] text-amber-600">
                          Excluded from plan
                        </span>
                      )}
                    </div>
                    <div className="ml-auto flex gap-1">
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
                  <div className="text-right tabular-nums">
                    ${debt.balance.toFixed(2)}
                  </div>

                  {/* APR */}
                  <div className="text-right tabular-nums">
                    {debt.apr.toFixed(1)}%
                  </div>

                  {/* Min Payment */}
                  <div className="text-right tabular-nums">
                    ${debt.minPayment.toFixed(2)}
                  </div>

                  {/* Category (inline editable) */}
                  <div>
                    <Input
                      value={debt.category ?? ""}
                      onChange={e => {
                        const next = debts.map(d =>
                          d.id === debt.id
                            ? { ...d, category: e.target.value }
                            : d,
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
                      className="h-8 w-8"
                      onClick={() => setQuickEditDebt(debt)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(debt.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
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
          onApply={updated => {
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
    },
  );

  const handleChange = (field: keyof Debt, value: any) => {
    const updated = { ...local, [field]: value };
    setLocal(updated);
    onChange?.(updated);
  };

  return (
    <form
      className="mt-2 space-y-3"
      onSubmit={e => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div className="space-y-1">
        <Label>Debt Name</Label>
        <Input
          value={local.name}
          onChange={e => handleChange("name", e.target.value)}
          placeholder="Credit Card"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <Label>Balance ($)</Label>
          <Input
            type="number"
            inputMode="decimal"
            value={local.balance}
            onChange={e => handleChange("balance", Number(e.target.value || 0))}
          />
        </div>
        <div className="space-y-1">
          <Label>APR (%)</Label>
          <Input
            type="number"
            inputMode="decimal"
            value={local.apr}
            onChange={e => handleChange("apr", Number(e.target.value || 0))}
          />
        </div>
        <div className="space-y-1">
          <Label>Minimum Payment ($)</Label>
          <Input
            type="number"
            inputMode="decimal"
            value={local.minPayment}
            onChange={e =>
              handleChange("minPayment", Number(e.target.value || 0))
            }
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label>Category</Label>
        <Input
          value={local.category ?? ""}
          onChange={e => handleChange("category", e.target.value)}
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
