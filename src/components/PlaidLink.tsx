import { useEffect, useState, useCallback } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface PlaidLinkProps {
  onSuccess?: () => void;
}

export const PlaidLink = ({ onSuccess }: PlaidLinkProps) => {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const createLinkToken = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          toast.error('Please log in to connect your bank account');
          return;
        }

        const { data, error } = await supabase.functions.invoke('create-link-token', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (error) throw error;
        
        setLinkToken(data.link_token);
      } catch (error) {
        console.error('Error creating link token:', error);
        toast.error('Failed to initialize bank connection');
      }
    };

    createLinkToken();
  }, []);

  const onPlaidSuccess = useCallback(async (public_token: string, metadata: any) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session');
      }

      const { data, error } = await supabase.functions.invoke('exchange-public-token', {
        body: { public_token, metadata },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      toast.success(`Successfully linked ${metadata.institution.name}!`);
      onSuccess?.();
    } catch (error) {
      console.error('Error exchanging token:', error);
      toast.error('Failed to link bank account');
    } finally {
      setLoading(false);
    }
  }, [onSuccess]);

  const config = {
    token: linkToken,
    onSuccess: onPlaidSuccess,
  };

  const { open, ready } = usePlaidLink(config);

  if (!linkToken) {
    return (
      <Button disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading...
      </Button>
    );
  }

  return (
    <Button 
      onClick={() => open()} 
      disabled={!ready || loading}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Connecting...
        </>
      ) : (
        'Connect Bank Account'
      )}
    </Button>
  );
};
