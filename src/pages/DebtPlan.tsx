import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { ArrowLeft, Download, Info, ChevronDown, Printer, Calendar, DollarSign, TrendingUp, CheckCircle2, Circle } from 'lucide-react';
import { PrintExportButton } from '@/components/PrintExportButton';
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

  const handlePrint = () => {
    window.print();
  };

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

  if (!result) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex gap-2 no-print">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/dashboard')}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/debts')}
                >
                  Debt Management
                </Button>
              </div>
              <h1 className="text-4xl font-bold text-foreground">Your Debt Payoff Plan</h1>
              <p className="text-muted-foreground mt-2">
                Review your personalized debt payoff strategy
              </p>
            </div>
            <div className="no-print">
              <PrintExportButton onPrint={handlePrint} />
            </div>
          </div>
        </div>

        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">How to Read Your Debt Payoff Plan</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="strategies">
                <AccordionTrigger className="text-left">Understanding Debt Payoff Strategies</AccordionTrigger>
                <AccordionContent className="space-y-3 text-muted-foreground">
                  <div>
                    <strong className="text-foreground">Snowball Method:</strong> Focuses on paying off your smallest balance first, regardless of interest rate. This builds momentum and motivation as you quickly eliminate debts one by one.
                  </div>
                  <div>
                    <strong className="text-foreground">Avalanche Method:</strong> Focuses on paying off your highest interest rate debt first. This saves you the most money in interest charges over time.
                  </div>
                  <div className="text-sm italic">
                    You can switch between strategies using the dropdown to see which approach works best for your situation.
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="table">
                <AccordionTrigger className="text-left">Reading the Debt Strategy Table</AccordionTrigger>
                <AccordionContent className="space-y-3 text-muted-foreground">
                  <div>
                    <strong className="text-foreground">Balance:</strong> The current amount you owe on this debt.
                  </div>
                  <div>
                    <strong className="text-foreground">Min Payment:</strong> The minimum monthly payment required by your creditor.
                  </div>
                  <div>
                    <strong className="text-foreground">APR:</strong> Annual Percentage Rate - the yearly interest rate charged on your debt.
                  </div>
                  <div>
                    <strong className="text-foreground">Est. Months:</strong> Estimated number of months to pay off this specific debt using your chosen strategy.
                  </div>
                  <div>
                    <strong className="text-foreground">Due Date:</strong> The day of the month your payment is due to avoid late fees.
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="calendar">
                <AccordionTrigger className="text-left">Understanding the Payoff Calendar</AccordionTrigger>
                <AccordionContent className="space-y-3 text-muted-foreground">
                  <div>
                    <strong className="text-foreground">Snowball Total:</strong> The extra payment amount (beyond minimums) being applied to accelerate debt payoff each month. As debts are paid off, their minimum payments roll into this amount.
                  </div>
                  <div>
                    <strong className="text-foreground">Payment:</strong> Total amount paid toward this debt for the month (includes minimum + extra).
                  </div>
                  <div>
                    <strong className="text-foreground">Interest (Int):</strong> Portion of your payment that goes toward interest charges - this doesn't reduce your balance.
                  </div>
                  <div>
                    <strong className="text-foreground">Principal (Prin):</strong> Portion of your payment that reduces your actual debt balance - this is the good stuff!
                  </div>
                  <div>
                    <strong className="text-foreground">Balance (Bal):</strong> Remaining amount owed at the end of the month.
                  </div>
                  <div>
                    <strong className="text-foreground">PAID OFF ✓:</strong> Congratulations! This debt is completely eliminated.
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="snowball-effect">
                <AccordionTrigger className="text-left">The Snowball Effect Explained</AccordionTrigger>
                <AccordionContent className="space-y-3 text-muted-foreground">
                  <div>
                    The power of the snowball/avalanche method comes from the rolling payments. Here's how it works:
                  </div>
                  <ol className="list-decimal list-inside space-y-2 ml-2">
                    <li>You pay minimums on all debts plus extra toward your target debt</li>
                    <li>When the first debt is paid off, you take that entire payment amount...</li>
                    <li>...and add it to the minimum of the next target debt</li>
                    <li>This creates larger and larger payments that eliminate debts faster</li>
                    <li>The "snowball" gets bigger with each paid-off debt!</li>
                  </ol>
                  <div className="text-sm italic mt-3">
                    Watch the "Snowball Total" column in the Payoff Calendar grow as debts are eliminated - that's your momentum building!
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="tips">
                <AccordionTrigger className="text-left">Tips for Success</AccordionTrigger>
                <AccordionContent className="space-y-3 text-muted-foreground">
                  <ul className="list-disc list-inside space-y-2 ml-2">
                    <li>Pay attention to due dates to avoid late fees that set you back</li>
                    <li>Any extra money you can add speeds up the entire timeline</li>
                    <li>Consider the psychological benefit of quick wins (snowball) vs. maximum savings (avalanche)</li>
                    <li>Export to Excel to track your actual progress against this plan</li>
                    <li>Review and update your plan if your financial situation changes</li>
                    <li>Celebrate each paid-off debt - you're making real progress!</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

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
                <div className="flex flex-col items-center gap-4">
                  <div className="flex flex-col items-center gap-2">
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
                    Export to Excel
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
                <div className="mt-4 space-y-4">
                  {/* Debt Free Date Banner */}
                  <div className="p-6 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg border-2 border-green-500/50">
                    <div className="text-center">
                      <div className="text-sm font-medium text-muted-foreground mb-1">Forecasted Debt Free Date</div>
                      <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {new Date(new Date().setMonth(new Date().getMonth() + result.totals.totalMonths)).toLocaleDateString('en-US', { 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {result.totals.totalMonths} months from now
                      </div>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="p-4 bg-muted rounded-lg">
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
            <div className="space-y-2">
              {result.schedule && result.schedule.map((snapshot) => (
                <Collapsible key={snapshot.month}>
                  <Card>
                    <CollapsibleTrigger className="w-full">
                      <CardHeader className="flex flex-row items-center justify-between py-4 hover:bg-muted/50 transition-colors">
                        <div className="text-left">
                          <CardTitle className="text-lg">Month {snapshot.month}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            Total paid: ${snapshot.totalPaidThisMonth.toFixed(2)} | Snowball: ${snapshot.snowballExtra.toFixed(2)}
                          </p>
                        </div>
                        <ChevronDown className="h-5 w-5 shrink-0 transition-transform duration-200 [&[data-state=open]]:rotate-180" />
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="space-y-4 pt-0">
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
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
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
