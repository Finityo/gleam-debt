import { ReactNode } from "react";

type Props = {
  title?: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function Card({ title, children, actions, className = "" }: Props) {
  return (
    <div className={`glass rounded-2xl p-4 space-y-3 animate-fade-in border border-border/40 ${className}`}>
      {title && <div className="font-semibold text-base text-foreground">{title}</div>}
      <div>{children}</div>
      {actions && <div className="pt-2 flex gap-2">{actions}</div>}
    </div>
  );
}
