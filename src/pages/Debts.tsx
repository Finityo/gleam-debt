import { useState } from "react";
import { useApp } from "@/context/AppStore";
import { useNavigate } from "react-router-dom";
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
import { Plus, Trash2, Edit2, CreditCard, Download, Upload, ArrowLeft, FileSpreadsheet } from "lucide-react";
import type { Debt } from "@/lib/computeDebtPlan";
import { toast } from "sonner";
import { debtToCSV, downloadCSV, parseExcelFile, downloadTemplate, exportDebtsToXLSX } from "@/lib/csvExport";
import { DebtQuickEdit } from "@/components/DebtQuickEdit";
import { ExcelImportModal } from "@/components/ExcelImportModal";

export default function DebtsPage() {
  const { state, addDebt, updateDebt, deleteDebt, clearDebts } = useApp();
  const navigate = useNavigate();
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

      // Add imported debts to both storage systems
      for (const debt of sortedDebts) {
        await addDebt({
          name: debt.name,
          balance: debt.balance,
          apr: debt.apr,
          minPayment: debt.minPayment,
        });
      }

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

  function handleExportXLSX() {
    exportDebtsToXLSX(
      state.debts.map((d) => ({
        name: d.name,
        balance: d.balance,
        apr: d.apr,
        minPayment: d.minPayment,
      }))
    );
    toast.success("Excel file exported");
  }

  function handleDownloadTemplate() {
    downloadTemplate();
    toast.success("Template downloaded");
  }

  async function handleClearAll() {
    await clearDebts();
    toast.success("All debts cleared");
  }

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <CreditCard className="h-6 w-6 md:h-8 md:w-8" />
              My Debts
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your debt accounts
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {state.debts.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="flex-1 sm:flex-none">
                    <Trash2 className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Delete All</span>
                    <span className="sm:hidden">Clear</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete all debts?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all {state.debts.length} debt(s). This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Delete All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="flex-1 sm:flex-none">
              <FileSpreadsheet className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Download Template</span>
              <span className="sm:hidden">Template</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowImport(true)} className="flex-1 sm:flex-none">
              <Upload className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Import Excel/CSV</span>
              <span className="sm:hidden">Import</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportXLSX} className="flex-1 sm:flex-none">
              <Download className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Export Excel</span>
              <span className="sm:hidden">Export</span>
            </Button>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button className="flex-1 sm:flex-none">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Debt
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add New Debt</DialogTitle>
                </DialogHeader>
                <DebtForm onSubmit={handleAdd} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {state.debts.length === 0 && (
          <Card className="glass-intense border-border/40">
            <div className="text-center py-12">
              <CreditCard className="h-12 w-12 mx-auto text-primary mb-4" />
              <p className="text-lg font-medium text-foreground">No debts added yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add your first debt to get started
              </p>
            </div>
          </Card>
        )}

        <div className="grid gap-2">
          {state.debts.map((debt) => (
            <div key={debt.id} className="glass p-4 rounded-2xl animate-fade-in hover:shadow-liquid transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-base sm:text-sm text-foreground/90 mb-2 truncate">{debt.name}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <div className="text-foreground/50 mb-0.5">Balance</div>
                      <div className="font-semibold text-sm text-foreground/90">
                        ${debt.balance.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-foreground/50 mb-0.5">APR</div>
                      <div className="font-semibold text-sm text-foreground/90">{debt.apr.toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="text-foreground/50 mb-0.5">Min Payment</div>
                      <div className="font-semibold text-sm text-foreground/90">
                        ${debt.minPayment.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-1.5 flex-shrink-0 mt-3 sm:mt-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuickEditDebt(debt)}
                    className="h-8 text-xs flex-1 sm:flex-none"
                  >
                    <Edit2 className="h-3.5 w-3.5 sm:mr-1" />
                    <span className="hidden sm:inline">Edit</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(debt.id)}
                    className="h-8 w-8 text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

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
