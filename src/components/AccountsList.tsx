import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logError } from '@/utils/logger';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Account {
  id: string;
  name: string;
  official_name: string | null;
  type: string;
  subtype: string | null;
  mask: string | null;
  current_balance: number;
  available_balance: number | null;
  currency_code: string;
  plaid_items: {
    id: string;
    item_id: string;
    institution_name: string | null;
  };
}

interface AccountsListProps {
  accounts: Account[];
  onAccountsChange: () => void;
}

export const AccountsList = ({ accounts, onAccountsChange }: AccountsListProps) => {
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);
  const { toast } = useToast();

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleRemoveItem = async (plaidItemId: string, institutionName: string | null) => {
    try {
      setRemovingItemId(plaidItemId);

      const { data, error } = await supabase.functions.invoke('plaid-remove-item', {
        body: { item_id: plaidItemId },
      });

      if (error) throw error;

      toast({
        title: 'Account Disconnected',
        description: `${institutionName || 'Bank account'} has been disconnected and all data deleted.`,
      });

      // Refresh the accounts list
      onAccountsChange();
    } catch (error: any) {
      logError('AccountsList - Remove Item', error);
      
      // Check if error is related to unmigrated tokens
      const errorMessage = error.message || '';
      const isTokenMigrationError = errorMessage.includes('vault secret') || 
                                    errorMessage.includes('retrieve access token') ||
                                    errorMessage.includes('No vault secret');
      
      if (isTokenMigrationError) {
        toast({
          title: '🔒 Security Upgrade Required',
          description: 'This account needs a security upgrade before it can be disconnected. Please use the "Upgrade Security Now" button above to migrate your tokens first.',
          variant: 'destructive',
          duration: 8000,
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to disconnect account. Please try again or contact support if the issue persists.',
          variant: 'destructive',
        });
      }
    } finally {
      setRemovingItemId(null);
    }
  };

  // Separate accounts by type
  const creditAccounts = accounts.filter(account => account.type === 'credit');
  const depositoryAccounts = accounts.filter(account => account.type === 'depository');

  // Group accounts by item for each type
  const groupAccountsByItem = (accountsList: Account[]) => {
    return accountsList.reduce((acc, account) => {
      const itemId = account.plaid_items.item_id;
      if (!acc[itemId]) {
        acc[itemId] = {
          item: account.plaid_items,
          accounts: [],
        };
      }
      acc[itemId].accounts.push(account);
      return acc;
    }, {} as Record<string, { item: Account['plaid_items']; accounts: Account[] }>);
  };

  const creditAccountsByItem = groupAccountsByItem(creditAccounts);
  const depositoryAccountsByItem = groupAccountsByItem(depositoryAccounts);

  if (accounts.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            No accounts connected yet. Click the button above to connect your bank account.
          </p>
        </CardContent>
      </Card>
    );
  }

  const renderAccountsByItem = (accountsByItem: Record<string, { item: Account['plaid_items']; accounts: Account[] }>) => (
    <>
      {Object.entries(accountsByItem).map(([itemId, { item, accounts: itemAccounts }]) => (
        <div key={itemId} className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {item.institution_name || 'Bank Account'}
            </h3>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={removingItemId === itemId}
                >
                  {removingItemId === itemId ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Disconnect
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Disconnect Bank Account?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will disconnect {item.institution_name || 'this bank account'} and delete
                    all associated data including account numbers and balances. This action cannot
                    be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleRemoveItem(itemId, item.institution_name)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Disconnect
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {itemAccounts.map((account) => (
              <Card key={account.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{account.name}</CardTitle>
                  <CardDescription>
                    {account.mask && `•••• ${account.mask}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type</span>
                      <span className="font-medium capitalize">
                        {account.subtype || account.type}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Current Balance</span>
                      <span className="font-medium">
                        {formatCurrency(account.current_balance)}
                      </span>
                    </div>
                    {account.available_balance !== null && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Available</span>
                        <span className="font-medium">
                          {formatCurrency(account.available_balance)}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </>
  );

  return (
    <div className="space-y-8">
      {depositoryAccounts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Checking & Savings Accounts</h2>
          <div className="space-y-6">
            {renderAccountsByItem(depositoryAccountsByItem)}
          </div>
        </div>
      )}
      
      {creditAccounts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Credit Accounts</h2>
          <div className="space-y-6">
            {renderAccountsByItem(creditAccountsByItem)}
          </div>
        </div>
      )}
    </div>
  );
};
