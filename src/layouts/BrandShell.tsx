import React from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

type BrandShellProps = {
  children: ReactNode;
};

export const BrandShell: React.FC<BrandShellProps> = ({ children }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-3 py-4 sm:px-4 md:px-6">
        <header className="mb-4 flex items-center justify-between">
          <button 
            onClick={() => navigate("/")}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-400 to-cyan-400 text-xs font-bold text-neutral-900">
              F
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight">Finityo</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Debt Simplified
              </div>
            </div>
          </button>
        </header>
        <main className="flex-1 pb-4">{children}</main>
      </div>
    </div>
  );
};

export default BrandShell;
