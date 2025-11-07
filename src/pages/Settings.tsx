import { useApp } from "@/context/AppStore";
import { Card } from "@/components/Card";
import AppLayout from "@/layouts/AppLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Settings as SettingsIcon, DollarSign, TrendingDown, Calculator } from "lucide-react";

export default function SettingsPage() {
  const { state, updateSettings } = useApp();
  const s = state.settings;

  function handleSave() {
    toast.success("Settings saved successfully");
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-2xl mx-auto animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <SettingsIcon className="h-8 w-8" />
            Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure your debt payoff strategy and preferences
          </p>
        </div>

        <Card title="Payoff Strategy" className="animate-slide-up">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="strategy" className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Repayment Strategy
              </Label>
              <Select
                value={s.strategy}
                onValueChange={(value) => updateSettings({ strategy: value as any })}
              >
                <SelectTrigger id="strategy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="snowball">
                    <div>
                      <div className="font-medium">Snowball</div>
                      <div className="text-xs text-muted-foreground">Pay smallest balance first</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="avalanche">
                    <div>
                      <div className="font-medium">Avalanche</div>
                      <div className="text-xs text-muted-foreground">Pay highest APR first</div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="extra-monthly" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Monthly Extra Payment
              </Label>
              <Input
                id="extra-monthly"
                type="number"
                min={0}
                max={100000}
                step={10}
                value={s.extraMonthly}
                onChange={(e) =>
                  updateSettings({ extraMonthly: Number(e.target.value || 0) })
                }
                placeholder="200"
              />
              <p className="text-xs text-muted-foreground">
                Additional amount to pay each month beyond minimum payments
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="one-time" className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                One-Time Extra Payment
              </Label>
              <Input
                id="one-time"
                type="number"
                min={0}
                max={1000000}
                step={100}
                value={s.oneTimeExtra || 0}
                onChange={(e) =>
                  updateSettings({ oneTimeExtra: Number(e.target.value || 0) })
                }
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                Lump sum to apply in the first month
              </p>
            </div>
          </div>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => window.history.back()}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Settings
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
