import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { DebtInput } from "@/lib/debtPlan";

type Props = {
  open: boolean;
  debt: DebtInput | null;
  onClose: () => void;
  onSave: (updated: DebtInput) => void;
};

export function DebtQuickEdit({ open, debt, onClose, onSave }: Props) {
  const [local, setLocal] = useState<DebtInput | null>(null);

  // Sync local state when modal opens
  useEffect(() => {
    if (open && debt) {
      setLocal({ ...debt });
    }
  }, [open, debt]);

  if (!local) return null;

  const updateField = (field: keyof DebtInput, value: any) => {
    setLocal((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSubmit = () => {
    if (!local) return;
    onSave(local);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Debt</DialogTitle>
        </DialogHeader>

        {/* Name */}
        <div className="space-y-1">
          <Label>Debt Name</Label>
          <Input
            value={local.name}
            onChange={(e) => updateField("name", e.target.value)}
            placeholder="Credit Card"
          />
        </div>

        {/* Balance */}
        <div className="space-y-1">
          <Label>Balance ($)</Label>
          <Input
            type="number"
            value={local.balance}
            onChange={(e) => updateField("balance", Number(e.target.value) || 0)}
          />
        </div>

        {/* APR */}
        <div className="space-y-1">
          <Label>APR (%)</Label>
          <Input
            type="number"
            value={local.apr}
            onChange={(e) => updateField("apr", Number(e.target.value) || 0)}
          />
        </div>

        {/* Minimum Payment */}
        <div className="space-y-1">
          <Label>Minimum Payment ($)</Label>
          <Input
            type="number"
            value={local.minPayment}
            onChange={(e) => updateField("minPayment", Number(e.target.value) || 0)}
          />
        </div>

        {/* Due Day – optional */}
        <div className="space-y-1">
          <Label>Due Day (1–28, optional)</Label>
          <Input
            type="number"
            value={local.dueDay ?? ""}
            onChange={(e) =>
              updateField("dueDay", e.target.value ? Number(e.target.value) : undefined)
            }
            placeholder="15"
          />
        </div>

        {/* Include */}
        <div className="space-y-1">
          <Label>Include in Plan</Label>
          <select
            className="border rounded-md h-10 px-3"
            value={local.include !== false ? "yes" : "no"}
            onChange={(e) => updateField("include", e.target.value === "yes")}
          >
            <option value="yes">Yes (include)</option>
            <option value="no">No (exclude)</option>
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
