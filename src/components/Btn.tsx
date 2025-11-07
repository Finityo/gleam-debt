import { ReactNode } from "react";

type BtnProps = {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "outline" | "subtle";
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
    primary: "bg-brand text-white hover:bg-brand-soft",
    outline: "border border-brand-border hover:bg-gray-50",
    subtle: "text-brand-faded hover:text-brand",
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
