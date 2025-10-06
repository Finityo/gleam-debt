import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface PlaidAccount {
  id: string;
  name: string;
  official_name: string | null;
  type: string;
  subtype: string | null;
  mask: string | null;
  current_balance: number;
  available_balance: number;
  currency_code: string;
}

interface PlaidItem {
  id: string;
  institution_name: string | null;
}

interface AccountsData {
  items: PlaidItem[];
  accounts: PlaidAccount[];
}

export const AccountsList = () => {
  const [data, setData] = useState<AccountsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setLoading(false);
        return;
      }

      const { data: accountsData, error } = await supabase.functions.invoke('get-accounts', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      setData(accountsData);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      toast.error('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!data || data.accounts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Connected Accounts</CardTitle>
          <CardDescription>
            Connect your bank account to see your financial data
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      {data.accounts.map((account) => (
        <Card key={account.id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{account.name}</span>
              {account.mask && (
                <span className="text-sm text-muted-foreground">
                  ****{account.mask}
                </span>
              )}
            </CardTitle>
            {account.official_name && (
              <CardDescription>{account.official_name}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Current Balance</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(account.current_balance, account.currency_code)}
                </p>
              </div>
              {account.available_balance !== null && (
                <div>
                  <p className="text-sm text-muted-foreground">Available Balance</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(account.available_balance, account.currency_code)}
                  </p>
                </div>
              )}
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              {account.type} {account.subtype && `• ${account.subtype}`}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
