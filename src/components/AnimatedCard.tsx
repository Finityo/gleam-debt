import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  withBorderAnimation?: boolean;
}

export function AnimatedCard({ 
  children, 
  className = "", 
  withBorderAnimation = false 
}: AnimatedCardProps) {
  return (
    <div 
      className={cn(
        "glass rounded-2xl p-6 card-hover", 
        withBorderAnimation && "border-gradient-animate",
        className
      )}
    >
      {children}
    </div>
  );
}
