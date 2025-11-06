import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { ArrowLeft, TrendingDown, CreditCard, DollarSign, PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { DEMO } from '@/config/demo';
import { mockDebts } from '@/lib/mockData';
import { formatAPR } from '@/lib/debtPlan';

interface Debt {
  id: string;
  name: string;
  balance: number;
  apr: number;
  last4: string;
  min_payment: number;
  due_date: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

const CHART_COLORS = [
  'hsl(270 70% 55%)', // primary
  'hsl(180 85% 55%)', // accent
  'hsl(0 85% 60%)',   // destructive
  'hsl(35 95% 60%)',  // warning
  'hsl(145 75% 50%)', // success
  'hsl(250 80% 60%)',
  'hsl(200 90% 55%)',
  'hsl(320 75% 55%)',
];

const DebtChart = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalDebt, setTotalDebt] = useState(0);
  const [totalLimit, setTotalLimit] = useState(0);
  const [plaidDebt, setPlaidDebt] = useState(0);

  useEffect(() => {
    loadDebts();
  }, []);

  const loadDebts = async () => {
    try {
      // In demo mode, use mock data
      if (DEMO) {
        const demoDebts = mockDebts.map((debt, index) => ({
          id: `demo-${index}`,
          name: debt.name,
          balance: debt.balance,
          apr: debt.apr,
          last4: debt.last4 || '',
          min_payment: debt.minPayment,
          due_date: debt.dueDate || '',
          user_id: 'demo-user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
        
        setDebts(demoDebts);
        const totalDebtAmount = demoDebts.reduce((sum, debt) => sum + debt.balance, 0);
        setTotalDebt(totalDebtAmount);
        
        // Demo mode: simulate Plaid credit accounts for credit utilization
        // Assume credit cards have 2x their balance as credit limit
        const creditCardDebts = demoDebts.filter(d => 
          d.name.toLowerCase().includes('credit card') || 
          d.name.toLowerCase().includes('visa')
        );
        
        const demoCreditUsed = creditCardDebts.reduce((sum, debt) => sum + debt.balance, 0);
        const demoCreditLimit = demoCreditUsed * 2; // Assume 50% utilization
        
        setPlaidDebt(demoCreditUsed);
        setTotalLimit(demoCreditLimit);
        
        setLoading(false);
        return;
      }
      
      // Skip database queries in demo mode
      if (!DEMO) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate('/auth');
          return;
        }

        // Fetch ALL debts (both Plaid-imported and Excel-imported)
        const { data: debtData, error: debtError } = await supabase
          .from('debts')
          .select('*')
          .eq('user_id', session.user.id)
          .order('balance', { ascending: false });

        if (debtError) throw debtError;

        const allDebts = debtData || [];
        setDebts(allDebts);
        
        // Calculate total debt from ALL sources
        const totalDebtAmount = allDebts.reduce((sum, debt) => sum + debt.balance, 0);
        
        // Fetch Plaid credit accounts for accurate credit utilization
        const { data: accounts, error: accountsError } = await supabase
          .from('plaid_accounts')
          .select('current_balance, available_balance, subtype, name, mask')
          .eq('user_id', session.user.id)
          .in('subtype', ['credit card', 'credit']);

        if (accountsError) throw accountsError;
        
        // Calculate credit utilization from Plaid accounts ONLY
        // (Excel imports don't have credit limit data)
        let plaidDebtAmount = 0;
        let creditLimit = 0;
        
        if (accounts && accounts.length > 0) {
          accounts.forEach(account => {
            // current_balance is negative for credit cards (amount owed)
            const debt = Math.abs(account.current_balance || 0);
            const available = Math.max(0, account.available_balance || 0);
            
            // Credit limit = what you owe + what's available
            const accountLimit = debt + available;
            
            plaidDebtAmount += debt;
            creditLimit += accountLimit;
          });
        }
        
        setTotalDebt(totalDebtAmount);
        setTotalLimit(creditLimit);
        setPlaidDebt(plaidDebtAmount);
        
        console.log('Chart Data:', {
          totalDebts: allDebts.length,
          totalDebtAmount,
          plaidAccounts: accounts?.length || 0,
          plaidDebtAmount,
          creditLimit
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load debts',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const chartData = debts.map((debt, index) => ({
    name: debt.name,
    value: debt.balance,
    color: CHART_COLORS[index % CHART_COLORS.length]
  }));

  const availableCredit = Math.max(0, totalLimit - plaidDebt);
  
  // Credit utilization chart shows only Plaid credit accounts
  // (manual entries don't have credit limits so can't be included in utilization)
  const creditUtilizationData = totalLimit > 0 ? [
    { name: 'Used Credit', value: plaidDebt, color: 'hsl(0 85% 60%)' },
    { name: 'Available Credit', value: availableCredit, color: 'hsl(145 75% 50%)' }
  ] : [];

  const utilizationPercentage = totalLimit > 0 ? ((plaidDebt / totalLimit) * 100).toFixed(1) : '0';

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Button
          variant="ghost"
          onClick={() => navigate(DEMO ? '/dashboard?demo=true' : '/dashboard')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 w-4 h-4" />
          Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
            Debt Visualization
          </h1>
          <p className="text-muted-foreground">
            Track your debt distribution and available credit
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Debt"
            value={`$${totalDebt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            subtitle={`${debts.length} ${debts.length === 1 ? 'debt' : 'debts'} total`}
            icon={CreditCard}
            className="border-destructive/20"
          />
          
          <StatCard
            title="Available Credit"
            value={totalLimit > 0 ? `$${availableCredit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A'}
            subtitle={totalLimit === 0 ? 'Connect bank accounts for credit data' : `From ${totalLimit > 0 ? 'Plaid' : 'connected'} accounts`}
            icon={DollarSign}
            className="border-success/20"
          />
          
          <StatCard
            title="Credit Utilization"
            value={totalLimit > 0 ? `${utilizationPercentage}%` : 'N/A'}
            subtitle={totalLimit === 0 ? 'Connect bank accounts' : (parseFloat(utilizationPercentage) > 30 ? 'Above recommended 30%' : 'Good standing')}
            icon={TrendingDown}
            className={parseFloat(utilizationPercentage) > 30 && totalLimit > 0 ? 'border-destructive/20' : 'border-success/20'}
          />
        </div>

        {loading ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">Loading chart data...</p>
            </CardContent>
          </Card>
        ) : debts.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground mb-4">No active debts to display</p>
              <Button onClick={() => navigate('/debts')}>
                Add Your First Debt
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Debt Distribution Chart */}
            <Card className="border-border/50 bg-gradient-card hover:shadow-vibrant transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-primary" />
                  Debt Distribution
                </CardTitle>
                <CardDescription>
                  All your debts: {debts.length} {debts.length === 1 ? 'account' : 'accounts'} • Total: ${totalDebt.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => 
                        `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 text-sm text-muted-foreground text-center">
                  Includes both bank-connected and manually entered debts
                </div>
              </CardContent>
            </Card>

            {/* Credit Utilization Chart */}
            <Card className="border-border/50 bg-gradient-card hover:shadow-vibrant transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-accent" />
                  Credit Utilization
                </CardTitle>
                <CardDescription>
                  {totalLimit > 0 ? `From bank-connected accounts only` : 'Connect bank accounts to see utilization'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {totalLimit > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={400}>
                      <PieChart>
                        <Pie
                          data={creditUtilizationData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}\n${(percent * 100).toFixed(0)}%`}
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {creditUtilizationData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => 
                            `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          }
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-4 p-4 bg-primary/5 border border-primary/10 rounded-lg space-y-2">
                      <p className="text-sm text-muted-foreground">
                        <strong className="text-foreground">Calculation:</strong> ${plaidDebt.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} used / ${totalLimit.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} limit = {utilizationPercentage}%
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <strong className="text-foreground">Tip:</strong> Keep utilization below 30% for optimal credit scores. Excel-imported debts aren't included (no credit limit data).
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="h-[400px] flex items-center justify-center text-center p-8">
                    <div>
                      <p className="text-muted-foreground mb-4">
                        Credit utilization requires bank-connected accounts with credit limits.
                      </p>
                      <Button onClick={() => navigate('/dashboard')}>
                        Connect Bank Account
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Debt List */}
            <Card className="lg:col-span-2 border-border/50 bg-gradient-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  Color-Coded Debt Legend
                </CardTitle>
                <CardDescription>Match the colors to identify each debt on the chart above</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {debts.map((debt, index) => (
                    <div 
                      key={debt.id}
                      className="flex items-start gap-3 p-4 border-2 rounded-lg transition-all duration-300 hover:shadow-md"
                      style={{ 
                        borderColor: CHART_COLORS[index % CHART_COLORS.length],
                        backgroundColor: `${CHART_COLORS[index % CHART_COLORS.length]}10`
                      }}
                    >
                      <div 
                        className="w-6 h-6 rounded-full shadow-md flex-shrink-0 mt-0.5" 
                        style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-base truncate">{debt.name}</p>
                        <div className="flex flex-col gap-1 mt-1">
                          <p className="text-sm text-muted-foreground">{formatAPR(debt.apr)}</p>
                          <p className="font-bold text-lg">
                            ${debt.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {((debt.balance / totalDebt) * 100).toFixed(1)}% of total debt
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default DebtChart;
