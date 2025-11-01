import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { usePlaidLink } from 'react-plaid-link';
import { useToast } from '@/hooks/use-toast';

interface ItemNeedingUpdate {
  item_id: string;
  update_reason: string;
  institution_name?: string;
}

// Separate component that uses the Plaid hook
const PlaidLinkHandler = ({ 
  linkToken, 
  onSuccess, 
  onExit 
}: { 
  linkToken: string; 
  onSuccess: () => void; 
  onExit: () => void;
}) => {
  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess,
    onExit,
  });

  useEffect(() => {
    if (ready) {
      open();
    }
  }, [ready, open]);

  return null;
};

export const PlaidUpdateBanner = () => {
  const [itemsNeedingUpdate, setItemsNeedingUpdate] = useState<ItemNeedingUpdate[]>([]);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkForUpdates();
    
    // Subscribe to realtime updates for item status
    const channel = supabase
      .channel('plaid_item_status_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'plaid_item_status',
        },
        () => {
          checkForUpdates();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const checkForUpdates = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: statuses } = await supabase
      .from('plaid_item_status')
      .select('item_id, update_reason')
      .eq('user_id', user.id)
      .eq('needs_update', true);

    if (statuses && statuses.length > 0) {
      // Get institution names
      const itemIds = statuses.map(s => s.item_id);
      const { data: items } = await supabase
        .from('plaid_items')
        .select('item_id, institution_name')
        .in('item_id', itemIds);

      const itemsWithNames = statuses.map(status => ({
        ...status,
        institution_name: items?.find(i => i.item_id === status.item_id)?.institution_name,
      }));

      setItemsNeedingUpdate(itemsWithNames);
    } else {
      setItemsNeedingUpdate([]);
    }
  };

  const createUpdateLinkToken = async (itemId: string, reason: string) => {
    try {
      setSelectedItem(itemId);
      
      const { data, error } = await supabase.functions.invoke('plaid-create-update-token', {
        body: { 
          item_id: itemId,
          update_mode: reason === 'new_accounts_available' ? 'account_selection' : 'login_repair'
        },
      });

      if (error) throw error;
      
      setLinkToken(data.link_token);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to initialize update flow. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const onSuccessCallback = async () => {
    // Clear the needs_update flag in the database
    if (selectedItem) {
      await supabase
        .from('plaid_item_status')
        .update({ needs_update: false })
        .eq('item_id', selectedItem);
    }

    toast({
      title: 'Success!',
      description: 'Your bank connection has been updated.',
    });
    
    setLinkToken(null);
    setSelectedItem(null);
    
    // Refresh after a short delay
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  const onExitCallback = () => {
    setLinkToken(null);
    setSelectedItem(null);
  };

  const dismissItem = async (itemId: string) => {
    const { error } = await supabase
      .from('plaid_item_status')
      .update({ needs_update: false })
      .eq('item_id', itemId);

    if (!error) {
      checkForUpdates();
    }
  };

  const getReasonMessage = (reason: string) => {
    switch (reason) {
      case 'login_required':
        return 'Your login credentials need to be updated';
      case 'new_accounts_available':
        return 'New accounts are available to connect';
      case 'pending_expiration':
        return 'Your connection will expire soon';
      case 'pending_disconnect':
        return 'Your connection will be disconnected soon';
      case 'permission_revoked':
        return 'Permissions need to be refreshed';
      default:
        return 'Action required';
    }
  };

  if (itemsNeedingUpdate.length === 0) return null;

  return (
    <>
      {linkToken && (
        <PlaidLinkHandler 
          linkToken={linkToken}
          onSuccess={onSuccessCallback}
          onExit={onExitCallback}
        />
      )}
      
      <div className="space-y-2 mb-6">
        {itemsNeedingUpdate.map((item) => (
          <Alert key={item.item_id} variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="flex items-center justify-between">
              <span>
                {item.institution_name || 'Bank Account'} - {getReasonMessage(item.update_reason)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => dismissItem(item.item_id)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </AlertTitle>
            <AlertDescription className="flex items-center justify-between mt-2">
              <span>Please update your connection to continue syncing your accounts.</span>
              <Button
                onClick={() => createUpdateLinkToken(item.item_id, item.update_reason)}
                size="sm"
                className="ml-4"
                disabled={selectedItem === item.item_id}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Update Connection
              </Button>
            </AlertDescription>
          </Alert>
        ))}
      </div>
    </>
  );
};
