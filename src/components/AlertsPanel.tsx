import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import type { AlertItem } from "@/lib/alerts";
import { Alert, AlertDescription } from "./ui/alert";

type Props = {
  alerts: AlertItem[];
};

export function AlertsPanel({ alerts }: Props) {
  if (!alerts.length) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold">Health & Alerts</h3>
      <div className="space-y-2">
        {alerts.map((alert) => (
          <Alert
            key={alert.id}
            variant={alert.level === "risk" ? "destructive" : "default"}
            className={
              alert.level === "warn"
                ? "border-amber-500 bg-amber-50 dark:bg-amber-950/20"
                : ""
            }
          >
            {alert.level === "risk" && <AlertCircle className="h-4 w-4" />}
            {alert.level === "warn" && <AlertTriangle className="h-4 w-4" />}
            {alert.level === "info" && <Info className="h-4 w-4" />}
            <AlertDescription>{alert.message}</AlertDescription>
          </Alert>
        ))}
      </div>
    </div>
  );
}
