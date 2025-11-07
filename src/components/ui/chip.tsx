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
          ? "bg-black text-white border-black"
          : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300"
      }`}
    >
      {children}
    </button>
  );
}
