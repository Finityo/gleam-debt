import { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export function SectionLabel({ children }: Props) {
  return (
    <div className="uppercase text-xs tracking-wide text-muted-foreground">
      {children}
    </div>
  );
}
