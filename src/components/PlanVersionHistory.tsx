import { useState } from "react";
import { type VersionRecord } from "@/lib/planAPI";
import { usePlan } from "@/context/PlanContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { History, RotateCcw, Clock, GitCompare } from "lucide-react";
import { VersionComparison } from "@/components/VersionComparison";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function PlanVersionHistory() {
  const { demoMode, history, restore } = usePlan();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<VersionRecord | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareVersion, setCompareVersion] = useState<VersionRecord | null>(null);

  async function restoreVersion(versionId: string) {
    try {
      setLoading(true);
      await restore(versionId);
      toast.success('Version restored successfully');
      setOpen(false);
      setSelectedVersion(null);
    } catch (err) {
      console.error('Failed to restore version:', err);
      toast.error('Failed to restore version');
    } finally {
      setLoading(false);
    }
  }

  if (demoMode) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Version History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Version history is only available for logged-in users.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <History className="w-4 h-4 mr-2" />
          Version History
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Plan Version History</DialogTitle>
          <DialogDescription>
            View and restore previous versions of your debt payoff plan
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[60vh]">
          {/* Version List */}
          <ScrollArea className="border rounded-lg">
            <div className="p-4 space-y-2">
              {loading && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Loading versions...
                </p>
              )}

              {!loading && history.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No versions saved yet
                </p>
              )}

              {history.map((version) => (
                <button
                  key={version.versionId}
                  onClick={() => {
                    if (compareMode && selectedVersion) {
                      setCompareVersion(version);
                    } else {
                      setSelectedVersion(version);
                    }
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedVersion?.versionId === version.versionId
                      ? 'border-primary bg-primary/5'
                      : compareVersion?.versionId === version.versionId
                      ? 'border-blue-500 bg-blue-500/5'
                      : 'border-border hover:bg-accent'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 shrink-0" />
                        <span className="font-medium truncate">
                          {new Date(version.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {version.debts.length} debts • {version.settings.strategy}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>

          {/* Version Details */}
          <div className="border rounded-lg p-4 overflow-auto">
            {compareMode && selectedVersion && compareVersion ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Version Comparison</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCompareMode(false);
                      setCompareVersion(null);
                    }}
                  >
                    Exit Compare
                  </Button>
                </div>
                <VersionComparison
                  oldVersion={compareVersion}
                  newVersion={selectedVersion}
                />
              </div>
            ) : !selectedVersion ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p className="text-sm">Select a version to view details</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Version Details</h3>
                  {history.length > 1 && !compareMode && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCompareMode(true)}
                    >
                      <GitCompare className="w-4 h-4 mr-2" />
                      Compare
                    </Button>
                  )}
                </div>

                {compareMode && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded">
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      Select another version to compare with this one
                    </p>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold mb-2">Version Details</h3>
                  <div className="space-y-1 text-sm">
                    <div>
                      <span className="text-muted-foreground">Created:</span>{' '}
                      {new Date(selectedVersion.createdAt).toLocaleString()}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Strategy:</span>{' '}
                      {selectedVersion.settings.strategy}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Extra Monthly:</span> $
                      {selectedVersion.settings.extraMonthly}
                    </div>
                    <div>
                      <span className="text-muted-foreground">One-Time:</span> $
                      {selectedVersion.settings.oneTimeExtra}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Debts ({selectedVersion.debts.length})</h3>
                  <ScrollArea className="h-48">
                    <div className="space-y-2">
                      {selectedVersion.debts.map((debt: any, i: number) => (
                        <div key={i} className="text-sm p-2 bg-accent rounded">
                          <div className="font-medium">{debt.name}</div>
                          <div className="text-xs text-muted-foreground">
                            ${debt.balance} @ {debt.apr}% APR
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                {selectedVersion.notes && (
                  <div>
                    <h3 className="font-semibold mb-2">Notes</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {selectedVersion.notes}
                    </p>
                  </div>
                )}

                {!compareMode && (
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      onClick={() => restoreVersion(selectedVersion.versionId)}
                      className="flex-1"
                      disabled={loading}
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Restore This Version
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
