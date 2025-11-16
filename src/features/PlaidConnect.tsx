import { useEffect, useState } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const PlaidConnect = () => {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchLinkToken = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase.functions.invoke('create-link-token');

        if (error) throw error;

        if (data?.link_token) {
          setLinkToken(data.link_token);
        } else {
          throw new Error('No link token received');
        }
      } catch (err: any) {
        console.error('Error fetching link token:', err);
        setError(err.message || 'Failed to initialize Plaid');
        toast({
          title: 'Connection Error',
          description: 'Unable to connect to bank. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLinkToken();
  }, [toast]);

  const onSuccess = async (public_token: string, metadata: any) => {
    try {
      console.log('Plaid Link success:', {
        institution: metadata?.institution?.name,
        accounts: metadata?.accounts?.length,
      });

      const { data, error } = await supabase.functions.invoke('exchange-public-token', {
        body: { public_token },
      });

      if (error) throw error;

      toast({
        title: 'Bank Connected!',
        description: `Successfully connected to ${data?.institution_name || 'your bank'}`,
      });

      // Redirect to dashboard after success
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err: any) {
      console.error('Error exchanging token:', err);
      toast({
        title: 'Connection Failed',
        description: err.message || 'Failed to connect bank account',
        variant: 'destructive',
      });
    }
  };

  const onExit = (err: any, metadata: any) => {
    if (err) {
      console.error('Plaid Link exit error:', err);
      toast({
        title: 'Connection Cancelled',
        description: err.display_message || 'Bank connection was cancelled',
        variant: 'destructive',
      });
    } else {
      console.log('User exited Plaid Link');
    }
  };

  const config = {
    token: linkToken,
    onSuccess,
    onExit,
  };

  const { open, ready } = usePlaidLink(config);

  useEffect(() => {
    if (ready && linkToken) {
      // Auto-open Plaid Link when ready
      open();
    }
  }, [ready, linkToken, open]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950">
        <div className="absolute top-4 left-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="text-neutral-400 hover:text-neutral-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-cyan-400" />
          <p className="mt-4 text-sm text-neutral-400">Initializing bank connection...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950">
        <div className="absolute top-4 left-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="text-neutral-400 hover:text-neutral-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
        <div className="rounded-2xl border border-red-500/40 bg-neutral-900/70 p-8 text-center shadow-lg shadow-red-500/25">
          <p className="text-sm text-red-300">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 rounded-lg border border-cyan-400/70 bg-cyan-500/20 px-4 py-2 text-sm font-semibold text-cyan-100 hover:bg-cyan-500/30"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950">
      <div className="absolute top-4 left-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="text-neutral-400 hover:text-neutral-200"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>
      <div className="rounded-2xl border border-cyan-500/40 bg-neutral-900/70 p-8 text-center shadow-lg shadow-cyan-500/25">
        <h2 className="text-xl font-semibold text-cyan-300">Connect Your Bank</h2>
        <p className="mt-2 text-sm text-neutral-400">
          Click below to securely connect your bank account
        </p>
        <button
          onClick={() => open()}
          disabled={!ready}
          className="mt-6 rounded-lg border border-cyan-400/70 bg-cyan-500/20 px-6 py-3 text-sm font-semibold text-cyan-100 hover:bg-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {ready ? 'Connect Bank Account' : 'Loading...'}
        </button>
      </div>
    </div>
  );
};

export default PlaidConnect;
