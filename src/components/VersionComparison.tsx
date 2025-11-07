import { type VersionRecord } from "@/lib/planAPI";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, TrendingUp, TrendingDown, Minus } from "lucide-react";

type VersionComparisonProps = {
  oldVersion: VersionRecord;
  newVersion: VersionRecord;
};

export function VersionComparison({ oldVersion, newVersion }: VersionComparisonProps) {
  const debtChanges = compareDebts(oldVersion.debts, newVersion.debts);
  const settingsChanges = compareSettings(oldVersion.settings, newVersion.settings);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Settings Changes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {settingsChanges.length === 0 ? (
            <p className="text-sm text-muted-foreground">No settings changed</p>
          ) : (
            settingsChanges.map((change, i) => (
              <div key={i} className="flex items-center justify-between text-sm p-2 bg-accent rounded">
                <span className="font-medium">{change.field}</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{change.oldValue}</span>
                  <ArrowRight className="w-4 h-4" />
                  <span className="font-medium">{change.newValue}</span>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Debt Changes</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {debtChanges.added.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="default" className="bg-green-500">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Added ({debtChanges.added.length})
                    </Badge>
                  </div>
                  {debtChanges.added.map((debt, i) => (
                    <div key={i} className="text-sm p-2 bg-green-500/10 border border-green-500/20 rounded">
                      <div className="font-medium">{debt.name}</div>
                      <div className="text-xs text-muted-foreground">
                        ${debt.balance} @ {debt.apr}% APR
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {debtChanges.removed.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="destructive">
                      <TrendingDown className="w-3 h-3 mr-1" />
                      Removed ({debtChanges.removed.length})
                    </Badge>
                  </div>
                  {debtChanges.removed.map((debt, i) => (
                    <div key={i} className="text-sm p-2 bg-red-500/10 border border-red-500/20 rounded">
                      <div className="font-medium">{debt.name}</div>
                      <div className="text-xs text-muted-foreground">
                        ${debt.balance} @ {debt.apr}% APR
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {debtChanges.modified.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">
                      <Minus className="w-3 h-3 mr-1" />
                      Modified ({debtChanges.modified.length})
                    </Badge>
                  </div>
                  {debtChanges.modified.map((change, i) => (
                    <div key={i} className="text-sm p-2 bg-blue-500/10 border border-blue-500/20 rounded">
                      <div className="font-medium">{change.debt.name}</div>
                      <div className="text-xs space-y-1 mt-1">
                        {change.changes.map((c, j) => (
                          <div key={j} className="flex items-center gap-2">
                            <span className="text-muted-foreground">{c.field}:</span>
                            <span className="text-muted-foreground">{c.oldValue}</span>
                            <ArrowRight className="w-3 h-3" />
                            <span className="font-medium">{c.newValue}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {debtChanges.added.length === 0 &&
                debtChanges.removed.length === 0 &&
                debtChanges.modified.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No debt changes
                  </p>
                )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {(oldVersion.notes !== newVersion.notes) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes Changed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="p-2 bg-accent rounded">
              <div className="text-xs font-medium text-muted-foreground mb-1">Before</div>
              <p className="text-sm whitespace-pre-wrap">
                {oldVersion.notes || '(empty)'}
              </p>
            </div>
            <div className="p-2 bg-accent rounded">
              <div className="text-xs font-medium text-muted-foreground mb-1">After</div>
              <p className="text-sm whitespace-pre-wrap">
                {newVersion.notes || '(empty)'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Helper functions
function compareDebts(oldDebts: any[], newDebts: any[]) {
  const oldMap = new Map(oldDebts.map(d => [d.id, d]));
  const newMap = new Map(newDebts.map(d => [d.id, d]));

  const added = newDebts.filter(d => !oldMap.has(d.id));
  const removed = oldDebts.filter(d => !newMap.has(d.id));
  const modified: Array<{ debt: any; changes: Array<{ field: string; oldValue: any; newValue: any }> }> = [];

  for (const debt of newDebts) {
    const old = oldMap.get(debt.id);
    if (old) {
      const changes = [];
      if (old.balance !== debt.balance) {
        changes.push({ field: 'Balance', oldValue: `$${old.balance}`, newValue: `$${debt.balance}` });
      }
      if (old.apr !== debt.apr) {
        changes.push({ field: 'APR', oldValue: `${old.apr}%`, newValue: `${debt.apr}%` });
      }
      if (old.minPayment !== debt.minPayment) {
        changes.push({ field: 'Min Payment', oldValue: `$${old.minPayment}`, newValue: `$${debt.minPayment}` });
      }
      if (changes.length > 0) {
        modified.push({ debt, changes });
      }
    }
  }

  return { added, removed, modified };
}

function compareSettings(oldSettings: any, newSettings: any) {
  const changes: Array<{ field: string; oldValue: any; newValue: any }> = [];

  if (oldSettings.strategy !== newSettings.strategy) {
    changes.push({
      field: 'Strategy',
      oldValue: oldSettings.strategy,
      newValue: newSettings.strategy,
    });
  }

  if (oldSettings.extraMonthly !== newSettings.extraMonthly) {
    changes.push({
      field: 'Extra Monthly',
      oldValue: `$${oldSettings.extraMonthly}`,
      newValue: `$${newSettings.extraMonthly}`,
    });
  }

  if (oldSettings.oneTimeExtra !== newSettings.oneTimeExtra) {
    changes.push({
      field: 'One-Time Extra',
      oldValue: `$${oldSettings.oneTimeExtra}`,
      newValue: `$${newSettings.oneTimeExtra}`,
    });
  }

  return changes;
}
