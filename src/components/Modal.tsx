import { ReactNode } from "react";
import { Btn } from "./Btn";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

export function Modal({ open, onClose, title, children }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center animate-fade-in">
      <div className="bg-card rounded-base w-full max-w-md p-6 shadow-xl space-y-4 animate-slide-up">
        <div className="font-semibold text-lg text-card-foreground">{title}</div>
        <div>{children}</div>
        <div className="text-right">
          <Btn variant="outline" onClick={onClose}>
            Close
          </Btn>
        </div>
      </div>
    </div>
  );
}
