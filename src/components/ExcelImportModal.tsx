import { useState } from "react";
import { Modal } from "./Modal";
import { Btn } from "./Btn";

type Props = {
  open: boolean;
  onClose: () => void;
  onImport: (text: string) => void;
};

export function ExcelImportModal({ open, onClose, onImport }: Props) {
  const [pasteText, setPasteText] = useState("");

  function handleImport() {
    if (pasteText.trim()) {
      onImport(pasteText);
      setPasteText("");
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Paste from Excel">
      <div className="space-y-3">
        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
          <p className="font-medium mb-2">Import Format:</p>
          <p className="text-xs">Copy rows from Excel with columns separated by tabs or commas:</p>
          <p className="text-xs font-mono mt-1">Name | Balance | APR | Min Payment | Due Day | Category</p>
          <p className="text-xs mt-2">Example: Store Card	350	19.99	25	12	Credit</p>
        </div>

        <textarea
          rows={8}
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          placeholder="Paste your data here..."
          className="w-full border rounded-base p-3 text-sm font-mono"
        />

        <div className="flex justify-end gap-2">
          <Btn variant="outline" onClick={onClose}>Cancel</Btn>
          <Btn onClick={handleImport} disabled={!pasteText.trim()}>Import Debts</Btn>
        </div>
      </div>
    </Modal>
  );
}
