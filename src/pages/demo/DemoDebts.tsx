import React from "react";
import { PageShell } from "@/components/PageShell";
import NextBack from "@/components/NextBack";
import DebtCard from "@/components/DebtCard";
import { useDemoPlan } from "@/context/DemoPlanContext";
import { PopIn } from "@/components/Animate";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, DollarSign } from "lucide-react";

export default function DemoDebts() {
  const { inputs, updateDebt, addDebt, removeDebt } = useDemoPlan();

  return (
    <PageShell>
      <div className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-finityo-textMain mb-2">Your Debts</h1>
        <p className="text-finityo-textBody mb-8">Review and adjust the sample debt data</p>

        <PopIn>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-finityo-textMain">Current Debts</h2>
                <p className="text-sm text-finityo-textBody">Modify values to see how they affect your payoff plan</p>
              </div>
              <Button 
                onClick={addDebt}
                size="sm"
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Debt
              </Button>
            </div>

            <div className="space-y-4">
              {inputs.debts.map((debt) => (
                <div key={debt.id} className="space-y-3">
                  <DebtCard
                    name={debt.name}
                    type="Credit Card"
                    balance={debt.balance}
                    apr={debt.apr}
                    minPayment={debt.minPayment}
                    dueDay={debt.dueDay}
                    progressPct={0}
                  />
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-2">
                    <div>
                      <Label className="text-xs text-finityo-textBody mb-1 block">Name</Label>
                      <Input
                        value={debt.name}
                        onChange={(e) => updateDebt(debt.id, { name: e.target.value })}
                        placeholder="Debt name"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-finityo-textBody mb-1 block">Balance</Label>
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
                      <Label className="text-xs text-finityo-textBody mb-1 block">APR %</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={debt.apr}
                        onChange={(e) => updateDebt(debt.id, { apr: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-finityo-textBody mb-1 block">Min Payment</Label>
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
                  </div>
                  {inputs.debts.length > 1 && (
                    <div className="px-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDebt(debt.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove Debt
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-border">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-card border">
                  <Label className="text-sm font-medium">Total Debt</Label>
                  <div className="text-2xl font-bold text-finityo-textMain mt-1">
                    ${inputs.debts.reduce((sum, d) => sum + d.balance, 0).toLocaleString()}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-card border">
                  <Label className="text-sm font-medium">Total Min Payments</Label>
                  <div className="text-2xl font-bold text-finityo-textMain mt-1">
                    ${inputs.debts.reduce((sum, d) => sum + d.minPayment, 0).toLocaleString()}/mo
                  </div>
                </div>
              </div>
            </div>

            <NextBack back="/demo/start" next="/demo/plan" />
          </div>
        </PopIn>
      </div>
    </PageShell>
  );
}
