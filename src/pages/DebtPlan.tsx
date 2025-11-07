import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, Download, Info, ChevronDown, Printer, CheckCircle2, XCircle } from 'lucide-react';
import { PrintExportButton } from '@/components/PrintExportButton';
import { DemoBanner } from '@/components/DemoBanner';
import { PlanVersionButton } from '@/components/PlanVersionButton';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { logError } from '@/utils/logger';
import { DEMO } from '@/config/demo';

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

const validateDebtSnowball = (schedule: MonthlySnapshot[]) => {
  const debtOrder: string[] = [];
  const debtBalances: Record<string, number[]> = {};
  const debtPayments: Record<string, number[]> = {};

  schedule.forEach(month => {
    month.debts.forEach(debt => {
      if (!debtBalances[debt.name]) {
        debtBalances[debt.name] = [];
        debtPayments[debt.name] = [];
      }
      debtBalances[debt.name].push(debt.endBalance);
      debtPayments[debt.name].push(debt.payment);
    });
  });

  // Sort debts by starting balance
  const orderedDebts = Object.entries(debtBalances)
    .map(([name, balances]) => ({ name, start: balances[0] }))
    .sort((a, b) => a.start - b.start)
    .map(d => d.name);

  const issues: string[] = [];
  let isValid = true;
  let previousPaymentSum = 0;

  orderedDebts.forEach((debtName, i) => {
    const payments = debtPayments[debtName];
    const startPayment = payments[0];
    const endPayment = payments[payments.length - 1];

    // Check if debt was actually paid off
    const lastBalance = debtBalances[debtName][debtBalances[debtName].length - 1];
    const paidOff = lastBalance <= 0.01;

    if (!paidOff) {
      issues.push(`⚠️ ${debtName} not fully paid off`);
      isValid = false;
    }

    // Verify snowball progression
    if (i > 0 && startPayment < previousPaymentSum) {
      issues.push(`❌ ${debtName} payment did not include rolled-over amount (${
        startPayment
      } vs ${previousPaymentSum})`);
      isValid = false;
    }

    previousPaymentSum = startPayment;
  });

  return {
    isValid,
    issues,
    orderedDebts,
    details: orderedDebts.map(name => ({
      name,
      startBalance: debtBalances[name][0],
      endBalance: debtBalances[name].at(-1),
      payments: debtPayments[name].slice(0, 6),
    })),
  };
};

