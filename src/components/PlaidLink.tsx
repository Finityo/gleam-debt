import { useEffect, useState } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface PlaidLinkProps {
  onSuccess?: () => void;
}

export const PlaidLink = ({ onSuccess }: PlaidLinkProps) => {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const createLinkToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('plaid-create-link-token');
        
        if (error) throw error;
        
        setLinkToken(data.link_token);
      } catch (error: any) {
        console.error('Error creating link token:', error);
        toast({
          title: 'Error',
          description: 'Failed to initialize bank connection. Please try again.',
          variant: 'destructive',
        });
      }
    };

    createLinkToken();
  }, [toast]);

  const onSuccessCallback = async (public_token: string, metadata: any) => {
    try {
      console.log('Starting token exchange...');
      
      const { data, error } = await supabase.functions.invoke('plaid-exchange-token', {
        body: { public_token, metadata },
      });

      console.log('Exchange response:', { data, error });

      if (error) throw error;

      toast({
        title: 'Success!',
        description: 'Your bank account has been connected successfully.',
      });

      // Reload the page to show the connected accounts
      setTimeout(() => {
        window.location.reload();
      }, 1500);

      onSuccess?.();
    } catch (error: any) {
      console.error('Error exchanging token:', error);
      toast({
        title: 'Error',
        description: 'Failed to connect bank account. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const config = {
    token: linkToken,
    onSuccess: onSuccessCallback,
    onExit: (err: any, metadata: any) => {
      if (err) {
        console.error('Plaid Link exited with error:', err);
        toast({
          title: 'Connection Cancelled',
          description: 'Bank connection was not completed.',
          variant: 'destructive',
        });
      }
    },
  };

  const { open, ready } = usePlaidLink(config);

  return (
    <Button 
      onClick={() => open()} 
      disabled={!ready}
      size="lg"
      className="w-full sm:w-auto"
    >
      Connect Bank Account
    </Button>
  );
};
