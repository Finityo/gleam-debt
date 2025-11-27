import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { DebtInput } from "@/lib/debtPlan";

type Props = {
  open: boolean;
  debts: DebtInput[];
  selected: string[];
  onClose: () => void;
  onApply: (updated: DebtInput[]) => void;
  onClearSelection: () => void;
};

export function BulkDebtEditor({
  open,
  debts,
  selected,
  onClose,
  onApply,
  onClearSelection,
}: Props) {
  const [local, setLocal] = useState<Partial<DebtInput>>({});

  useEffect(() => {
    if (open) {
      setLocal({});
    }
  }, [open]);

  const hasSelection = selected.length > 0;

  const applyBulkUpdate = () => {
    const updated = debts.map((d) =>
      selected.includes(d.id)
        ? { ...d, ...local }
        : d
    );
    onApply(updated);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk Edit Debts</DialogTitle>
        </DialogHeader>

        <div className="mt-2 space-y-6">
          <div className="text-sm text-muted-foreground">
            Selected: <strong>{selected.length}</strong> debts
          </div>

          {/* APR */}
          <div>
            <Label>APR (%)</Label>
            <Input
              type="number"
              placeholder="Optional"
              onChange={(e) =>
                setLocal((prev) => ({
                  ...prev,
                  apr: e.target.value ? Number(e.target.value) : undefined,
                }))
              }
            />
          </div>

          {/* Min Payment */}
          <div>
            <Label>Minimum Payment ($)</Label>
            <Input
              type="number"
              placeholder="Optional"
              onChange={(e) =>
                setLocal((prev) => ({
                  ...prev,
                  minPayment: e.target.value
                    ? Number(e.target.value)
                    : undefined,
                }))
              }
            />
          </div>

          {/* Include */}
          <div>
            <Label>Include in Plan</Label>
            <select
              className="w-full border rounded px-2 py-1 h-10 bg-background"
              onChange={(e) =>
                setLocal((prev) => ({
                  ...prev,
                  include:
                    e.target.value === "yes"
                      ? true
                      : e.target.value === "no"
                      ? false
                      : undefined,
                }))
              }
            >
              <option value="">No Change</option>
              <option value="yes">Include</option>
              <option value="no">Exclude</option>
            </select>
          </div>

          {/* Category */}
          <div>
            <Label>Category</Label>
            <Input
              placeholder="Optional"
              onChange={(e) =>
                setLocal((prev) => ({
                  ...prev,
                  category: e.target.value || undefined,
                }))
              }
            />
          </div>

          {/* Due Day */}
          <div>
            <Label>Due Day (1–28)</Label>
            <Input
              type="number"
              placeholder="Optional"
              onChange={(e) =>
                setLocal((prev) => ({
                  ...prev,
                  dueDay: e.target.value
                    ? Number(e.target.value)
                    : undefined,
                }))
              }
            />
          </div>

          {/* ACTIONS */}
          <div className="flex justify-between mt-4">
            <Button variant="secondary" onClick={onClearSelection}>
              Clear Selection
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button disabled={!hasSelection} onClick={applyBulkUpdate}>
                Apply
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
