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

  useEffect(() => {
    if (open && debt) setLocal({ ...debt });
  }, [open, debt]);

  if (!local) return null;

  const update = (field: keyof DebtInput, value: any) => {
    setLocal((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const submit = () => {
    if (!local) return;
    onSave(local);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="space-y-4">
        <DialogHeader>
          <DialogTitle>Edit Debt</DialogTitle>
        </DialogHeader>

        {/* Name */}
        <div>
          <Label>Debt Name</Label>
          <Input
            value={local.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="Credit Card"
          />
        </div>

        {/* Balance */}
        <div>
          <Label>Balance ($)</Label>
          <Input
            type="number"
            value={local.balance}
            onChange={(e) => update("balance", Number(e.target.value) || 0)}
          />
        </div>

        {/* APR */}
        <div>
          <Label>APR (%)</Label>
          <Input
            type="number"
            value={local.apr}
            onChange={(e) => update("apr", Number(e.target.value) || 0)}
          />
        </div>

        {/* Minimum Payment */}
        <div>
          <Label>Minimum Payment ($)</Label>
          <Input
            type="number"
            value={local.minPayment}
            onChange={(e) => update("minPayment", Number(e.target.value) || 0)}
          />
        </div>

        {/* Due Day */}
        <div>
          <Label>Due Day (1–28)</Label>
          <Input
            type="number"
            value={local.dueDay ?? ""}
            placeholder="Optional"
            onChange={(e) =>
              update("dueDay", e.target.value ? Number(e.target.value) : undefined)
            }
          />
        </div>

        {/* Category */}
        <div>
          <Label>Category</Label>
          <Input
            value={local.category ?? ""}
            placeholder="e.g. Credit Card, Auto, Medical"
            onChange={(e) => update("category", e.target.value)}
          />
        </div>

        {/* Include */}
        <div>
          <Label>Include in Plan</Label>
          <select
            className="border rounded p-2 w-full text-sm"
            value={local.include ? "yes" : "no"}
            onChange={(e) =>
              update("include", e.target.value === "yes" ? true : false)
            }
          >
            <option value="yes">Include</option>
            <option value="no">Exclude</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
