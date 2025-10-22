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
      // Log successful Plaid Link completion
      console.log('Plaid Link success:', {
        institution: metadata?.institution?.name,
        institution_id: metadata?.institution?.institution_id,
        accounts_count: metadata?.accounts?.length,
      });

      const { data, error } = await supabase.functions.invoke('plaid-exchange-token', {
        body: { public_token, metadata },
      });

      if (error) throw error;
      
      // Check if it's a duplicate
      if (data?.duplicate) {
        toast({
          title: 'Already Connected',
          description: data.error || 'This bank is already connected to your account.',
          variant: 'destructive',
        });
        return;
      }
      
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
      console.error('Plaid exchange token error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to connect bank account. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const config = {
    token: linkToken,
    onSuccess: onSuccessCallback,
    onExit: (err: any, metadata: any) => {
      // Detailed logging for Plaid Link exits
      const exitInfo = {
        error_type: err?.error_type,
        error_code: err?.error_code,
        error_message: err?.error_message,
        display_message: err?.display_message,
        institution: metadata?.institution?.name,
        institution_id: metadata?.institution?.institution_id,
        link_session_id: metadata?.link_session_id,
        request_id: metadata?.request_id,
        status: metadata?.status,
      };

      if (err) {
        console.error('Plaid Link exit with error:', exitInfo);
        
        // Provide more helpful error messages based on error type
        let errorTitle = 'Connection Failed';
        let errorDescription = 'Bank connection was not completed.';

        if (err.error_type === 'ITEM_ERROR') {
          errorTitle = 'Authentication Failed';
          errorDescription = err.display_message || 'Unable to verify your credentials. Please check your username and password.';
        } else if (err.error_code === 'INSTITUTION_DOWN' || err.error_code === 'INSTITUTION_NOT_RESPONDING') {
          errorTitle = 'Bank Unavailable';
          errorDescription = `${metadata?.institution?.name || 'This bank'} is temporarily unavailable. Please try again later.`;
        } else if (err.error_code === 'ITEM_LOCKED') {
          errorTitle = 'Account Locked';
          errorDescription = 'Your bank account is locked. Please contact your bank to unlock it.';
        } else if (err.error_code === 'INVALID_CREDENTIALS') {
          errorTitle = 'Invalid Credentials';
          errorDescription = 'The username or password you entered is incorrect.';
        } else if (err.error_code === 'INVALID_MFA') {
          errorTitle = 'MFA Failed';
          errorDescription = 'The security code you entered is incorrect or expired. Please try again.';
        } else if (err.error_code === 'ITEM_NOT_SUPPORTED') {
          errorTitle = 'Bank Not Supported';
          errorDescription = `${metadata?.institution?.name || 'This bank'} is not currently supported.`;
        }

        toast({
          title: errorTitle,
          description: errorDescription,
          variant: 'destructive',
        });
      } else {
        // User cancelled without error
        console.log('Plaid Link exit (user cancelled):', exitInfo);
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
