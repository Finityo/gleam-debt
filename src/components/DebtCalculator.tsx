import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  const [extra, setExtra] = useState<number | string>("");
  const [oneTime, setOneTime] = useState<number | string>("");
  const [strategy, setStrategy] = useState<Strategy>("snowball");
  const [result, setResult] = useState<ComputeResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load saved data on mount
  useEffect(() => {
    loadSavedData();
  }, []);

  // Auto-save debts when they change
  useEffect(() => {
    if (debts.length > 0 && debts[0].name !== "") {
      saveDebts();
    }
  }, [debts]);

  // Auto-save settings when they change
  useEffect(() => {
    if (extra !== "" || oneTime !== "" || strategy !== "snowball") {
      saveSettings();
    }
  }, [extra, oneTime, strategy]);

  const loadSavedData = async () => {
    try {
      // Clear any previous results to start fresh
      setResult(null);
      
      // Load debts
      const { data: debtsData, error: debtsError } = await supabase
        .from('debts')
        .select('*')
        .order('created_at', { ascending: true });

      if (debtsError) throw debtsError;

      if (debtsData && debtsData.length > 0) {
        setDebts(debtsData.map(d => ({
          id: d.id,
          name: d.name,
          last4: d.last4 || '',
          balance: Number(d.balance),
          minPayment: Number(d.min_payment),
          apr: Number(d.apr),
          dueDate: d.due_date || ''
        })));
      }

      // Load settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('debt_calculator_settings')
        .select('*')
        .single();

      if (!settingsError && settingsData) {
        setExtra(Number(settingsData.extra_monthly));
        setOneTime(Number(settingsData.one_time));
        // Always default to snowball strategy
      }
      
      // Ensure strategy is always snowball on load
      setStrategy('snowball');
    } catch (error: any) {
      console.error('Error loading saved data:', error);
    }
  };

  const saveDebts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Delete existing debts
      await supabase.from('debts').delete().eq('user_id', user.id);

      // Insert new debts (only non-empty ones)
      const debtsToSave = debts.filter(d => d.name.trim() !== '');
      if (debtsToSave.length > 0) {
        const { error } = await supabase.from('debts').insert(
          debtsToSave.map(d => ({
            user_id: user.id,
            name: d.name,
            last4: d.last4 || null,
            balance: d.balance,
            min_payment: d.minPayment,
            apr: d.apr,
            due_date: d.dueDate || null
          }))
        );

        if (error) throw error;
      }
    } catch (error: any) {
      console.error('Error saving debts:', error);
    }
  };

  const saveSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('debt_calculator_settings')
        .upsert({
          user_id: user.id,
          extra_monthly: Number(extra) || 0,
          one_time: Number(oneTime) || 0,
          strategy
        });

      if (error) throw error;
    } catch (error: any) {
      console.error('Error saving settings:', error);
    }
  };

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

  const compute = async (useStrategy?: Strategy) => {
    try {
      // Check for duplicate "last 4" values
      const last4Values = debts
        .filter(d => d.last4 && d.last4.trim() !== '')
        .map(d => d.last4?.trim());
      
      const duplicates = last4Values.filter((value, index) => 
        last4Values.indexOf(value) !== index
      );
      
      if (duplicates.length > 0) {
        toast({ 
          title: "Duplicate Detected", 
          description: `Duplicate "Last 4" found: ${[...new Set(duplicates)].join(', ')}. Please check your debts.`,
          variant: "destructive" 
        });
        return;
      }

      setIsLoading(true);
      const computeStrategy = useStrategy || strategy;
      const { data, error } = await supabase.functions.invoke('compute-debt-plan', {
        body: {
          debts: debts.map(d => ({ ...d, apr: d.apr > 1 ? d.apr / 100 : d.apr })),
          extraMonthly: Number(extra) || 0,
          oneTime: Number(oneTime) || 0,
          strategy: computeStrategy
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

  const handleStrategyChange = async (newStrategy: Strategy) => {
    setStrategy(newStrategy);
    if (result) {
      await compute(newStrategy);
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
          extraMonthly: Number(extra) || 0,
          oneTime: Number(oneTime) || 0,
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
          extraMonthly: Number(extra) || 0,
          oneTime: Number(oneTime) || 0,
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
    <div className="max-w-screen-xl mx-auto p-4 space-y-4">
      <h1 className="text-3xl font-bold">Debt Snowball Planner</h1>

      <Card>
        <CardHeader>
          <CardTitle>Configure Your Debts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="extra">Extra Monthly Payment</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="extra"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="pl-7"
                  value={extra}
                  onChange={(e) => setExtra(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="oneTime">One-time Payment</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="oneTime"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="pl-7"
                  value={oneTime}
                  onChange={(e) => setOneTime(e.target.value)}
                />
              </div>
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
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          className="pl-7"
                          value={debt.balance || ''}
                          onChange={(e) => updateDebt(index, 'balance', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Min Payment</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          className="pl-7"
                          value={debt.minPayment || ''}
                          onChange={(e) => updateDebt(index, 'minPayment', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>APR (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        placeholder="18.99"
                        value={debt.apr || ''}
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

          <Button onClick={() => compute()} disabled={isLoading} className="w-full">
            {isLoading ? 'Computing...' : 'Compute Plan'}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Tabs defaultValue="snowball" className="w-full">
          <TabsList className="grid grid-cols-3 h-auto gap-2">
            <TabsTrigger value="snowball">Snowball Plan</TabsTrigger>
            <TabsTrigger value="calendar">Payoff Calendar</TabsTrigger>
            <TabsTrigger value="mobile">Mobile View</TabsTrigger>
            <TabsTrigger value="summary" className="col-start-2">Printable Summary</TabsTrigger>
          </TabsList>

          <TabsContent value="snowball">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <CardTitle>Strategy</CardTitle>
                    <Select value={strategy} onValueChange={(value: Strategy) => handleStrategyChange(value)}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="snowball">Snowball</SelectItem>
                        <SelectItem value="avalanche">Avalanche</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={exportXLSX} variant="outline" size="sm" disabled={isLoading}>
                    <Download className="h-4 w-4 mr-2" />
                    Excel
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Creditor</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                        <TableHead className="text-right">Min Payment</TableHead>
                        <TableHead className="text-right">APR</TableHead>
                        <TableHead className="text-right">Est. Months</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.rows.map((row) => (
                        <TableRow key={row.index}>
                          <TableCell className="font-medium">{row.label}</TableCell>
                          <TableCell className="text-right">${row.balance.toFixed(2)}</TableCell>
                          <TableCell className="text-right">${row.minPayment.toFixed(2)}</TableCell>
                          <TableCell className="text-right">{(row.apr * 100).toFixed(2)}%</TableCell>
                          <TableCell className="text-right">{row.monthsToPayoff}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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
          </TabsContent>

          <TabsContent value="calendar">
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">Monthly Payoff Calendar</h2>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="sticky left-0 bg-background z-10">Month</TableHead>
                        {result.rows.map((debt) => (
                          <TableHead key={debt.index} className="text-center min-w-[200px]">
                            <div className="font-semibold">{debt.name}</div>
                            {debt.last4 && <div className="text-xs text-muted-foreground">({debt.last4})</div>}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                     <TableBody>
                      {(() => {
                        const maxMonths = Math.max(...result.rows.map(r => r.cumulativeMonths));
                        const monthRows = [];
                        const extraPayment = result.totals.extraMonthly;
                        const oneTimePayment = result.totals.oneTime;
                        
                        // Initialize debt tracking - use actual entered debt data
                        const debtsTracking = result.rows.map(d => {
                          // Find the matching debt from the entered debts
                          const enteredDebt = debts.find(ed => 
                            ed.name === d.name && ed.balance === d.balance
                          );
                          
                          return {
                            name: enteredDebt?.name || d.name,
                            last4: enteredDebt?.last4 || d.last4,
                            balance: d.balance,
                            minPayment: d.minPayment,
                            apr: d.apr,
                            monthlyRate: d.monthlyRate,
                            snowballPayment: 0,
                            totalInterest: 0,
                            totalPaid: 0,
                            originalBalance: d.balance
                          };
                        });
                        
                        // Apply one-time payment to first debt
                        if (oneTimePayment > 0 && debtsTracking.length > 0) {
                          debtsTracking[0].balance = Math.max(0, debtsTracking[0].balance - oneTimePayment);
                        }
                        
                        // Generate monthly rows
                        for (let month = 1; month <= maxMonths; month++) {
                          const monthData = [];
                          
                          for (let i = 0; i < debtsTracking.length; i++) {
                            const debt = debtsTracking[i];
                            
                            if (debt.balance > 0) {
                              // Calculate interest for this month
                              const interest = debt.balance * debt.monthlyRate;
                              
                              // Calculate payment (min + snowball, but not more than balance + interest)
                              const payment = Math.min(
                                debt.minPayment + debt.snowballPayment,
                                debt.balance + interest
                              );
                              
                              // Apply payment
                              const principalPayment = payment - interest;
                              debt.balance = Math.max(0, debt.balance - principalPayment);
                              
                              // Track totals
                              debt.totalInterest += interest;
                              debt.totalPaid += payment;
                              
                              // Calculate cumulative paid
                              const cumulativePaid = debt.originalBalance - debt.balance;
                              
                              monthData.push({
                                payment: payment,
                                cumulativePaid: cumulativePaid,
                                remainingBalance: debt.balance,
                                isPaidOff: debt.balance === 0
                              });
                              
                              // If debt is paid off this month, snowball to next unpaid debt
                              if (debt.balance === 0) {
                                const snowballAmount = debt.minPayment + debt.snowballPayment;
                                
                                // Find next unpaid debt
                                for (let j = i + 1; j < debtsTracking.length; j++) {
                                  if (debtsTracking[j].balance > 0) {
                                    debtsTracking[j].snowballPayment += snowballAmount;
                                    break;
                                  }
                                }
                              }
                            } else {
                              // Already paid off
                              monthData.push({
                                payment: 0,
                                cumulativePaid: debt.originalBalance,
                                remainingBalance: 0,
                                isPaidOff: true
                              });
                            }
                          }
                          
                          // Render the month row
                          monthRows.push(
                            <TableRow key={month}>
                              <TableCell className="sticky left-0 bg-background z-10 font-medium">
                                Month {month}
                              </TableCell>
                              {monthData.map((data, idx) => (
                                <TableCell key={idx} className={`text-center p-2 ${data.isPaidOff ? 'bg-muted/30' : ''}`}>
                                  {data.isPaidOff && data.payment === 0 ? (
                                    <div className="text-xs text-muted-foreground">Paid Off</div>
                                  ) : (
                                    <div className="text-xs space-y-1">
                                      <div className="font-medium text-primary">
                                        ${data.payment.toFixed(2)}
                                      </div>
                                      <div className="text-muted-foreground">
                                        Paid: ${data.cumulativePaid.toFixed(2)}
                                      </div>
                                      <div className="text-muted-foreground">
                                        Left: ${data.remainingBalance.toFixed(2)}
                                      </div>
                                    </div>
                                  )}
                                </TableCell>
                              ))}
                            </TableRow>
                          );
                        }
                        
                        return monthRows;
                      })()}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="summary">
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">Printable Summary</h2>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Creditor</TableHead>
                        <TableHead>Last 4</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                        <TableHead className="text-right">Min Payment</TableHead>
                        <TableHead className="text-right">APR</TableHead>
                        <TableHead>Included</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.rows.map((row) => (
                        <TableRow key={row.index}>
                          <TableCell className="font-medium">{row.name}</TableCell>
                          <TableCell>{row.last4 || 'N/A'}</TableCell>
                          <TableCell className="text-right">${row.balance.toFixed(2)}</TableCell>
                          <TableCell className="text-right">${row.minPayment.toFixed(2)}</TableCell>
                          <TableCell className="text-right">{(row.apr * 100).toFixed(2)}%</TableCell>
                          <TableCell>Yes</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="mt-6 print:mt-4">
                  <h3 className="font-semibold mb-2">Summary</h3>
                  <div className="text-sm space-y-1">
                    <p>Strategy: <span className="font-medium">{result.totals.strategy}</span></p>
                    <p>Extra Monthly: <span className="font-medium">${result.totals.extraMonthly.toFixed(2)}</span></p>
                    <p>One-Time Payment: <span className="font-medium">${result.totals.oneTime.toFixed(2)}</span></p>
                    <p>Total Payoff Time: <span className="font-medium">{result.totals.totalMonths} months</span></p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mobile">
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">Mobile-Friendly Snowball</h2>
                <div className="grid grid-cols-1 gap-4">
                  {result.rows.map((row) => (
                    <div key={row.index} className="bg-accent/50 p-4 rounded-xl shadow-sm">
                      <div className="text-lg font-bold mb-2">{row.label}</div>
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Balance:</span>
                          <span className="font-medium">${row.balance.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Min Payment:</span>
                          <span className="font-medium">${row.minPayment.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">APR:</span>
                          <span className="font-medium">{(row.apr * 100).toFixed(2)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Payoff Months:</span>
                          <span className="font-medium">{row.monthsToPayoff}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