const DebtPlan = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [result, setResult] = useState<ComputeResult | null>(location.state?.result || null);
  const [strategy, setStrategy] = useState<Strategy>('snowball');
  const [debts, setDebts] = useState<DebtInput[]>(location.state?.debts || []);
  const [extra, setExtra] = useState<number>(location.state?.extra || 0);
  const [oneTime, setOneTime] = useState<number>(location.state?.oneTime || 0);
  const [isLoading, setIsLoading] = useState(true);
  const [validationResult, setValidationResult] = useState<any>(null);
  const isLoadingRef = useRef(false);

  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    loadPrecomputedPlan();
  }, []);

  const loadPrecomputedPlan = async () => {
    // Prevent duplicate loads
    if (isLoadingRef.current) return;
    
    // In demo mode, use data from location.state if available
    if (DEMO && location.state?.result) {
      setResult(location.state.result);
      setDebts(location.state.debts || []);
      setExtra(location.state.extra || 0);
      setOneTime(location.state.oneTime || 0);
      setStrategy(location.state.strategy || 'snowball');
      setIsLoading(false);
      return;
    }
    
    // Skip database loading in demo mode if no data
    if (DEMO) {
      setIsLoading(false);
      toast({ 
        title: "Demo Mode", 
        description: "Please compute a debt plan from the Debts page first.",
        variant: "default"
      });
      navigate('/debts?demo=true');
      return;
    }
    
    try {
      isLoadingRef.current = true;
      setIsLoading(true);
      
      // Fetch the pre-computed plan for the current strategy
      const { data: plan, error } = await supabase
        .from('debt_plans')
        .select('*')
        .eq('strategy', strategy)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (plan) {
        setResult(plan.plan_data as unknown as ComputeResult);
        setDebts(plan.debt_snapshot as unknown as DebtInput[]);
        setExtra(parseFloat(plan.extra_monthly?.toString() || '0'));
        setOneTime(parseFloat(plan.one_time?.toString() || '0'));
        
        // Validate snowball logic if strategy is snowball and schedule exists
        if (strategy === 'snowball' && (plan.plan_data as any)?.schedule) {
          const validation = validateDebtSnowball((plan.plan_data as any).schedule);
          setValidationResult(validation);
        } else {
          setValidationResult(null);
        }
      } else {
        // No pre-computed plan found, redirect to debts page
        toast({ 
          title: "No Plan Available", 
          description: "Please add your debts first to generate a payoff plan.",
          variant: "default"
        });
        navigate('/debts');
      }
    } catch (error) {
      logError('DebtPlan - Load Plan', error);
      toast({ title: "Error", description: "Failed to load debt plan", variant: "destructive" });
      navigate('/debts');
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  };

  const handleStrategyChange = async (newStrategy: Strategy) => {
    // Prevent duplicate loads
    if (isLoadingRef.current) return;
    
    // In demo mode, switch between pre-computed plans
    if (DEMO) {
      const snowballPlan = location.state?.snowballPlan;
      const avalanchePlan = location.state?.avalanchePlan;
      
      if (!snowballPlan || !avalanchePlan) {
        toast({ 
          title: "Demo Mode", 
          description: "Please recompute your plan from the Debts page to switch strategies.",
          duration: 3000
        });
        return;
      }
      
      setStrategy(newStrategy);
      const newPlan = newStrategy === 'snowball' ? snowballPlan : avalanchePlan;
      setResult(newPlan);
      
      // Validate snowball logic if new strategy is snowball and schedule exists
      if (newStrategy === 'snowball' && newPlan?.schedule) {
        const validation = validateDebtSnowball(newPlan.schedule);
        setValidationResult(validation);
      } else {
        setValidationResult(null);
      }
      
      toast({ 
        title: "Strategy Changed", 
        description: `Now viewing ${newStrategy === 'snowball' ? 'Snowball' : 'Avalanche'} method`,
        duration: 2000
      });
      return;
    }
    
    setStrategy(newStrategy);
    try {
      isLoadingRef.current = true;
      setIsLoading(true);
      
      // Fetch the pre-computed plan for the new strategy
      const { data: plan, error } = await supabase
        .from('debt_plans')
        .select('*')
        .eq('strategy', newStrategy)
        .single();

      if (error) throw error;
      
      if (plan) {
        setResult(plan.plan_data as unknown as ComputeResult);
        setDebts(plan.debt_snapshot as unknown as DebtInput[]);
        setExtra(parseFloat(plan.extra_monthly?.toString() || '0'));
        setOneTime(parseFloat(plan.one_time?.toString() || '0'));
        
        // Validate snowball logic if new strategy is snowball and schedule exists
        if (newStrategy === 'snowball' && (plan.plan_data as any)?.schedule) {
          const validation = validateDebtSnowball((plan.plan_data as any).schedule);
          setValidationResult(validation);
        } else {
          setValidationResult(null);
        }
      }
    } catch (error) {
      logError('DebtPlan - Switch Strategy', error);
      toast({ title: "Error", description: "Failed to load debt plan for this strategy", variant: "destructive" });
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your debt payoff plan...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <DemoBanner />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-semibold text-finityo-textMain">
              Your Plan
            </h1>
            <PlanVersionButton />
          </div>
          
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
              <h2 className="text-4xl font-bold text-foreground">Your Debt Payoff Plan</h2>
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
                {validationResult && strategy === 'snowball' && (
                  <Alert className={`mb-6 ${validationResult.isValid ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20'}`}>
                    <div className="flex items-start gap-3">
                      {validationResult.isValid ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <AlertTitle className="text-sm font-semibold mb-2">
                          Snowball Method Validation
                        </AlertTitle>
                        <AlertDescription className="text-sm space-y-1">
                          {validationResult.isValid ? (
                            <div className="leading-relaxed">✅ Snowball validation passed! All debts follow the correct payoff order and payment progression.</div>
                          ) : (
                            <>
                              <div className="leading-relaxed mb-2">⚠️ Issues detected in snowball progression:</div>
                              {validationResult.issues.map((issue: string, idx: number) => (
                                <div key={idx} className="leading-relaxed ml-4">{issue}</div>
                              ))}
                            </>
                          )}
                        </AlertDescription>
                      </div>
                    </div>
                  </Alert>
                )}
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
                          <TableCell className="text-right">{row.apr.toFixed(2)}%</TableCell>
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
            <div className="space-y-3">
              <div className="mb-4">
                <h2 className="text-2xl font-semibold mb-2">Monthly Payoff Calendar</h2>
                <p className="text-sm text-muted-foreground">
                  Click any month to expand and view detailed payment breakdown
                </p>
              </div>
              
              {result.schedule && result.schedule.map((snapshot) => (
                <Collapsible key={snapshot.month}>
                  <Card className="overflow-hidden">
                    <CollapsibleTrigger className="w-full">
                      <CardHeader className="flex flex-row items-center justify-between py-4 hover:bg-muted/50 transition-colors cursor-pointer">
                        <div className="text-left flex-1">
                          <div className="flex items-center gap-3">
                            <CardTitle className="text-lg">Month {snapshot.month}</CardTitle>
                            <div className="text-sm text-muted-foreground">
                              Snowball: <span className="font-semibold text-foreground">${snapshot.snowballExtra.toFixed(2)}</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Remaining: <span className="font-semibold text-foreground">${snapshot.totalRemaining.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                        <ChevronDown className="h-5 w-5 shrink-0 transition-transform duration-200 data-[state=open]:rotate-180" />
                      </CardHeader>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <CardContent className="pt-0 pb-4">
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                          {snapshot.debts.map((debt, idx) => (
                            <div 
                              key={idx} 
                              className="p-4 bg-muted/50 rounded-lg border border-border/50"
                            >
                              <div className="font-semibold mb-3 text-sm">
                                {debt.name}
                                {debt.last4 && <span className="text-muted-foreground ml-1">({debt.last4})</span>}
                              </div>
                              
                              {debt.endBalance > 0 ? (
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Payment:</span>
                                    <span className="font-medium">${debt.payment.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Interest:</span>
                                    <span className="text-orange-600 dark:text-orange-400">${debt.interest.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Principal:</span>
                                    <span className="text-green-600 dark:text-green-400">${debt.principal.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between pt-2 border-t border-border/50">
                                    <span className="text-muted-foreground font-medium">Balance:</span>
                                    <span className="font-bold">${debt.endBalance.toFixed(2)}</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-green-600 dark:text-green-400 font-semibold text-center py-4">
                                  ✓ PAID OFF
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              ))}
            </div>
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
                        <ChevronDown className="h-5 w-5 shrink-0 transition-transform duration-200" />
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
              <CardHeader className="flex flex-row items-center justify-between print:block">
                <CardTitle>Debt Payoff Summary</CardTitle>
                <Button 
                  onClick={() => window.print()} 
                  variant="outline"
                  className="print:hidden"
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
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
