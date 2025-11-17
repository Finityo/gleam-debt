import { ReactNode } from "react";

type ChipProps = {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
};

export function Chip({ children, active = false, onClick }: ChipProps) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs border transition-colors ${
        active
          ? "glass-intense text-foreground border-primary"
          : "glass text-foreground hover:glass-intense border-border/40"
      }`}
    >
      {children}
    </button>
  );
}
