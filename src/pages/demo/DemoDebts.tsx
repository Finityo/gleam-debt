import React from "react";
import DemoShell from "./_DemoShell";
import GlassCard from "@/components/GlassCard";
import NextBack from "@/components/NextBack";
import { useDemoPlan } from "@/context/DemoPlanContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, DollarSign } from "lucide-react";

export default function DemoDebts() {
  const { inputs, updateDebt, addDebt, removeDebt } = useDemoPlan();

  return (
    <DemoShell 
      title="Your Debts" 
      subtitle="Review and adjust the sample debt data"
    >
      <GlassCard>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Current Debts</h2>
              <p className="text-sm text-muted-foreground">Modify values to see how they affect your payoff plan</p>
            </div>
            <Button 
              onClick={addDebt}
              size="sm"
              className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white border-0"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Debt
            </Button>
          </div>

          <div className="space-y-4">
            {inputs.debts.map((debt) => (
              <div 
                key={debt.id} 
                className="p-4 rounded-xl border border-border/50 bg-card/30 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <Input
                    value={debt.name}
                    onChange={(e) => updateDebt(debt.id, { name: e.target.value })}
                    className="text-lg font-semibold bg-transparent border-0 p-0 h-auto focus-visible:ring-0"
                    placeholder="Debt name"
                  />
                  {inputs.debts.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDebt(debt.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Balance</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="number"
                        value={debt.balance}
                        onChange={(e) => updateDebt(debt.id, { balance: parseFloat(e.target.value) || 0 })}
                        className="pl-7"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">APR %</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={debt.apr}
                      onChange={(e) => updateDebt(debt.id, { apr: parseFloat(e.target.value) || 0 })}
                    />
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Min Payment</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="number"
                        value={debt.minPayment}
                        onChange={(e) => updateDebt(debt.id, { minPayment: parseFloat(e.target.value) || 0 })}
                        className="pl-7"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Due Day</Label>
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      value={debt.dueDay || ""}
                      onChange={(e) => updateDebt(debt.id, { dueDay: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-border/50">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <Label className="text-sm font-medium text-foreground">Total Debt</Label>
                <div className="text-2xl font-bold text-foreground mt-1">
                  ${inputs.debts.reduce((sum, d) => sum + d.balance, 0).toLocaleString()}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                <Label className="text-sm font-medium text-foreground">Total Min Payments</Label>
                <div className="text-2xl font-bold text-foreground mt-1">
                  ${inputs.debts.reduce((sum, d) => sum + d.minPayment, 0).toLocaleString()}/mo
                </div>
              </div>
            </div>
          </div>
        </div>

        <NextBack back="/demo/start" next="/demo/plan" />
      </GlassCard>
    </DemoShell>
  );
}
