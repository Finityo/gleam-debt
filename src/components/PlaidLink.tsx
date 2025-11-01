import { useEffect, useState } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { PlaidConsentDialog } from './PlaidConsentDialog';
import { PlaidSuccessScreen } from './PlaidSuccessScreen';

interface PlaidLinkProps {
  onSuccess?: () => void;
}

export const PlaidLink = ({ onSuccess }: PlaidLinkProps) => {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [successData, setSuccessData] = useState<{
    accountMask?: string;
    institutionName?: string;
  }>({});
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  const { toast } = useToast();

  const onSuccessCallback = async (public_token: string, metadata: any) => {
    try {
      // Log successful Plaid Link completion with all key identifiers
      console.log('Plaid Link success:', {
        institution: metadata?.institution?.name,
        institution_id: metadata?.institution?.institution_id,
        accounts_count: metadata?.accounts?.length,
        link_session_id: metadata?.link_session_id,
        request_id: metadata?.request_id,
      });

      const { data, error } = await supabase.functions.invoke('plaid-exchange-token', {
        body: { 
          public_token, 
          metadata,
          link_session_id: metadata?.link_session_id 
        },
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
      
      // Show success screen with account details
      setSuccessData({
        accountMask: metadata?.account?.mask || metadata?.accounts?.[0]?.mask,
        institutionName: metadata?.institution?.name,
      });
      setShowSuccessScreen(true);

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
    onEvent: (eventName: string, metadata: any) => {
      // Track all Link events for conversion analytics
      const eventData = {
        event_name: eventName,
        view_name: metadata?.view_name,
        timestamp: metadata?.timestamp ? new Date(metadata.timestamp) : new Date(),
        link_session_id: metadata?.link_session_id || 'unknown',
        institution_id: metadata?.institution_id,
        institution_name: metadata?.institution_name,
        error_type: metadata?.error_type,
        error_code: metadata?.error_code,
        error_message: metadata?.error_message,
        metadata: metadata
      };

      // Log important events to console for monitoring
      if (['OPEN', 'HANDOFF', 'ERROR', 'EXIT'].includes(eventName)) {
        console.log(`Plaid Link Event: ${eventName}`, {
          link_session_id: eventData.link_session_id,
          institution: eventData.institution_name,
          view_name: eventData.view_name
        });
      }

      // Persist event to database for analytics (async, non-blocking)
      supabase.rpc('log_plaid_link_event', {
        p_user_id: null, // Will be set by RLS if authenticated
        p_link_session_id: eventData.link_session_id,
        p_event_name: eventData.event_name,
        p_view_name: eventData.view_name,
        p_timestamp: eventData.timestamp.toISOString(),
        p_institution_id: eventData.institution_id,
        p_institution_name: eventData.institution_name,
        p_error_type: eventData.error_type,
        p_error_code: eventData.error_code,
        p_error_message: eventData.error_message,
        p_metadata: eventData.metadata
      }).then(({ error }) => {
        if (error) console.error('Failed to log Link event:', error);
      });
    },
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
        
        // Persist Link error to database for diagnostics (async, don't block UI)
        supabase.rpc('log_plaid_link_error', {
          p_user_id: null, // Will be set by RLS if user is authenticated
          p_link_session_id: metadata?.link_session_id || 'unknown',
          p_request_id: metadata?.request_id,
          p_error_type: err.error_type,
          p_error_code: err.error_code,
          p_error_message: err.error_message,
          p_display_message: err.display_message,
          p_institution_id: metadata?.institution?.institution_id,
          p_institution_name: metadata?.institution?.name,
          p_status: metadata?.status
        }).then(({ error: logError }) => {
          if (logError) console.error('Failed to log Link error:', logError);
        });
        
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

  useEffect(() => {
    // Only attempt to fetch once
    if (hasAttemptedFetch || isRateLimited) return;

    const createLinkToken = async () => {
      setHasAttemptedFetch(true);
      
      try {
        const response = await supabase.functions.invoke('plaid-create-link-token');
        
        // Handle HTTP error responses
        if (response.error) {
          // Check for rate limit (429) or other HTTP errors
          const errorMsg = response.error.message || '';
          
          if (errorMsg.includes('Too many connection attempts') || 
              errorMsg.includes('Daily connection limit') ||
              errorMsg.includes('FunctionsHttpError: 429') ||
              errorMsg.includes('429')) {
            setIsRateLimited(true);
            toast({
              title: 'Connection Limit Reached',
              description: 'Please wait an hour before attempting more connections. Your accounts are still connected and accessible.',
              variant: 'destructive',
            });
            return;
          }
          
          throw response.error;
        }
        
        if (!response.data?.link_token) {
          throw new Error('No link token received');
        }
        
        console.log('PlaidLink: Link token received successfully');
        setLinkToken(response.data.link_token);
      } catch (error: any) {
        console.error('Create link token error:', error);
        
        // Check if it's a rate limit error
        if (error.message?.includes('429') || error.message?.includes('rate limit')) {
          setIsRateLimited(true);
          return; // Don't show toast, already handled above
        }
        
        // Better error message for other issues
        let errorMessage = 'Failed to initialize bank connection. Please try again later.';
        
        if (error.message?.includes('Network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        }
        
        toast({
          title: 'Connection Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    };

    createLinkToken();

    // Handle OAuth redirect from sessionStorage
    const handleOAuthRedirect = () => {
      const oauthStateId = sessionStorage.getItem('plaid_oauth_state_id');
      if (oauthStateId && ready) {
        console.log('Resuming Link with OAuth state:', oauthStateId);
        sessionStorage.removeItem('plaid_oauth_state_id');
        open();
      }
    };

    // Listen for OAuth redirect event
    window.addEventListener('plaid-oauth-redirect', handleOAuthRedirect);
    
    // Check immediately in case we just redirected
    handleOAuthRedirect();

    return () => {
      window.removeEventListener('plaid-oauth-redirect', handleOAuthRedirect);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleConnectClick = () => {
    console.log('PlaidLink: Connect button clicked', { ready, consentGiven, linkToken: !!linkToken });
    
    // SECURITY: Always show consent dialog before connecting to financial institutions
    // Required for GDPR, CCPA, and financial data sharing regulations
    if (!consentGiven) {
      console.log('PlaidLink: Showing consent dialog');
      setShowConsentDialog(true);
    } else {
      console.log('PlaidLink: Opening Plaid Link');
      open();
    }
  };

  const handleConsent = () => {
    setConsentGiven(true);
    // Open Plaid Link after consent
    if (ready) {
      open();
    }
  };

  const handleConnectAnother = () => {
    setShowSuccessScreen(false);
    setConsentGiven(false);
    setSuccessData({});
    // Show consent dialog again for next connection
    setShowConsentDialog(true);
  };

  const handleViewAccounts = () => {
    window.location.reload();
  };

  return (
    <>
      {showSuccessScreen && (
        <PlaidSuccessScreen
          accountMask={successData.accountMask}
          institutionName={successData.institutionName}
          onConnectAnother={handleConnectAnother}
          onViewAccounts={handleViewAccounts}
        />
      )}

      <Button 
        onClick={handleConnectClick} 
        disabled={!ready || isRateLimited}
        size="lg"
        className="w-full sm:w-auto"
      >
        {isRateLimited ? 'Rate Limit Reached' : 'Connect Bank Account'}
      </Button>

      <PlaidConsentDialog
        open={showConsentDialog}
        onOpenChange={setShowConsentDialog}
        onConsent={handleConsent}
      />
    </>
  );
};
