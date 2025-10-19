import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, TrendingDown, CreditCard, DollarSign } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useToast } from '@/hooks/use-toast';

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

  useEffect(() => {
    loadDebts();
  }, []);

  const loadDebts = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      // Fetch debts
      const { data: debtData, error: debtError } = await supabase
        .from('debts')
        .select('*')
        .eq('user_id', session.user.id)
        .order('balance', { ascending: false });

      if (debtError) throw debtError;

      // Fetch Plaid accounts to get actual credit limits
      const { data: accounts, error: accountsError } = await supabase
        .from('plaid_accounts')
        .select('current_balance, available_balance, subtype')
        .eq('user_id', session.user.id)
        .in('subtype', ['credit card', 'credit']);

      if (accountsError) throw accountsError;

      const debts = debtData || [];
      setDebts(debts);
      
      // Calculate total debt from debts table
      const totalDebtAmount = debts.reduce((sum, debt) => sum + debt.balance, 0);
      setTotalDebt(totalDebtAmount);
      
      // Calculate total credit limit from Plaid accounts
      // Credit limit = current balance + available balance
      let creditLimit = 0;
      if (accounts && accounts.length > 0) {
        creditLimit = accounts.reduce((sum, account) => {
          const balance = account.current_balance || 0;
          const available = account.available_balance || 0;
          // Credit limit is the sum of what's owed (balance) and what's available
          return sum + Math.abs(balance) + available;
        }, 0);
      }
      
      // If no accounts found, use debt as minimum credit limit
      setTotalLimit(creditLimit > 0 ? creditLimit : totalDebtAmount);
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

  const availableCredit = Math.max(0, totalLimit - totalDebt);
  
  const creditUtilizationData = [
    { name: 'Debt', value: totalDebt, color: 'hsl(0 85% 60%)' },
    { name: 'Available Credit', value: availableCredit, color: 'hsl(145 75% 50%)' }
  ];

  const utilizationPercentage = totalLimit > 0 ? ((totalDebt / totalLimit) * 100).toFixed(1) : '0';

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Total Debt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">
                ${totalDebt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Available Credit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">
                ${availableCredit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingDown className="w-4 h-4" />
                Credit Utilization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" style={{ 
                color: parseFloat(utilizationPercentage) > 30 ? 'hsl(0 85% 60%)' : 'hsl(145 75% 50%)'
              }}>
                {utilizationPercentage}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {parseFloat(utilizationPercentage) > 30 ? 'Above recommended 30%' : 'Good standing'}
              </p>
            </CardContent>
          </Card>
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
            <Card>
              <CardHeader>
                <CardTitle>Debt Distribution by Creditor</CardTitle>
                <CardDescription>
                  Visual breakdown of your {debts.length} active {debts.length === 1 ? 'debt' : 'debts'}
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
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
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
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Credit Utilization Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Credit Utilization Overview</CardTitle>
                <CardDescription>
                  Your debt vs. available credit
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={creditUtilizationData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
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
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Tip:</strong> Credit bureaus recommend keeping utilization below 30% for optimal credit scores. 
                    As you pay down debts, watch the green "Available Credit" section grow!
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Debt List */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Debt Details</CardTitle>
                <CardDescription>All active debts sorted by balance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {debts.map((debt, index) => (
                    <div 
                      key={debt.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                        />
                        <div>
                          <p className="font-medium">{debt.name}</p>
                          <p className="text-sm text-muted-foreground">APR: {debt.apr}%</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">
                          ${debt.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {((debt.balance / totalDebt) * 100).toFixed(1)}% of total
                        </p>
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
