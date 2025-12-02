// src/pages/AuditDashboard.tsx
// Finityo Audit Visualization Dashboard
// READ-ONLY: displays wiring audit + violation state in real time

import { useEffect, useState } from "react";
import { runWiringAudit } from "@/lib/wiringAudit";
import { PageShell } from "@/components/PageShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, XCircle, Activity } from "lucide-react";

type AuditEvent = {
  type: string;
  pageId?: string;
  dbName?: string;
  source?: string;
  destination?: string;
  target?: string;
  timestamp: number;
};

type AuditViolation = {
  code: string;
  message: string;
  event?: AuditEvent;
};

export default function AuditDashboard() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [violations, setViolations] = useState<AuditViolation[]>([]);
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      const report = runWiringAudit();
      setEvents(report.events as AuditEvent[]);
      setViolations(report.violations as AuditViolation[]);
      setLastUpdated(Date.now());
    }, 2000); // refresh every 2 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <PageShell>
      <div className="container mx-auto py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-2">
            Finityo Architecture Audit Dashboard
          </h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Last Updated: {new Date(lastUpdated).toLocaleTimeString()}
          </p>
        </div>

        {/* Violation Status */}
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Violations</h2>

          {violations.length === 0 ? (
            <Alert className="border-green-500/50 bg-green-500/10">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <AlertDescription className="text-green-600 font-medium">
                No Violations Detected
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive" className="border-red-500 bg-red-500/10">
              <XCircle className="h-5 w-5" />
              <AlertDescription className="font-medium">
                {violations.length} Violation(s) Detected
              </AlertDescription>
            </Alert>
          )}

          {violations.length > 0 && (
            <div className="mt-4 space-y-3">
              {violations.map((v, idx) => (
                <Card key={idx} className="p-4 border-destructive/50 bg-destructive/5">
                  <div className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-destructive mt-0.5" />
                    <div className="flex-1">
                      <Badge variant="destructive" className="mb-2">
                        {v.code}
                      </Badge>
                      <p className="text-sm text-foreground">{v.message}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>

        {/* Event Stream */}
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">
            Event Stream (Last 100)
          </h2>

          <ScrollArea className="h-[400px] w-full rounded-md border border-border p-4">
            <div className="space-y-3">
              {events
                .slice(-100)
                .reverse()
                .map((evt, idx) => (
                  <div
                    key={idx}
                    className="border-b border-border pb-3 last:border-0"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">{evt.type}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(evt.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="text-sm space-y-1">
                      {evt.pageId && (
                        <div className="text-muted-foreground">
                          Page: <span className="text-foreground">{evt.pageId}</span>
                        </div>
                      )}
                      {evt.dbName && (
                        <div className="text-muted-foreground">
                          DB: <span className="text-foreground">{evt.dbName}</span>
                        </div>
                      )}
                      {evt.source && evt.destination && (
                        <div className="text-muted-foreground">
                          Nav: <span className="text-foreground">{evt.source}</span> →{" "}
                          <span className="text-foreground">{evt.destination}</span>
                        </div>
                      )}
                      {evt.target && (
                        <div className="text-muted-foreground">
                          Target: <span className="text-foreground">{evt.target}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </ScrollArea>
        </Card>
      </div>
    </PageShell>
  );
}
