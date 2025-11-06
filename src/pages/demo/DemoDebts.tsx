import React from "react";
import DemoShell from "./_DemoShell";
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
    <DemoShell 
      title="Your Debts" 
      subtitle="Review and adjust the sample debt data"
    >
      <PopIn>
        <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Current Debts</h2>
            <p className="text-sm text-white/70">Modify values to see how they affect your payoff plan</p>
          </div>
          <Button 
            onClick={addDebt}
            size="sm"
            className="bg-white/20 text-white border border-white/30 hover:bg-white/30 backdrop-blur-sm"
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
                  <Label className="text-xs text-white/70 mb-1 block">Name</Label>
                  <Input
                    value={debt.name}
                    onChange={(e) => updateDebt(debt.id, { name: e.target.value })}
                    className="bg-white/10 border-white/30 text-white placeholder:text-white/40"
                    placeholder="Debt name"
                  />
                </div>
                <div>
                  <Label className="text-xs text-white/70 mb-1 block">Balance</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-2 top-2.5 w-4 h-4 text-white/60" />
                    <Input
                      type="number"
                      value={debt.balance}
                      onChange={(e) => updateDebt(debt.id, { balance: parseFloat(e.target.value) || 0 })}
                      className="pl-7 bg-white/10 border-white/30 text-white placeholder:text-white/40"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-white/70 mb-1 block">APR %</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={debt.apr}
                    onChange={(e) => updateDebt(debt.id, { apr: parseFloat(e.target.value) || 0 })}
                    className="bg-white/10 border-white/30 text-white placeholder:text-white/40"
                  />
                </div>
                <div>
                  <Label className="text-xs text-white/70 mb-1 block">Min Payment</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-2 top-2.5 w-4 h-4 text-white/60" />
                    <Input
                      type="number"
                      value={debt.minPayment}
                      onChange={(e) => updateDebt(debt.id, { minPayment: parseFloat(e.target.value) || 0 })}
                      className="pl-7 bg-white/10 border-white/30 text-white placeholder:text-white/40"
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
                    className="text-white/70 hover:text-white hover:bg-white/10"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove Debt
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="pt-6 border-t border-white/20">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white/10 border border-white/30 backdrop-blur-sm">
              <Label className="text-sm font-medium text-white">Total Debt</Label>
              <div className="text-2xl font-bold text-white mt-1">
                ${inputs.debts.reduce((sum, d) => sum + d.balance, 0).toLocaleString()}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/10 border border-white/30 backdrop-blur-sm">
              <Label className="text-sm font-medium text-white">Total Min Payments</Label>
              <div className="text-2xl font-bold text-white mt-1">
                ${inputs.debts.reduce((sum, d) => sum + d.minPayment, 0).toLocaleString()}/mo
              </div>
            </div>
          </div>
        </div>
      </div>

        <NextBack back="/demo/start" next="/demo/plan" />
      </PopIn>
    </DemoShell>
  );
}
