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
    // Get OAuth parameters from URL
    const urlParams = new URLSearchParams(window.location.search);
    const oauthStateId = urlParams.get('oauth_state_id');

    console.log('OAuth redirect received:', {
      oauthStateId,
      fullUrl: window.location.href,
    });

    if (oauthStateId) {
      // Store OAuth state in sessionStorage for Link to retrieve
      sessionStorage.setItem('plaid_oauth_state_id', oauthStateId);
      
      // Trigger Link reinitialization via event
      window.dispatchEvent(new CustomEvent('plaid-oauth-redirect', {
        detail: { oauth_state_id: oauthStateId }
      }));

      // Navigate back to dashboard after a brief delay
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 1000);
    } else {
      console.error('No oauth_state_id found in redirect URL');
      // Navigate back to dashboard anyway
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
        <h2 className="text-xl font-semibold">Completing Bank Connection</h2>
        <p className="text-muted-foreground">Please wait while we finalize your connection...</p>
      </div>
    </div>
  );
};

export default OAuthRedirect;
