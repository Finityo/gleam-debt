import React, { useEffect, useState } from "react";
import { X } from "lucide-react";

const LEGACY_KEYS = [
  "demoPlan",
  "demoDebts",
  "demoInputs",
  "DemoStore",
  "finityo_demo",
  "finityo_demo_plan_v1",
];

export default function DemoMigrationNotice() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const found = LEGACY_KEYS.some((key) => localStorage.getItem(key));
    if (found) setShow(true);
  }, []);

  const clean = () => {
    LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="w-full bg-warning/10 border-b border-warning/20 p-3 text-sm text-warning-foreground flex items-center justify-between gap-3">
      <span>
        Old demo data detected from a previous version. You can safely clear it.
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={clean}
          className="px-3 py-1 bg-warning/20 rounded-md text-warning-foreground hover:bg-warning/30 transition-colors font-medium whitespace-nowrap"
        >
          Clean Up
        </button>
        <button
          onClick={() => setShow(false)}
          className="p-1 hover:bg-warning/20 rounded-md transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
