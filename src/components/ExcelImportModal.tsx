import { useState } from "react";
import { Modal } from "./Modal";
import { Btn } from "./Btn";
import { Upload } from "lucide-react";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onClose: () => void;
  onImport: (file: File) => void;
};

export function ExcelImportModal({ open, onClose, onImport }: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
        toast.error("Please select an Excel or CSV file (.xlsx, .xls, or .csv)");
        return;
      }
      setSelectedFile(file);
    }
  }

  function handleImport() {
    if (selectedFile) {
      onImport(selectedFile);
      setSelectedFile(null);
      onClose();
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Import Debts from Excel/CSV">
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <p className="font-medium mb-2">Expected Format:</p>
          <p className="text-xs font-mono">Creditor | Balance | APR (%) | Minimum Payment | Due Date | Notes</p>
          <p className="text-xs mt-2">Download the template first if you need help formatting your data.</p>
        </div>

        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
          <Upload className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
          <label htmlFor="excel-file" className="cursor-pointer">
            <span className="text-sm font-medium text-primary hover:text-primary/80">
              Choose Excel or CSV file
            </span>
            <input
              id="excel-file"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
          {selectedFile && (
            <p className="mt-2 text-sm text-foreground font-medium">
              {selectedFile.name}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Btn variant="outline" onClick={onClose}>Cancel</Btn>
          <Btn onClick={handleImport} disabled={!selectedFile}>Import Debts</Btn>
        </div>
      </div>
    </Modal>
  );
}
