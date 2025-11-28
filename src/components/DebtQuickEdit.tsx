// =======================================================
// FILE: src/components/DebtQuickEdit.tsx
// Modern quick-edit dialog for a single debt.
// =======================================================

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { DebtInput } from "@/lib/debtPlan";

type DebtQuickEditProps = {
  open: boolean;
  debt: DebtInput | null;
  onClose: () => void;
  onSave: (updated: DebtInput) => void;
};

export function DebtQuickEdit({
  open,
  debt,
  onClose,
  onSave,
}: DebtQuickEditProps) {
  const [local, setLocal] = useState<DebtInput | null>(null);

  useEffect(() => {
    if (open && debt) {
      setLocal({ ...debt });
    }
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
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Debt</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Name */}
          <div className="space-y-1">
            <Label>Debt Name</Label>
            <Input
              value={local.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Credit Card"
            />
          </div>

          {/* Balance */}
          <div className="space-y-1">
            <Label>Balance ($)</Label>
            <Input
              type="number"
              value={local.balance}
              onChange={(e) =>
                update("balance", Number(e.target.value) || 0)
              }
            />
          </div>

          {/* APR */}
          <div className="space-y-1">
            <Label>APR (%)</Label>
            <Input
              type="number"
              value={local.apr}
              onChange={(e) => update("apr", Number(e.target.value))}
            />
          </div>

          {/* Minimum Payment */}
          <div className="space-y-1">
            <Label>Minimum Payment ($)</Label>
            <Input
              type="number"
              value={local.minPayment}
              onChange={(e) =>
                update("minPayment", Number(e.target.value) || 0)
              }
            />
          </div>

          {/* Due Day */}
          <div className="space-y-1">
            <Label>Due Day (1–28)</Label>
            <Input
              type="number"
              value={local.dueDay ?? ""}
              onChange={(e) =>
                update(
                  "dueDay",
                  e.target.value ? Number(e.target.value) : undefined
                )
              }
              placeholder="15"
            />
          </div>

          {/* Category */}
          <div className="space-y-1">
            <Label>Category</Label>
            <Input
              value={local.category ?? ""}
              onChange={(e) => update("category", e.target.value)}
              placeholder="e.g. Credit Card, Medical, Auto"
            />
          </div>

          {/* Include */}
          <div className="space-y-1">
            <Label>Include in Plan</Label>
            <select
              className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
              value={
                local.include === false
                  ? "no"
                  : local.include === true
                  ? "yes"
                  : "yes"
              }
              onChange={(e) =>
                update("include", e.target.value === "yes" ? true : false)
              }
            >
              <option value="yes">Include</option>
              <option value="no">Exclude</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex justify-between gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button type="button" className="flex-1" onClick={submit}>
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
