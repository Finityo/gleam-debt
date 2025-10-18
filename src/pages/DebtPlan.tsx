import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { logError } from '@/utils/logger';

type Strategy = "snowball" | "avalanche";

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

interface MonthlySnapshot {
  month: number;
  debts: Array<{
    name: string;
    last4?: string;
    payment: number;
    interest: number;
    principal: number;
    endBalance: number;
  }>;
  snowballExtra: number;
  totalPaidThisMonth: number;
  totalRemaining: number;
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
    debtFreeMonth?: number;
  };
  schedule?: MonthlySnapshot[];
  payoffOrder?: string[];
}

interface DebtInput {
  name: string;
  last4?: string;
  balance: number;
  minPayment: number;
  apr: number;
  dueDate?: string | null;
}

const formatDueDate = (dueDate?: string | null): string => {
  if (!dueDate) return '';
  
  const day = parseInt(dueDate.trim());
  if (isNaN(day)) return '';
  
  const suffix = (d: number) => {
    if (d >= 11 && d <= 13) return 'th';
    switch (d % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };
  
  return `Due ${day}${suffix(day)} of Every Month`;
};

const DebtPlan = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [result, setResult] = useState<ComputeResult | null>(location.state?.result || null);
  const [strategy, setStrategy] = useState<Strategy>(location.state?.strategy || 'snowball');
  const [debts, setDebts] = useState<DebtInput[]>(location.state?.debts || []);
  const [extra, setExtra] = useState<number>(location.state?.extra || 0);
  const [oneTime, setOneTime] = useState<number>(location.state?.oneTime || 0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!result) {
      navigate('/debts');
    }
  }, [result, navigate]);

  const handleStrategyChange = async (newStrategy: Strategy) => {
    setStrategy(newStrategy);
    try {
      setIsLoading(true);
      const { data, error } = await supabase.functions.invoke('compute-debt-plan', {
        body: {
          debts: debts.map(d => ({ ...d, apr: d.apr > 1 ? d.apr / 100 : d.apr })),
          extraMonthly: extra,
          oneTime: oneTime,
          strategy: newStrategy
        }
      });

      if (error) throw error;
      setResult(data);
    } catch (error) {
      logError('DebtPlan - Compute Plan', error);
      toast({ title: "Error", description: "Failed to compute debt plan", variant: "destructive" });
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
          oneTime: oneTime,
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
      logError('DebtPlan - Export XLSX', error);
      toast({ title: "Error", description: "Failed to export Excel file", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (!result) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/debts')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Debt Management
          </Button>
          <h1 className="text-4xl font-bold text-foreground">Your Debt Payoff Plan</h1>
          <p className="text-muted-foreground mt-2">
            Review your personalized debt payoff strategy
          </p>
        </div>

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
                        <TableHead>Due Date</TableHead>
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
                          <TableCell>{formatDueDate(row.dueDate) || 'N/A'}</TableCell>
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
                        <TableHead className="text-center min-w-[120px]">Snowball Total</TableHead>
                        {result.rows.map((debt) => (
                          <TableHead key={debt.index} className="text-center min-w-[200px]">
                            <div className="font-semibold">{debt.name}</div>
                            {debt.last4 && <div className="text-xs text-muted-foreground">({debt.last4})</div>}
                            {debt.dueDate && <div className="text-xs text-muted-foreground mt-1">{formatDueDate(debt.dueDate)}</div>}
                            <div className="text-xs text-muted-foreground mt-1">
                              Bal: ${debt.balance.toFixed(2)} | Min: ${debt.minPayment.toFixed(2)} | APR: {(debt.apr * 100).toFixed(1)}%
                            </div>
                          </TableHead>
                        ))}
                        <TableHead className="text-center min-w-[120px]">Remaining</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.schedule && result.schedule.map((snapshot) => (
                        <TableRow key={snapshot.month}>
                          <TableCell className="sticky left-0 bg-background z-10 font-medium">
                            Month {snapshot.month}
                          </TableCell>
                          <TableCell className="text-center font-medium">
                            ${snapshot.snowballExtra.toFixed(2)}
                          </TableCell>
                          {snapshot.debts.map((debt, idx) => (
                            <TableCell key={idx} className="text-center">
                              {debt.endBalance > 0 ? (
                                <div className="space-y-1">
                                  <div className="font-medium">${debt.payment.toFixed(2)}</div>
                                  <div className="text-xs text-muted-foreground">
                                    Int: ${debt.interest.toFixed(2)}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Prin: ${debt.principal.toFixed(2)}
                                  </div>
                                  <div className="text-xs font-medium">
                                    Bal: ${debt.endBalance.toFixed(2)}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-green-600 dark:text-green-400 font-semibold">PAID OFF ✓</div>
                              )}
                            </TableCell>
                          ))}
                          <TableCell className="text-center font-bold">
                            ${snapshot.totalRemaining.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mobile">
            <div className="space-y-4">
              {result.schedule && result.schedule.map((snapshot) => (
                <Card key={snapshot.month}>
                  <CardHeader>
                    <CardTitle>Month {snapshot.month}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Total paid: ${snapshot.totalPaidThisMonth.toFixed(2)} | Snowball: ${snapshot.snowballExtra.toFixed(2)}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {snapshot.debts.map((debt, idx) => (
                      <div key={idx} className="p-4 bg-muted rounded-lg">
                        <div className="font-semibold mb-2">{debt.name} {debt.last4 && `(${debt.last4})`}</div>
                        {debt.endBalance > 0 ? (
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>Payment: ${debt.payment.toFixed(2)}</div>
                            <div>Interest: ${debt.interest.toFixed(2)}</div>
                            <div>Principal: ${debt.principal.toFixed(2)}</div>
                            <div className="font-medium">Balance: ${debt.endBalance.toFixed(2)}</div>
                          </div>
                        ) : (
                          <div className="text-green-600 dark:text-green-400 font-semibold">PAID OFF ✓</div>
                        )}
                      </div>
                    ))}
                    <div className="p-4 bg-primary/10 rounded-lg font-bold">
                      Total Remaining: ${snapshot.totalRemaining.toFixed(2)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="summary">
            <Card className="print:shadow-none">
              <CardHeader>
                <CardTitle>Debt Payoff Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">Strategy</div>
                    <div className="text-lg font-bold capitalize">{result.totals.strategy}</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">Total Debts</div>
                    <div className="text-lg font-bold">{result.totals.numDebts}</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">Total Balance</div>
                    <div className="text-lg font-bold">${result.totals.sumBalance.toFixed(2)}</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">Payoff Time</div>
                    <div className="text-lg font-bold">{result.totals.totalMonths} months</div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Payoff Order</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order</TableHead>
                        <TableHead>Creditor</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                        <TableHead className="text-right">Min Payment</TableHead>
                        <TableHead className="text-right">APR</TableHead>
                        <TableHead className="text-right">Est. Months</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.rows.map((row, idx) => (
                        <TableRow key={row.index}>
                          <TableCell className="font-medium">{idx + 1}</TableCell>
                          <TableCell>{row.label}</TableCell>
                          <TableCell className="text-right">${row.balance.toFixed(2)}</TableCell>
                          <TableCell className="text-right">${row.minPayment.toFixed(2)}</TableCell>
                          <TableCell className="text-right">{(row.apr * 100).toFixed(2)}%</TableCell>
                          <TableCell className="text-right">{row.monthsToPayoff}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DebtPlan;
