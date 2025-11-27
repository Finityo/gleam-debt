// =======================================================
// FILE: src/components/BulkDebtEditor.tsx
// Bulk edit modal: APR, Min Payment, Include/Exclude, Category, Due Day.
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

type BulkDebtEditorProps = {
  open: boolean;
  debts: DebtInput[];
  selected: string[];
  onClose: () => void;
  onApply: (updated: DebtInput[]) => void;
  onClearSelection: () => void;
};

type BulkState = {
  apr?: number;
  minPayment?: number;
  include?: boolean;
  category?: string;
  dueDay?: number;
};

export function BulkDebtEditor({
  open,
  debts,
  selected,
  onClose,
  onApply,
  onClearSelection,
}: BulkDebtEditorProps) {
  const [local, setLocal] = useState<BulkState>({});

  useEffect(() => {
    if (open) {
      setLocal({});
    }
  }, [open]);

  const hasSelection = selected.length > 0;

  const applyBulkUpdate = () => {
    if (!hasSelection) return;
    const updated = debts.map((d) =>
      selected.includes(d.id) ? { ...d, ...local } : d
    );
    onApply(updated);
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
          <DialogTitle>Bulk Edit Debts</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Selected: <span className="font-medium">{selected.length}</span>{" "}
            debt(s)
          </p>

          {/* APR */}
          <div className="space-y-1">
            <Label>APR (%)</Label>
            <Input
              type="number"
              value={local.apr ?? ""}
              onChange={(e) =>
                setLocal((prev) => ({
                  ...prev,
                  apr: e.target.value ? Number(e.target.value) : undefined,
                }))
              }
              placeholder="No change"
            />
          </div>

          {/* Min Payment */}
          <div className="space-y-1">
            <Label>Minimum Payment ($)</Label>
            <Input
              type="number"
              value={local.minPayment ?? ""}
              onChange={(e) =>
                setLocal((prev) => ({
                  ...prev,
                  minPayment: e.target.value
                    ? Number(e.target.value)
                    : undefined,
                }))
              }
              placeholder="No change"
            />
          </div>

          {/* Include */}
          <div className="space-y-1">
            <Label>Include in Plan</Label>
            <select
              className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
              value={
                local.include === undefined
                  ? "no-change"
                  : local.include
                  ? "include"
                  : "exclude"
              }
              onChange={(e) => {
                const val = e.target.value;
                setLocal((prev) => ({
                  ...prev,
                  include:
                    val === "no-change"
                      ? undefined
                      : val === "include"
                      ? true
                      : false,
                }));
              }}
            >
              <option value="no-change">No Change</option>
              <option value="include">Include</option>
              <option value="exclude">Exclude</option>
            </select>
          </div>

          {/* Category */}
          <div className="space-y-1">
            <Label>Category</Label>
            <Input
              value={local.category ?? ""}
              onChange={(e) =>
                setLocal((prev) => ({
                  ...prev,
                  category: e.target.value || undefined,
                }))
              }
              placeholder="No change"
            />
          </div>

          {/* Due Day */}
          <div className="space-y-1">
            <Label>Due Day (1–28)</Label>
            <Input
              type="number"
              value={local.dueDay ?? ""}
              onChange={(e) =>
                setLocal((prev) => ({
                  ...prev,
                  dueDay: e.target.value
                    ? Number(e.target.value)
                    : undefined,
                }))
              }
              placeholder="No change"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-wrap justify-between gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClearSelection}
              disabled={!hasSelection}
            >
              Clear Selection
            </Button>
            <div className="ml-auto flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={applyBulkUpdate}
                disabled={!hasSelection}
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
