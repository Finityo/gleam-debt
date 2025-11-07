import { useState } from "react";
import { Modal } from "./Modal";
import { Btn } from "./Btn";
import { Input } from "./ui/input";

type Debt = {
  id: string;
  name: string;
  balance: number;
  apr: number;
  minPayment: number;
  dueDay?: number;
  category?: string;
};

type Props = {
  debt: Debt | null;
  onClose: () => void;
  onSave: (debt: Debt) => void;
};

export function DebtQuickEdit({ debt, onClose, onSave }: Props) {
  const [formData, setFormData] = useState<Debt>(
    debt || {
      id: "",
      name: "",
      balance: 0,
      apr: 0,
      minPayment: 0,
      dueDay: undefined,
      category: undefined
    }
  );

  if (!debt) return null;

  function handleSave() {
    onSave(formData);
    onClose();
  }

  return (
    <Modal open={!!debt} onClose={onClose} title="Quick Edit Debt">
      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium">Name</label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Debt name"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium">Balance</label>
            <Input
              type="number"
              value={formData.balance}
              onChange={(e) => setFormData({ ...formData, balance: Number(e.target.value || 0) })}
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="text-xs font-medium">APR (%)</label>
            <Input
              type="number"
              step="0.01"
              value={formData.apr}
              onChange={(e) => setFormData({ ...formData, apr: Number(e.target.value || 0) })}
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium">Min Payment</label>
            <Input
              type="number"
              value={formData.minPayment}
              onChange={(e) => setFormData({ ...formData, minPayment: Number(e.target.value || 0) })}
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="text-xs font-medium">Due Day</label>
            <Input
              type="number"
              min="1"
              max="28"
              value={formData.dueDay || ""}
              onChange={(e) => setFormData({ ...formData, dueDay: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="1-28"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium">Category</label>
          <Input
            value={formData.category || ""}
            onChange={(e) => setFormData({ ...formData, category: e.target.value || undefined })}
            placeholder="e.g., Credit Card, Medical, Auto"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Btn variant="outline" onClick={onClose}>Cancel</Btn>
          <Btn onClick={handleSave}>Save Changes</Btn>
        </div>
      </div>
    </Modal>
  );
}
