import React from "react";

// BUTTON
export function Btn({ children, className="", onClick, variant="primary", disabled=false, type }: any) {
  const styles: Record<string,string> = {
    primary: "bg-finityo-cta text-black",
    outline: "bg-transparent border border-finityo-textBody text-finityo-textBody hover:text-white",
    ghost: "text-finityo-textBody hover:text-white",
    subtle: "bg-white/10 text-white hover:bg-white/20",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        px-4 py-2 rounded-xl text-sm font-medium transition
        disabled:opacity-40 disabled:cursor-not-allowed
        ${styles[variant] ?? styles.primary}
        ${variant === "primary" ? "shadow-glass" : ""}
        ${className}
      `}
    >
      {children}
    </button>
  );
}

// CARD
export function Card({ children, title, className="" }: any) {
  return (
    <div className={`
      bg-white/5 backdrop-blur border border-white/10 rounded-xl 
      p-4 text-finityo-textBody
      ${className}
    `}>
      {title && (
        <div className="font-semibold text-finityo-textMain mb-3">
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

// INPUT
export function Input({ label, ...props }: any) {
  return (
    <div className="space-y-1">
      {label && <div className="text-xs text-finityo-textBody">{label}</div>}
      <input
        {...props}
        className="w-full bg-white/10 border border-white/10 rounded-xl p-2
          text-finityo-textMain placeholder:text-gray-500 
          focus:outline-none focus:ring-2 focus:ring-finityo-primaryAccent"
      />
    </div>
  );
}
