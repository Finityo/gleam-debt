import { ReactNode } from "react";

type BtnProps = {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "outline" | "subtle" | "danger";
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  className?: string;
};

export function Btn({ 
  children, 
  onClick, 
  variant = "primary", 
  disabled,
  type = "button",
  className = ""
}: BtnProps) {
  const base =
    "px-4 py-2 rounded-base text-sm font-medium transition-colors select-none";

  const styles = {
    primary: "bg-black text-white hover:bg-gray-900 transition-all",
    outline: "border border-gray-300 hover:bg-gray-50 transition-all",
    subtle: "text-gray-700 hover:text-black transition-all",
    danger: "border border-red-300 text-red-700 hover:bg-red-50 transition-all",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${styles[variant]} disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}
