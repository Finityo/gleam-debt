import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Plus, Download } from "lucide-react";

type Strategy = "snowball" | "avalanche";

interface DebtInput {
  id?: string;
  name: string;
  last4?: string;
  balance: number;
  minPayment: number;
  apr: number;
  dueDate?: string | null;
}

interface DebtPlanRow {
  index: number;
  label: string;
  name: string;
  last4?: string;
  balance: number;
  minPayment: number;
  apr: number;
  monthlyRate: number;
  totalPayment: number;
  monthsToPayoff: number;
  cumulativeMonths: number;
  dueDate?: string | null;
}

interface ComputeResult {
  rows: DebtPlanRow[];
  totals: {
    numDebts: number;
    sumBalance: number;
    sumMinPayment: number;
    strategy: Strategy;
    extraMonthly: number;
    oneTime: number;
    totalMonths: number;
  };
}

export function DebtCalculator() {
  const [debts, setDebts] = useState<DebtInput[]>([
    { name: "", last4: "", balance: 0, minPayment: 0, apr: 0, dueDate: "" }
  ]);
  const [extra, setExtra] = useState(0);
  const [oneTime, setOneTime] = useState(0);
  const [strategy, setStrategy] = useState<Strategy>("snowball");
  const [result, setResult] = useState<ComputeResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const updateDebt = (index: number, field: keyof DebtInput, value: any) => {
    const newDebts = [...debts];
    newDebts[index] = { ...newDebts[index], [field]: value };
    setDebts(newDebts);
  };

  const addDebt = () => {
    setDebts([...debts, { name: "", last4: "", balance: 0, minPayment: 0, apr: 0, dueDate: "" }]);
  };

  const removeDebt = (index: number) => {
    setDebts(debts.filter((_, i) => i !== index));
  };

  const compute = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.functions.invoke('compute-debt-plan', {
        body: {
          debts: debts.map(d => ({ ...d, apr: d.apr > 1 ? d.apr / 100 : d.apr })),
          extraMonthly: extra,
          oneTime,
          strategy
        }
      });

      if (error) throw error;
      setResult(data);
      toast({ title: "Success", description: "Debt plan calculated successfully" });
    } catch (error) {
      console.error('Error computing plan:', error);
      toast({ title: "Error", description: "Failed to compute debt plan", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const exportCSV = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-debt-csv`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
        },
        body: JSON.stringify({
          debts: debts.map(d => ({ ...d, apr: d.apr > 1 ? d.apr / 100 : d.apr })),
          extraMonthly: extra,
          oneTime,
          strategy
        })
      });

      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'debt_snowball.csv';
      a.click();
      URL.revokeObjectURL(url);
      
      toast({ title: "Success", description: "CSV exported successfully" });
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast({ title: "Error", description: "Failed to export CSV", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const exportXLSX = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-debt-xlsx`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
        },
        body: JSON.stringify({
          debts: debts.map(d => ({ ...d, apr: d.apr > 1 ? d.apr / 100 : d.apr })),
          extraMonthly: extra,
          oneTime,
          strategy
        })
      });

      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'debt_snowball.xlsx';
      a.click();
      URL.revokeObjectURL(url);
      
      toast({ title: "Success", description: "Excel file exported successfully" });
    } catch (error) {
      console.error('Error exporting XLSX:', error);
      toast({ title: "Error", description: "Failed to export Excel file", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Debt Snowball Calculator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="extra">Extra Monthly Payment</Label>
              <Input
                id="extra"
                type="number"
                step="0.01"
                value={extra}
                onChange={(e) => setExtra(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="oneTime">One-time Payment</Label>
              <Input
                id="oneTime"
                type="number"
                step="0.01"
                value={oneTime}
                onChange={(e) => setOneTime(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="strategy">Method</Label>
              <Select value={strategy} onValueChange={(value: Strategy) => setStrategy(value)}>
                <SelectTrigger id="strategy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="snowball">Snowball</SelectItem>
                  <SelectItem value="avalanche">Avalanche</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Debts</h3>
              <Button onClick={addDebt} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Debt
              </Button>
            </div>

            {debts.map((debt, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={debt.name}
                        onChange={(e) => updateDebt(index, 'name', e.target.value)}
                        placeholder="Credit Card"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Last 4</Label>
                      <Input
                        value={debt.last4 || ''}
                        onChange={(e) => updateDebt(index, 'last4', e.target.value)}
                        maxLength={4}
                        placeholder="1234"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Balance</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={debt.balance}
                        onChange={(e) => updateDebt(index, 'balance', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Min Payment</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={debt.minPayment}
                        onChange={(e) => updateDebt(index, 'minPayment', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>APR (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={debt.apr}
                        onChange={(e) => updateDebt(index, 'apr', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2 flex items-end">
                      <Button
                        onClick={() => removeDebt(index)}
                        variant="destructive"
                        size="icon"
                        disabled={debts.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button onClick={compute} disabled={isLoading} className="w-full">
            {isLoading ? 'Computing...' : 'Compute Plan'}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Payoff Plan</CardTitle>
              <div className="flex gap-2">
                <Button onClick={exportCSV} variant="outline" size="sm" disabled={isLoading}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button onClick={exportXLSX} variant="outline" size="sm" disabled={isLoading}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Excel
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Debt</th>
                    <th className="text-right p-2">Balance</th>
                    <th className="text-right p-2">Min Payment</th>
                    <th className="text-right p-2">APR</th>
                    <th className="text-right p-2">Months</th>
                    <th className="text-right p-2">Total Months</th>
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row) => (
                    <tr key={row.index} className="border-b">
                      <td className="p-2">{row.label}</td>
                      <td className="text-right p-2">${row.balance.toFixed(2)}</td>
                      <td className="text-right p-2">${row.minPayment.toFixed(2)}</td>
                      <td className="text-right p-2">{(row.apr * 100).toFixed(2)}%</td>
                      <td className="text-right p-2">{row.monthsToPayoff}</td>
                      <td className="text-right p-2">{row.cumulativeMonths}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Total Months</div>
                  <div className="text-2xl font-bold">{result.totals.totalMonths}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Total Debts</div>
                  <div className="text-2xl font-bold">{result.totals.numDebts}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Total Balance</div>
                  <div className="text-2xl font-bold">${result.totals.sumBalance.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Min Payments</div>
                  <div className="text-2xl font-bold">${result.totals.sumMinPayment.toFixed(2)}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
