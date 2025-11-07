import { useApp } from "@/context/AppStore";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import { Bell, X } from "lucide-react";

export function NotificationsPanel() {
  const { state, clearNotifications } = useApp();
  const items = state.notifications;

  if (!items.length) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md space-y-2 animate-slide-in-right">
      {items.map((msg, i) => (
        <Alert key={i} className="bg-card shadow-lg border-primary/20 animate-fade-in">
          <Bell className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span className="flex-1">{msg}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 ml-2"
              onClick={clearNotifications}
            >
              <X className="h-3 w-3" />
            </Button>
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
