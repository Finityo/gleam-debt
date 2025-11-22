import { ReactNode } from "react";

type BtnProps = {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "outline" | "subtle" | "danger" | "cta";
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
    "px-4 py-2 rounded-base text-sm font-medium transition-all duration-150 select-none touch-native";

  const styles = {
    primary: "bg-black text-white hover:bg-gray-900 active:scale-95",
    outline: "border border-border/40 hover:glass active:scale-96",
    subtle: "text-gray-700 hover:text-black active:scale-96",
    danger: "border border-red-300 text-red-700 hover:bg-red-50 active:scale-96",
    cta: "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:scale-105 active:scale-95 shadow-lg",
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
