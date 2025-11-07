import { ReactNode } from "react";

type Props = {
  title?: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function Card({ title, children, actions, className = "" }: Props) {
  return (
    <div className={`bg-white border border-gray-200 shadow-card rounded-base p-4 space-y-3 animate-fade-in ${className}`}>
      {title && <div className="font-semibold text-base">{title}</div>}
      <div>{children}</div>
      {actions && <div className="pt-2 flex gap-2">{actions}</div>}
    </div>
  );
}
