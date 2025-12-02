// ============================================================
// src/components/ui/numeric-input.tsx
// Controlled numeric input with proper null handling
// Fixes frozen "0" inputs and APR 100% lock
// ============================================================

import { Input } from "./input";

interface NumericInputProps {
  value: number | null | undefined;
  placeholder?: string;
  onChange: (value: number | null) => void;
  className?: string;
  min?: number;
  max?: number;
  step?: number;
}

export function NumericInput({
  value,
  placeholder,
  onChange,
  className,
  min,
  max,
  step = 0.01,
}: NumericInputProps) {
  return (
    <Input
      type="number"
      value={value === null || value === undefined ? "" : value}
      placeholder={placeholder}
      onChange={(e) =>
        onChange(e.target.value === "" ? null : Number(e.target.value))
      }
      className={className}
      min={min}
      max={max}
      step={step}
    />
  );
}
