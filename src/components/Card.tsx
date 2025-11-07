import { Card as ShadCard, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ReactNode } from "react";

type Props = {
  title?: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function Card({ title, children, actions, className }: Props) {
  return (
    <ShadCard className={`animate-fade-in ${className || ""}`}>
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}
      
      <CardContent className="space-y-4">
        {children}
        
        {actions && (
          <div className="pt-2 flex gap-2 border-t">
            {actions}
          </div>
        )}
      </CardContent>
    </ShadCard>
  );
}
