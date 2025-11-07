import React, { useEffect, useState } from "react";

const LS_KEY = "finityo:showPayoffEvents";

export default function ChartEventsToggle({
  value,
  onChange,
}: {
  value?: boolean;
  onChange?: (v: boolean) => void;
}) {
  const [checked, setChecked] = useState<boolean>(true);

  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY);
    if (saved !== null) setChecked(saved === "true");
  }, []);

  useEffect(() => {
    if (typeof value === "boolean") setChecked(value);
  }, [value]);

  useEffect(() => {
    localStorage.setItem(LS_KEY, String(checked));
    onChange?.(checked);
  }, [checked, onChange]);

  return (
    <label className="inline-flex items-center gap-2 text-sm cursor-pointer select-none">
      <input
        type="checkbox"
        className="h-4 w-4"
        checked={checked}
        onChange={(e) => setChecked(e.target.checked)}
      />
      Show payoff markers
    </label>
  );
}
