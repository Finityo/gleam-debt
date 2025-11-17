import { useState } from "react";
import { useApp } from "@/context/AppStore";
import AppLayout from "@/layouts/AppLayout";
import { Card } from "@/components/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Settings, DollarSign, TrendingUp, Palette } from "lucide-react";
import { toast } from "sonner";
import { useAppearance } from "@/hooks/useAppearance";

export default function SettingsPage() {
  const { state, updateSettings } = useApp();
  const [localSettings, setLocalSettings] = useState(state.settings);
  const { settings: appearanceSettings, saveSettings: saveAppearanceSettings } = useAppearance();
  const [localAppearance, setLocalAppearance] = useState(appearanceSettings);

  function handleChange(key: string, value: any) {
    setLocalSettings({ ...localSettings, [key]: value });
  }

  function handleSave() {
    updateSettings(localSettings);
    saveAppearanceSettings(localAppearance);
    toast.success("Settings saved successfully");
  }

  function handleCancel() {
    setLocalSettings(state.settings);
    setLocalAppearance(appearanceSettings);
    toast.info("Changes discarded");
  }

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in max-w-4xl">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6 sm:h-8 sm:w-8" />
            Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure your debt payoff strategy and payment preferences
          </p>
        </div>

        <Card className="p-6">
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Payoff Strategy
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Choose how you want to tackle your debts
              </p>
            </div>

            {/* Strategy Selection */}
            <div className="space-y-3">
              <Label htmlFor="strategy" className="text-base font-medium">
                Repayment Method
              </Label>
              <Select
                value={localSettings.strategy}
                onValueChange={(value: "snowball" | "avalanche") =>
                  handleChange("strategy", value)
                }
              >
                <SelectTrigger id="strategy" className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="snowball">
                    <div className="py-1">
                      <div className="font-medium">🎯 Snowball Method</div>
                      <div className="text-xs text-muted-foreground">
                        Pay smallest balance first - builds momentum
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="avalanche">
                    <div className="py-1">
                      <div className="font-medium">💰 Avalanche Method</div>
                      <div className="text-xs text-muted-foreground">
                        Pay highest interest first - saves money
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                {localSettings.strategy === "snowball" ? (
                  <p>
                    <strong>Snowball Method:</strong> Focuses on quick wins by paying off
                    your smallest debts first, building motivation as you see debts
                    disappear.
                  </p>
                ) : (
                  <p>
                    <strong>Avalanche Method:</strong> Mathematically optimal approach that
                    targets high-interest debts first, minimizing total interest paid.
                  </p>
                )}
              </div>
            </div>

            {/* Payment Settings */}
            <div className="space-y-3">
              <Label className="text-base font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Payment Settings
              </Label>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="extra" className="text-sm">
                    Extra Monthly Payment
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      $
                    </span>
                    <Input
                      id="extra"
                      type="number"
                      min="0"
                      step="10"
                      value={localSettings.extraMonthly}
                      onChange={(e) =>
                        handleChange("extraMonthly", Number(e.target.value || 0))
                      }
                      placeholder="0"
                      className="pl-7"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Beyond minimum payments
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="oneTime" className="text-sm">
                    One-Time Payment
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      $
                    </span>
                    <Input
                      id="oneTime"
                      type="number"
                      min="0"
                      step="100"
                      value={localSettings.oneTimeExtra || 0}
                      onChange={(e) =>
                        handleChange("oneTimeExtra", Number(e.target.value || 0))
                      }
                      placeholder="0"
                      className="pl-7"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Applied in Month 1
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Display Currency</Label>
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">USD</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    All amounts shown in US Dollars
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Appearance Settings */}
        <Card className="p-6">
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Customize the visual style of your dashboard
              </p>
            </div>

            {/* Glass Blur */}
            <div className="space-y-3">
              <Label htmlFor="glassBlur" className="text-base font-medium">
                Glass Blur Intensity
              </Label>
              <Select
                value={localAppearance.glassBlur}
                onValueChange={(value: "light" | "standard" | "ultra") =>
                  setLocalAppearance({ ...localAppearance, glassBlur: value })
                }
              >
                <SelectTrigger id="glassBlur" className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light (8px)</SelectItem>
                  <SelectItem value="standard">Standard (12px)</SelectItem>
                  <SelectItem value="ultra">Ultra (18px)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Transparency */}
            <div className="space-y-3">
              <Label htmlFor="transparency" className="text-base font-medium">
                Background Transparency
              </Label>
              <Select
                value={localAppearance.transparency}
                onValueChange={(value: "solid" | "standard" | "ultra") =>
                  setLocalAppearance({ ...localAppearance, transparency: value })
                }
              >
                <SelectTrigger id="transparency" className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solid">Solid (95%)</SelectItem>
                  <SelectItem value="standard">Standard (60%)</SelectItem>
                  <SelectItem value="ultra">Ultra Glass (30%)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Accent Color */}
            <div className="space-y-3">
              <Label htmlFor="accentColor" className="text-base font-medium">
                Accent Color
              </Label>
              <Select
                value={localAppearance.accentColor}
                onValueChange={(value: "purple" | "teal" | "gold" | "blue") =>
                  setLocalAppearance({ ...localAppearance, accentColor: value })
                }
              >
                <SelectTrigger id="accentColor" className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="purple">Purple (Default)</SelectItem>
                  <SelectItem value="teal">Teal</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="blue">Blue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Motion Toggle */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="space-y-1">
                <Label htmlFor="motionEnabled" className="text-base font-medium cursor-pointer">
                  Enable Animations
                </Label>
                <p className="text-xs text-muted-foreground">
                  Disable all micro-animations and transitions
                </p>
              </div>
              <Switch
                id="motionEnabled"
                checked={localAppearance.motionEnabled}
                onCheckedChange={(checked) =>
                  setLocalAppearance({ ...localAppearance, motionEnabled: checked })
                }
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={handleCancel} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button onClick={handleSave} className="w-full sm:w-auto">
                Save Settings
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
