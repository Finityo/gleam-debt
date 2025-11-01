import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

/**
 * OAuth Redirect Handler for Plaid
 * 
 * This page handles the OAuth redirect after a user authenticates
 * with their financial institution. Plaid will redirect here with
 * OAuth state parameters that need to be passed back to Link.
 */
const OAuthRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Get the full redirect URL with all parameters
    const fullUrl = window.location.href;
    const urlParams = new URLSearchParams(window.location.search);
    const oauthStateId = urlParams.get('oauth_state_id');

    console.log('OAuth redirect received:', {
      oauthStateId,
      fullUrl,
    });

    if (oauthStateId) {
      // For mobile: Try to communicate with opener window first
      if (window.opener && !window.opener.closed) {
        console.log('Posting message to opener window');
        window.opener.postMessage({
          type: 'plaid-oauth-complete',
          oauth_state_id: oauthStateId,
          received_redirect_uri: fullUrl
        }, '*');
        
        // Close the OAuth window after sending message
        setTimeout(() => {
          window.close();
        }, 500);
      } else {
        // Fallback for same-window flow
        sessionStorage.setItem('plaid_oauth_redirect_uri', fullUrl);
        sessionStorage.setItem('plaid_oauth_state_id', oauthStateId);
        
        // Immediately redirect to dashboard
        window.location.replace('/dashboard');
      }
    } else {
      console.error('No oauth_state_id found in redirect URL');
      // Try to close if popup, otherwise redirect
      if (window.opener && !window.opener.closed) {
        window.close();
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
        <h2 className="text-xl font-semibold">Completing Bank Connection</h2>
        <p className="text-muted-foreground">Returning to Finityo...</p>
        <p className="text-xs text-muted-foreground">This window will close automatically</p>
      </div>
    </div>
  );
};

export default OAuthRedirect;
