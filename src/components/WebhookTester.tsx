import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Webhook } from 'lucide-react';

export const WebhookTester = () => {
  const [webhookCode, setWebhookCode] = useState('NEW_ACCOUNTS_AVAILABLE');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleFireWebhook = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('plaid-test-webhook', {
        body: { webhook_code: webhookCode },
      });

      if (error) throw error;

      toast({
        title: 'Webhook Fired!',
        description: data.message || 'Check your logs to verify webhook was received.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fire webhook',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Webhook className="h-5 w-5" />
          Webhook Tester (Sandbox Only)
        </CardTitle>
        <CardDescription>
          Test webhook integration by firing test events
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Webhook Type</label>
          <Select value={webhookCode} onValueChange={setWebhookCode}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NEW_ACCOUNTS_AVAILABLE">NEW_ACCOUNTS_AVAILABLE</SelectItem>
              <SelectItem value="PENDING_EXPIRATION">PENDING_EXPIRATION</SelectItem>
              <SelectItem value="USER_PERMISSION_REVOKED">USER_PERMISSION_REVOKED</SelectItem>
              <SelectItem value="ERROR">ERROR (ITEM_LOGIN_REQUIRED)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={handleFireWebhook} 
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Firing Webhook...
            </>
          ) : (
            'Fire Test Webhook'
          )}
        </Button>

        <p className="text-xs text-muted-foreground">
          This will trigger a {webhookCode} webhook event for your connected account.
          Check the console logs to verify the webhook was received and processed.
        </p>
      </CardContent>
    </Card>
  );
};
