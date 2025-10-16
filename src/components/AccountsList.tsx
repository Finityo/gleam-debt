import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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

  const handleRemoveItem = async (itemId: string, institutionName: string | null) => {
    try {
      setRemovingItemId(itemId);

      const { error } = await supabase.functions.invoke('plaid-remove-item', {
        body: { item_id: itemId },
      });

      if (error) throw error;

      toast({
        title: 'Account Disconnected',
        description: `${institutionName || 'Bank account'} has been disconnected and all data deleted.`,
      });

      // Refresh the accounts list
      onAccountsChange();
    } catch (error: any) {
      console.error('Error removing item:', error);
      toast({
        title: 'Error',
        description: 'Failed to disconnect account. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setRemovingItemId(null);
    }
  };

  // Group accounts by item
  const accountsByItem = accounts.reduce((acc, account) => {
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

  return (
    <div className="space-y-6">
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
    </div>
  );
};
