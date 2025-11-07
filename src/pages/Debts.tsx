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
import { Plus, Trash2, Edit2, CreditCard } from "lucide-react";
import type { Debt } from "@/lib/computeDebtPlan";
import { toast } from "sonner";

export default function DebtsPage() {
  const { state, addDebt, updateDebt, deleteDebt } = useApp();
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [isOpen, setIsOpen] = useState(false);

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

        <div className="grid gap-4">
          {state.debts.map((debt) => (
            <Card key={debt.id} className="hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{debt.name}</h3>
                  <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                    <div>
                      <div className="text-muted-foreground">Balance</div>
                      <div className="font-medium">${debt.balance.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">APR</div>
                      <div className="font-medium">{debt.apr.toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Min Payment</div>
                      <div className="font-medium">${debt.minPayment.toFixed(2)}</div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setEditingDebt(debt)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Debt</DialogTitle>
                      </DialogHeader>
                      <DebtForm
                        debt={editingDebt}
                        onChange={setEditingDebt}
                        onSubmit={handleUpdate}
                      />
                    </DialogContent>
                  </Dialog>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDelete(debt.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
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
