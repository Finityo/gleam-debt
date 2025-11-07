import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Building2, ChevronDown, Trash2, AlertTriangle } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { demoGuard } from '@/services/api';

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
  const [removingAll, setRemovingAll] = useState(false);
  const [openInstitutions, setOpenInstitutions] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchConnectedAccounts();
  }, []);

  const fetchConnectedAccounts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get items with their accounts
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
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      // Get item status separately (no foreign key relationship)
      const { data: statusData } = await supabase
        .from('plaid_item_status')
        .select('item_id, needs_update')
        .eq('user_id', user.id)
        .eq('needs_update', true);

      // Create a map of item_id -> needs_update
      const statusMap = new Map(
        statusData?.map(s => [s.item_id, s.needs_update]) || []
      );

      // Group by institution
      const grouped: Record<string, ConnectedAccount> = {};
      
      items?.forEach((item: any) => {
        const key = item.institution_id;
        if (!grouped[key]) {
          grouped[key] = {
            institution_name: item.institution_name,
            institution_id: item.institution_id,
            accounts: [],
            needs_update: statusMap.get(item.item_id) || false
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

      const accountsList = Object.values(grouped);
      setConnectedAccounts(accountsList);
      
      // Set initial open state for all institutions
      const initialOpenState: Record<string, boolean> = {};
      accountsList.forEach(institution => {
        // Auto-expand institutions with only 1 account, collapse others
        initialOpenState[institution.institution_id] = institution.accounts.length === 1;
      });
      setOpenInstitutions(initialOpenState);
    } catch (error) {
      console.error('Error fetching connected accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAllAccounts = async () => {
    if (demoGuard("Remove All Connected Accounts")) return;
    
    setRemovingAll(true);
    try {
      const { data, error } = await supabase.functions.invoke('plaid-remove-all-items');

      if (error) throw error;

      toast({
        title: 'Accounts Removed',
        description: data.message || 'All connected bank accounts have been removed',
      });

      // Refresh the accounts list
      fetchConnectedAccounts();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove accounts',
        variant: 'destructive',
      });
    } finally {
      setRemovingAll(false);
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
    return null;
  }

  const capitalizeType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const toggleInstitution = (institutionId: string) => {
    setOpenInstitutions(prev => ({
      ...prev,
      [institutionId]: !prev[institutionId]
    }));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Your Connected Accounts</CardTitle>
            <CardDescription>
              These accounts are already linked. Connecting the same account again will be prevented.
            </CardDescription>
          </div>
          {connectedAccounts.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={removingAll}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Remove All Connected Accounts?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="space-y-2">
                    <p>This will permanently disconnect all {connectedAccounts.length} bank account(s) from Finityo.</p>
                    <p className="font-medium">This action:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Removes all bank connections</li>
                      <li>Stops all account syncing</li>
                      <li>Cannot be undone</li>
                    </ul>
                    <p className="text-sm mt-3">You can reconnect your accounts later if needed.</p>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleRemoveAllAccounts}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Remove All Accounts
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {connectedAccounts.map((institution) => {
            const hasMultipleAccounts = institution.accounts.length > 1;
            const isOpen = openInstitutions[institution.institution_id] ?? false;
            
            return (
              <Collapsible
                key={institution.institution_id}
                open={isOpen}
                onOpenChange={() => toggleInstitution(institution.institution_id)}
              >
                <div className="rounded-lg border bg-card">
                  <CollapsibleTrigger 
                    className="flex items-start gap-3 p-4 w-full hover:bg-accent/50 transition-colors"
                    disabled={!hasMultipleAccounts}
                  >
                    <Building2 className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1 text-left">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-medium">{institution.institution_name}</h3>
                        <div className="flex items-center gap-2">
                          {institution.needs_update && (
                            <Badge variant="destructive" className="text-xs">
                              Needs Update
                            </Badge>
                          )}
                          {hasMultipleAccounts && (
                            <ChevronDown 
                              className={`h-4 w-4 text-muted-foreground transition-transform ${
                                isOpen ? 'transform rotate-180' : ''
                              }`}
                            />
                          )}
                        </div>
                      </div>
                      {!hasMultipleAccounts && institution.accounts[0] && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {institution.accounts[0].name} {institution.accounts[0].mask && `(••${institution.accounts[0].mask})`}
                          <Badge variant="outline" className="ml-2 text-xs">
                            {capitalizeType(institution.accounts[0].type)}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CollapsibleTrigger>
                  
                  {hasMultipleAccounts && (
                    <CollapsibleContent>
                      <div className="px-4 pb-4 space-y-2 border-t pt-3">
                        {institution.accounts.map((account, idx) => (
                          <div key={idx} className="text-sm text-muted-foreground pl-8">
                            {account.name} {account.mask && `(••${account.mask})`}
                            <Badge variant="outline" className="ml-2 text-xs">
                              {capitalizeType(account.type)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  )}
                </div>
              </Collapsible>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
