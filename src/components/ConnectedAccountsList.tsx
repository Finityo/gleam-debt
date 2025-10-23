import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ConnectedAccount {
  institution_name: string;
  institution_id: string;
  accounts: {
    name: string;
    mask: string;
    type: string;
  }[];
  needs_update: boolean;
}

export const ConnectedAccountsList = () => {
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConnectedAccounts();
  }, []);

  const fetchConnectedAccounts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get items with their accounts and status
      const { data: items, error } = await supabase
        .from('plaid_items')
        .select(`
          institution_id,
          institution_name,
          item_id,
          plaid_accounts (
            name,
            mask,
            type
          ),
          plaid_item_status (
            needs_update
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      // Group by institution
      const grouped: Record<string, ConnectedAccount> = {};
      
      items?.forEach((item: any) => {
        const key = item.institution_id;
        if (!grouped[key]) {
          grouped[key] = {
            institution_name: item.institution_name,
            institution_id: item.institution_id,
            accounts: [],
            needs_update: item.plaid_item_status?.[0]?.needs_update || false
          };
        }
        
        item.plaid_accounts?.forEach((account: any) => {
          grouped[key].accounts.push({
            name: account.name,
            mask: account.mask,
            type: account.type
          });
        });
      });

      setConnectedAccounts(Object.values(grouped));
    } catch (error) {
      console.error('Error fetching connected accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Connected Accounts</CardTitle>
          <CardDescription>Loading your connected banks...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (connectedAccounts.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          You haven't connected any bank accounts yet. Click "Connect Bank Account" to get started.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Your Connected Accounts</CardTitle>
        <CardDescription>
          These accounts are already linked. Connecting the same account again will be prevented.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {connectedAccounts.map((institution) => (
            <div 
              key={institution.institution_id}
              className="flex items-start gap-3 p-4 rounded-lg border bg-card"
            >
              <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{institution.institution_name}</h3>
                  {institution.needs_update && (
                    <Badge variant="destructive" className="text-xs">
                      Needs Update
                    </Badge>
                  )}
                </div>
                <div className="space-y-1">
                  {institution.accounts.map((account, idx) => (
                    <div key={idx} className="text-sm text-muted-foreground">
                      {account.name} {account.mask && `(••${account.mask})`}
                      <Badge variant="outline" className="ml-2 text-xs">
                        {account.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};