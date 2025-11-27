import { useState } from "react";
import { useNavigate } from "react-router-dom";

import AppLayout from "@/layouts/AppLayout";
import { usePlan } from "@/context/PlanContext";
import { BulkDebtEditor } from "@/components/BulkDebtEditor";

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
  Plus,
  Trash2,
  Edit2,
  CreditCard,
  Download,
  Upload,
  ArrowLeft,
  FileSpreadsheet,
} from "lucide-react";

import type { Debt } from "@/lib/computeDebtPlan";
import { toast } from "sonner";
import {
  debtToCSV,
  downloadCSV,
  parseExcelFile,
  downloadTemplate,
  exportDebtsToXLSX,
} from "@/lib/csvExport";
import { DebtQuickEdit } from "@/components/DebtQuickEdit";
import { ExcelImportModal } from "@/components/ExcelImportModal";

export default function DebtsPage() {
  // ✅ Use unified engine store instead of AppStore
  const { debts, updateDebts, settings, reset } = usePlan();
  const navigate = useNavigate();

  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [quickEditDebt, setQuickEditDebt] = useState<Debt | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulk, setShowBulk] = useState(false);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const clearSelection = () => setSelectedIds([]);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  const handleAdd = () => {
    const newDebt: Debt = {
      id: crypto.randomUUID(),
      name: "New Debt",
      balance: 1000,
      apr: 15,
      minPayment: 50,
      include: true,
    };

    updateDebts([...debts, newDebt]);
    toast.success("Debt added");
    setIsOpen(false);
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
    toast.success("Debt deleted");
  };

  const handleQuickEditSave = (debt: Debt) => {
    const next = debts.map((d) => (d.id === debt.id ? debt : d));
    updateDebts(next);
    toast.success("Debt updated");
    setQuickEditDebt(null);
  };

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
    await reset(); // ✅ Uses PlanContext reset (clears debts + plan + cloud)
    toast.success("All debts cleared");
  };

  const handleImport = async (file: File) => {
    try {
      const parsed = await parseExcelFile(file);
      if (parsed.length === 0) {
        toast.error("No valid debts found in Excel file");
        return;
      }

      // Use current strategy from unified settings
      const sortedDebts = parsed.sort((a, b) => {
        if (settings.strategy === "snowball") {
          // Snowball: smallest balance first
          return a.balance - b.balance;
        } else {
          // Avalanche: highest APR first
          return b.apr - a.apr;
        }
      });

      // Map imported rows to Debt shape and append to existing debts
      const importedDebts: Debt[] = sortedDebts.map((d) => ({
        id: crypto.randomUUID(),
        name: d.name,
        balance: d.balance,
        apr: d.apr,
        minPayment: d.minPayment,
        include: true,
      }));

      const next = [...debts, ...importedDebts];

      // ✅ Single unified update → unified engine recomputes once
      updateDebts(next);

      setShowImport(false);
      toast.success(
        `Imported ${parsed.length} debt(s) sorted by ${settings.strategy} method`
      );
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Failed to import Excel file");
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        {/* Back button */}
        <div className="flex items-center gap-2 mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>

        {/* Header + Delete All */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              My Debts
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage your debt accounts
            </p>
          </div>

          {debts.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 text-destructive border-destructive/40 hover:bg-destructive/5"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete all debts?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all {debts.length} debt(s). This
                    action cannot be undone.
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

        {/* Actions row */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleDownloadTemplate}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Template
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setShowImport(true)}
          >
            <Upload className="w-4 h-4" />
            Import Excel/CSV
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleExportXLSX}
          >
            <Download className="w-4 h-4" />
            Export Excel
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setShowBulk(true)}
            disabled={selectedIds.length === 0}
          >
            Bulk Edit ({selectedIds.length})
          </Button>

          <Button
            size="sm"
            className="gap-2 ml-auto"
            onClick={() => setIsOpen(true)}
          >
            <Plus className="w-4 h-4" />
            Add Debt
          </Button>
        </div>

        {/* Empty state */}
        {debts.length === 0 && (
          <Card className="p-6 text-center text-sm text-muted-foreground">
            <p className="font-medium mb-1">No debts added yet</p>
            <p>Add your first debt to get started.</p>
          </Card>
        )}

        {/* Debts list */}
        {debts.length > 0 && (
          <div className="space-y-3">
            {debts.map((debt) => (
              <Card
                key={debt.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div className="flex items-start gap-3 flex-1">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(debt.id)}
                    onChange={() => toggleSelect(debt.id)}
                    className="mt-1 h-4 w-4 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="font-medium">{debt.name}</div>
                    <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                      <div>
                        <div className="text-xs text-muted-foreground">
                          Balance
                        </div>
                        <div>${debt.balance.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">APR</div>
                        <div>{debt.apr.toFixed(1)}%</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">
                          Min Payment
                        </div>
                        <div>${debt.minPayment.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">
                          Included
                        </div>
                        <div>{debt.include === false ? "No" : "Yes"}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => setQuickEditDebt(debt)}
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(debt.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Add Debt Dialog (optional, kept from original behavior) */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <span className="hidden" /> {/* trigger handled by button above */}
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Debt</DialogTitle>
            </DialogHeader>
            <DebtForm
              onSubmit={handleAdd}
              onChange={(d) => setEditingDebt(d)}
              debt={editingDebt ?? undefined}
            />
          </DialogContent>
        </Dialog>

        {/* Quick Edit Modal */}
        <DebtQuickEdit
          debt={quickEditDebt}
          open={!!quickEditDebt}
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
// Debt Form (used in dialog)
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
    }
  );

  const handleChange = (field: keyof Debt, value: any) => {
    const updated = { ...local, [field]: value };
    setLocal(updated);
    if (onChange) {
      onChange(updated);
    }
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div className="space-y-2">
        <Label>Debt Name</Label>
        <Input
          value={local.name}
          onChange={(e) => handleChange("name", e.target.value)}
          placeholder="Credit Card"
        />
      </div>

      <div className="space-y-2">
        <Label>Balance</Label>
        <Input
          type="number"
          value={local.balance}
          onChange={(e) =>
            handleChange("balance", Number(e.target.value || 0))
          }
        />
      </div>

      <div className="space-y-2">
        <Label>APR (%)</Label>
        <Input
          type="number"
          value={local.apr}
          onChange={(e) => handleChange("apr", Number(e.target.value || 0))}
        />
      </div>

      <div className="space-y-2">
        <Label>Minimum Payment</Label>
        <Input
          type="number"
          value={local.minPayment}
          onChange={(e) =>
            handleChange("minPayment", Number(e.target.value || 0))
          }
        />
      </div>

      <Button type="submit" className="w-full">
        {debt ? "Update Debt" : "Add Debt"}
      </Button>
    </form>
  );
}
