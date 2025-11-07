import finityoIcon from "@/assets/finityo-app-icon.png";
import { cn } from "@/lib/utils";

export function FinityoLogo({ className }: { className?: string }) {
  return (
    <img
      src={finityoIcon}
      alt="Finityo"
      className={cn("h-9 w-9", className)}
    />
  );
}
