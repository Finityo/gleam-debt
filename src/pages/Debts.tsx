// =======================================================
// FILE: src/pages/Debts.tsx
// Unified debts page: select all, bulk edit, manual ordering,
// inline category editing, import/export, quick edit.
// =======================================================

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUnifiedPlan } from "@/engine/useUnifiedPlan";
import { useDebtEngine } from "@/engine/DebtEngineContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
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
  const planData = useUnifiedPlan();
  const { setDebts, reset } = useDebtEngine();
  const navigate = useNavigate();
  
  // Handle null plan data
  if (!planData) {
    return (
      <div className="relative min-h-screen w-full bg-finityo-bg p-4 md:p-8">
        <div className="max-w-5xl mx-auto bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl p-6 md:p-8">
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-finityo-textBody hover:text-white transition mb-4"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-semibold text-white drop-shadow-md">My Debts</h1>
          <p className="text-white/70 mt-4">Loading debts...</p>
        </div>
      </div>
    );
  }
  
  const { debtsUsed, settingsUsed } = planData;
  const debts = debtsUsed;
  const settings = settingsUsed;

  const [quickEditDebt, setQuickEditDebt] = useState<DebtInput | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulk, setShowBulk] = useState(false);
  const [showDeleteAll, setShowDeleteAll] = useState(false);

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

    setDebts(next);
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

    setDebts([...debts, newDebt]);
    toast.success("Debt added");
    setIsAddOpen(false);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this debt?")) return;

    const next = debts.filter(d => d.id !== id);
    setDebts(next);
    setSelectedIds(prev => prev.filter(x => x !== id));
    toast.success("Debt deleted");
  };

  const handleQuickEditSave = (updated: DebtInput) => {
    const next = debts.map(d => (d.id === updated.id ? { ...d, ...updated } : d));
    setDebts(next);
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
      setDebts(next);

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
    <div className="relative min-h-screen w-full bg-finityo-bg p-4 md:p-8">
      {/* Liquid Glass Container */}
      <div className="
        max-w-5xl mx-auto
        bg-white/10
        backdrop-blur-xl
        border border-white/20
        shadow-2xl 
        rounded-2xl
        p-6 md:p-8
        space-y-6
      ">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-finityo-textBody hover:text-white transition"
        >
          ← Back
        </button>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-white drop-shadow-md">
              My Debts
            </h1>
            <p className="text-white/70 mt-1">
              Manage and organize your debts in real time.
            </p>
          </div>

          {debts.length > 0 && (
            <Dialog open={showDeleteAll} onOpenChange={setShowDeleteAll}>
              <DialogTrigger asChild>
                <button
                  className="
                    px-3 py-2 rounded-lg text-sm 
                    bg-red-400/40 
                    hover:bg-red-400/60 
                    text-white 
                    shadow-sm
                  "
                >
                  Delete All
                </button>
              </DialogTrigger>
              <DialogContent className="bg-white/20 backdrop-blur-xl border border-white/30">
                <DialogTitle className="text-white">Delete All Debts?</DialogTitle>
                <DialogDescription className="text-white/70">
                  This will permanently remove every debt and reset your plan.
                </DialogDescription>
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => setShowDeleteAll(false)}
                    className="px-3 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      handleClearAll();
                      setShowDeleteAll(false);
                    }}
                    className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    Delete All
                  </button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Action Row */}
        <div className="grid grid-cols-2 md:flex gap-3">
          <button
            onClick={handleDownloadTemplate}
            className="glass-btn"
          >
            Template
          </button>

          <button
            onClick={() => setShowImport(true)}
            className="glass-btn"
          >
            Import Excel/CSV
          </button>

          <button onClick={handleExportXLSX} className="glass-btn">
            Export Excel
          </button>

          <button onClick={handleExportCSV} className="glass-btn">
            Export CSV
          </button>

          <button
            onClick={() => setShowBulk(true)}
            disabled={selectedIds.length === 0}
            className={`glass-btn ${selectedIds.length === 0 ? "opacity-40" : ""}`}
          >
            Bulk Edit ({selectedIds.length})
          </button>

          <button
            onClick={() => setIsAddOpen(true)}
            className="
              px-4 py-2 rounded-lg text-sm 
              bg-emerald-400/40 
              hover:bg-emerald-400/60 
              text-white 
              shadow-md glass-highlight
            "
          >
            + Add Debt
          </button>
        </div>

        {/* Empty State */}
        {debts.length === 0 && (
          <div className="
            bg-white/10 backdrop-blur-xl 
            border border-white/20 
            rounded-xl text-center py-12 
            text-white
          ">
            <p className="text-xl font-medium">No debts yet</p>
            <p className="text-white/60 mt-1">Add your first debt to begin.</p>
          </div>
        )}

        {/* Debts Table */}
        {debts.length > 0 && (
          <div className="overflow-x-auto mt-6">
            <table className="min-w-full glass-table">
              <thead>
                <tr className="text-white/70 border-b border-white/20">
                  <th></th>
                  <th className="py-3 text-left">Debt</th>
                  <th className="py-3 text-right">Balance</th>
                  <th className="py-3 text-right">APR</th>
                  <th className="py-3 text-right">Min Pay</th>
                  <th className="py-3 text-left">Category</th>
                  <th className="py-3 text-center">Actions</th>
                </tr>
              </thead>

              <tbody>
                {debts.map((debt, index) => {
                  const selected = selectedIds.includes(debt.id);

                  return (
                    <tr
                      key={debt.id}
                      className={`
                        text-white border-b border-white/10
                        hover:bg-white/5 transition
                        ${selected ? "bg-white/10" : ""}
                      `}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-2">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleSelect(debt.id)}
                          className="accent-emerald-300 cursor-pointer"
                        />
                      </td>

                      {/* Name */}
                      <td className="py-3 font-medium">{debt.name}</td>

                      {/* Balance */}
                      <td className="py-3 text-right">
                        ${debt.balance.toFixed(2)}
                      </td>

                      {/* APR */}
                      <td className="py-3 text-right">{Number(debt.apr).toFixed(2)}%</td>

                      {/* Min */}
                      <td className="py-3 text-right">
                        ${debt.minPayment.toFixed(2)}
                      </td>

                      {/* Category */}
                      <td className="py-3">
                        <input
                          value={debt.category || ""}
                          onChange={(e) => {
                            const next = debts.map((d) =>
                              d.id === debt.id
                                ? { ...d, category: e.target.value }
                                : d
                            );
                            setDebts(next);
                          }}
                          className="bg-transparent border border-white/20 text-white p-1 rounded-md text-xs w-full placeholder-white/30"
                          placeholder="e.g., Auto, Credit"
                        />
                      </td>

                      {/* Actions */}
                      <td className="text-center py-3 flex gap-2 justify-center">
                        <button
                          onClick={() => setQuickEditDebt(debt)}
                          className="glass-mini-btn"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(debt.id)}
                          className="glass-mini-btn text-red-300 hover:text-red-400"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Quick Edit Modal */}
        <DebtQuickEdit
          open={!!quickEditDebt}
          debt={quickEditDebt}
          onClose={() => setQuickEditDebt(null)}
          onSave={handleQuickEditSave}
        />

        {/* Import Modal */}
        <ExcelImportModal
          open={showImport}
          onClose={() => setShowImport(false)}
          onImport={handleImport}
        />

        {/* Bulk Modal */}
        <BulkDebtEditor
          open={showBulk}
          debts={debts}
          selected={selectedIds}
          onClose={() => setShowBulk(false)}
          onClearSelection={clearSelection}
          onApply={(updated) => {
            setDebts(updated);
            clearSelection();
          }}
        />

        {/* Add Modal */}
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogContent className="bg-white/20 backdrop-blur-xl border border-white/30">
            <DialogTitle className="text-white">Add Debt</DialogTitle>
            <DebtForm onSubmit={handleAdd} />
          </DialogContent>
        </Dialog>
      </div>
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
            onChange={(e) => handleChange("apr", Number(e.target.value))}
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
