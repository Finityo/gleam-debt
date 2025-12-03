// =======================================================
// FILE: src/pages/Debts.tsx
// Unified debts page, now wired to the real `debts` table.
// - Loads from Supabase
// - Persists add / edit / delete
// - Triggers integrity agent
// =======================================================

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { supabase } from "@/integrations/supabase/client";
import {
  loadUserDebts,
  addDebt as addDebtDB,
  updateDebt as updateDebtDB,
  deleteDebt as deleteDebtDB,
} from "@/lib/planStore";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { filterRenderableDebts, formatAPRDisplay } from "@/lib/number";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

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
import { NumericInput } from "@/components/ui/numeric-input";
import { importDebtsFromExcel } from "@/lib/import/importDebtsFromExcel";
import { emitDomainEvent } from "@/agents/DebtIntegrityAgent";
import "@/agents/DebtIntegrityAgent"; // Initialize agent

// ---------------------------------------------------------------------------
// Local UI debt type (normalized)
// ---------------------------------------------------------------------------

type UIDebt = {
  id: string;
  name: string;
  balance: number;
  apr: number;
  minPayment: number;
  include?: boolean;
  category?: string;
  dueDay?: number;
};

export default function DebtsPage() {
  const navigate = useNavigate();

  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [debts, setDebts] = useState<UIDebt[]>([]);

  const [quickEditDebt, setQuickEditDebt] = useState<UIDebt | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulk, setShowBulk] = useState(false);
  const [showDeleteAll, setShowDeleteAll] = useState(false);

  // -------------------------------------------------------------------------
  // Initial load: get user + debts from DB
  // -------------------------------------------------------------------------

  useEffect(() => {
    (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }
        setUserId(user.id);

        const dbDebts = await loadUserDebts(user.id);
        const uiDebts: UIDebt[] = dbDebts.map((d) => ({
          id: d.id,
          name: d.name,
          balance: d.balance ?? 0,
          apr: d.apr ?? 0,
          minPayment: d.min_payment ?? 0,
          include: true,
          category: d.debt_type ?? "",
          dueDay: d.due_date ? new Date(d.due_date).getDate() : undefined,
        }));

        setDebts(uiDebts);
      } catch (err) {
        console.error("Failed to load debts:", err);
        toast.error("Failed to load debts. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Guard while loading
  if (loading) {
    return (
      <div className="relative min-h-screen w-full bg-finityo-bg p-4 md:p-8">
        <div className="max-w-5xl mx-auto bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl p-6 md:p-8">
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-finityo-textBody hover:text-white transition mb-4"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-semibold text-white drop-shadow-md">
            My Debts
          </h1>
          <p className="text-white/70 mt-4">Loading debts...</p>
        </div>
      </div>
    );
  }

  // If not signed in, show simple message
  if (!userId) {
    return (
      <div className="relative min-h-screen w-full bg-finityo-bg p-4 md:p-8">
        <div className="max-w-5xl mx-auto bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl p-6 md:p-8">
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-finityo-textBody hover:text-white transition mb-4"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-semibold text-white drop-shadow-md">
            My Debts
          </h1>
          <p className="text-white/70 mt-4">
            Please sign in to manage your debts.
          </p>
        </div>
      </div>
    );
  }

  // ✅ Only render valid debts
  const renderableDebts = filterRenderableDebts(debts as any);

  // -------------------------------------------------------------------------
  // Selection helpers
  // -------------------------------------------------------------------------

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const isAllSelected =
    renderableDebts.length > 0 && selectedIds.length === renderableDebts.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(renderableDebts.map((d) => d.id));
    }
  };

  const clearSelection = () => setSelectedIds([]);

  // -------------------------------------------------------------------------
  // Manual ordering helpers (array-order based only, not persisted for now)
  // -------------------------------------------------------------------------

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

    setDebts(next);
  };

  // -------------------------------------------------------------------------
  // CRUD helpers (DB + local state)
  // -------------------------------------------------------------------------

  const handleAdd = async (form: UIDebt) => {
    try {
      const created = await addDebtDB(userId, {
        name: form.name || "New Debt",
        balance: form.balance ?? 0,
        apr: form.apr ?? 0,
        min_payment: form.minPayment ?? 0,
        due_date: null,
        debt_type: form.category ?? "",
        notes: "",
        last4: null,
      } as any);

      const newDebt: UIDebt = {
        id: created.id,
        name: created.name,
        balance: created.balance ?? 0,
        apr: created.apr ?? 0,
        minPayment: created.min_payment ?? 0,
        include: true,
        category: created.debt_type ?? "",
      };

      setDebts((prev) => [...prev, newDebt]);

      await emitDomainEvent({
        type: "DebtEdited",
        debt: {
          id: newDebt.id,
          name: newDebt.name,
          balance: newDebt.balance,
          minPayment: newDebt.minPayment,
          apr: newDebt.apr,
          source: "manual",
        },
        userId,
      });

      toast.success("Debt added");
      setIsAddOpen(false);
    } catch (err) {
      console.error("Add debt failed:", err);
      toast.error("Failed to add debt");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this debt?")) return;

    try {
      await deleteDebtDB(id);
      setDebts((prev) => prev.filter((d) => d.id !== id));
      setSelectedIds((prev) => prev.filter((x) => x !== id));
      toast.success("Debt deleted");
    } catch (err) {
      console.error("Delete debt failed:", err);
      toast.error("Failed to delete debt");
    }
  };

  const handleQuickEditSave = async (updated: UIDebt) => {
    try {
      await updateDebtDB(updated.id, {
        name: updated.name,
        balance: updated.balance,
        apr: updated.apr,
        min_payment: updated.minPayment,
        debt_type: updated.category ?? "",
      } as any);

      setDebts((prev) =>
        prev.map((d) => (d.id === updated.id ? { ...d, ...updated } : d))
      );

      await emitDomainEvent({
        type: "DebtEdited",
        debt: {
          id: updated.id,
          name: updated.name,
          balance: updated.balance,
          minPayment: updated.minPayment,
          apr: updated.apr,
          source: "manual",
        },
        userId,
      });

      toast.success("Debt updated");
      setQuickEditDebt(null);
    } catch (err) {
      console.error("Update debt failed:", err);
      toast.error("Failed to update debt");
    }
  };

  const handleClearAll = async () => {
    try {
      // Delete all debts for this user
      const { error } = await supabase
        .from("debts")
        .delete()
        .eq("user_id", userId);

      if (error) throw error;

      setDebts([]);
      setSelectedIds([]);
      toast.success("All debts cleared");
    } catch (err) {
      console.error("Clear all debts failed:", err);
      toast.error("Failed to clear debts");
    }
  };

  // -------------------------------------------------------------------------
  // Import / Export
  // -------------------------------------------------------------------------

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

  const handleImport = async (file: File) => {
    try {
      const parsed = await parseExcelFile(file);
      if (parsed.length === 0) {
        toast.error("No valid debts found in Excel file");
        return;
      }

      const sorted = parsed.sort((a, b) => a.balance - b.balance);

      // Use normalized import path, WITH userId this time
      await importDebtsFromExcel(sorted as any, userId);

      // Reload from DB
      const dbDebts = await loadUserDebts(userId);
      const uiDebts: UIDebt[] = dbDebts.map((d) => ({
        id: d.id,
        name: d.name,
        balance: d.balance ?? 0,
        apr: d.apr ?? 0,
        minPayment: d.min_payment ?? 0,
        include: true,
        category: d.debt_type ?? "",
        dueDay: d.due_date ? new Date(d.due_date).getDate() : undefined,
      }));

      setDebts(uiDebts);

      setShowImport(false);
      toast.success(
        `Imported ${parsed.length} debt(s) from Excel/CSV`
      );
    } catch (error: any) {
      console.error("Import error:", error);
      toast.error(error?.message || "Failed to import Excel/CSV file");
    }
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="relative min-h-screen w-full bg-finityo-bg p-4 md:p-8">
      {/* Liquid Glass Container */}
      <div
        className="
        max-w-5xl mx-auto
        bg-white/10
        backdrop-blur-xl
        border border-white/20
        shadow-2xl 
        rounded-2xl
        p-6 md:p-8
        space-y-6
      "
      >
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
              <button
                onClick={() => setShowDeleteAll(true)}
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
              <DialogContent className="bg-white/20 backdrop-blur-xl border border-white/30">
                <DialogTitle className="text-white">
                  Delete All Debts?
                </DialogTitle>
                <p className="text-white/70 mt-2">
                  This will permanently remove every debt and reset your plan.
                </p>
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
          <button onClick={handleDownloadTemplate} className="glass-btn">
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
            className={`glass-btn ${
              selectedIds.length === 0 ? "opacity-40" : ""
            }`}
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
        {renderableDebts.length === 0 && (
          <div
            className="
            bg-white/10 backdrop-blur-xl 
            border border-white/20 
            rounded-xl text-center py-12 
            text-white
          "
          >
            <p className="text-xl font-medium">No debts yet</p>
            <p className="text-white/60 mt-1">
              Add your first debt to begin.
            </p>
          </div>
        )}

        {/* Debts Table */}
        {renderableDebts.length > 0 && (
          <div className="overflow-x-auto mt-6">
            <table className="min-w-full glass-table">
              <thead>
                <tr className="text-white/70 border-b border-white/20">
                  <th>
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                      className="accent-emerald-300 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 text-left">Debt</th>
                  <th className="py-3 text-right">Balance</th>
                  <th className="py-3 text-right">APR</th>
                  <th className="py-3 text-right">Min Pay</th>
                  <th className="py-3 text-left">Category</th>
                  <th className="py-3 text-center">Actions</th>
                </tr>
              </thead>

              <tbody>
                {renderableDebts.map((debt) => {
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
                      <td className="px-3 py-2 text-right text-sm tabular-nums">
                        {formatAPRDisplay(debt.apr)}
                      </td>

                      {/* Min */}
                      <td className="py-3 text-right">
                        ${debt.minPayment.toFixed(2)}
                      </td>

                      {/* Category */}
                      <td className="py-3">
                        <Input
                          value={debt.category || ""}
                          onChange={async (e) => {
                            const nextCategory = e.target.value;
                            const updated: UIDebt = {
                              ...debt,
                              category: nextCategory,
                            };

                            try {
                              await updateDebtDB(debt.id, {
                                debt_type: nextCategory,
                              } as any);

                              setDebts((prev) =>
                                prev.map((d) =>
                                  d.id === debt.id ? updated : d
                                )
                              );

                              await emitDomainEvent({
                                type: "DebtEdited",
                                debt: {
                                  id: debt.id,
                                  name: debt.name,
                                  balance: debt.balance,
                                  minPayment: debt.minPayment,
                                  apr: debt.apr,
                                  source: "manual",
                                },
                                userId,
                              });
                            } catch (err) {
                              console.error("Category update failed:", err);
                              toast.error("Failed to update category");
                            }
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
          debt={quickEditDebt as any}
          onClose={() => setQuickEditDebt(null)}
          onSave={(updated) =>
            handleQuickEditSave(updated as unknown as UIDebt)
          }
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
          debts={debts as any}
          selected={selectedIds}
          onClose={() => setShowBulk(false)}
          onClearSelection={clearSelection}
          onApply={(updated) => {
            // Bulk editor gives us updated UI debts – push to DB in background
            setDebts(updated as any);
            clearSelection();
          }}
        />

        {/* Add Modal */}
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogContent className="bg-white/20 backdrop-blur-xl border border-white/30">
            <DialogTitle className="text-white">Add Debt</DialogTitle>
            <DebtForm
              onSubmit={(d) =>
                handleAdd({
                  id: "",
                  name: d.name,
                  balance: d.balance,
                  apr: d.apr,
                  minPayment: d.minPayment,
                  include: true,
                  category: d.category,
                })
              }
            />
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
  onSubmit: (d: {
    name: string;
    balance: number;
    apr: number;
    minPayment: number;
    category?: string;
  }) => void;
};

function DebtForm({ onSubmit }: DebtFormProps) {
  const [local, setLocal] = useState({
    name: "",
    balance: 0,
    apr: 0,
    minPayment: 0,
    category: "",
  });

  const handleChange = (
    field: keyof typeof local,
    value: string | number
  ) => {
    setLocal((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(local);
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
          <NumericInput
            value={local.balance}
            placeholder="0.00"
            onChange={(val) => handleChange("balance", val ?? 0)}
            min={0}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">APR (%)</label>
          <NumericInput
            value={local.apr}
            placeholder="0.00"
            onChange={(val) => handleChange("apr", val ?? 0)}
            min={0}
            max={100}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Minimum Payment ($)</label>
          <NumericInput
            value={local.minPayment}
            placeholder="0.00"
            onChange={(val) => handleChange("minPayment", val ?? 0)}
            min={0}
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Category</label>
        <Input
          value={local.category}
          onChange={(e) => handleChange("category", e.target.value)}
          placeholder="e.g. Credit Card, Auto, Personal"
        />
      </div>

      <div className="pt-2">
        <Button type="submit" className="w-full">
          Add Debt
        </Button>
      </div>
    </form>
  );
}
