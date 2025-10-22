import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PlaidTokenMigrationProps {
  unmigrated_item_ids: string[];
  onMigrationComplete?: () => void;
}

export const PlaidTokenMigration = ({ unmigrated_item_ids, onMigrationComplete }: PlaidTokenMigrationProps) => {
  const [isMigrating, setIsMigrating] = useState(false);
  const { toast } = useToast();

  const handleMigrate = async () => {
    setIsMigrating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('migrate-plaid-tokens', {
        body: { item_ids: unmigrated_item_ids }
      });

      if (error) throw error;

      const successCount = data.results.filter((r: any) => r.status === 'success').length;
      const failCount = data.results.filter((r: any) => r.status === 'error').length;

      if (successCount > 0) {
        toast({
          title: 'Migration Successful',
          description: `${successCount} token(s) successfully encrypted. Your bank connections are now more secure.`,
        });
        
        // Refresh after short delay
        setTimeout(() => {
          onMigrationComplete?.();
          window.location.reload();
        }, 1500);
      } else if (failCount > 0) {
        toast({
          title: 'Migration Failed',
          description: 'Unable to encrypt tokens. Please try disconnecting and reconnecting your accounts.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Migration error:', error);
      toast({
        title: 'Migration Failed',
        description: error.message || 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsMigrating(false);
    }
  };

  if (unmigrated_item_ids.length === 0) {
    return null;
  }

  return (
    <Alert className="mb-6 border-yellow-500 bg-yellow-50">
      <Shield className="h-4 w-4 text-yellow-600" />
      <AlertTitle className="text-yellow-900">Security Upgrade Available</AlertTitle>
      <AlertDescription className="text-yellow-800">
        <p className="mb-3">
          {unmigrated_item_ids.length} of your bank connection(s) can be upgraded to use encrypted storage for enhanced security.
        </p>
        <Button 
          onClick={handleMigrate} 
          disabled={isMigrating}
          variant="default"
          size="sm"
          className="bg-yellow-600 hover:bg-yellow-700"
        >
          {isMigrating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Encrypting Tokens...
            </>
          ) : (
            <>
              <Shield className="mr-2 h-4 w-4" />
              Upgrade Security Now
            </>
          )}
        </Button>
        <p className="mt-2 text-xs">
          This will encrypt your Plaid access tokens using vault storage without disconnecting your accounts.
        </p>
      </AlertDescription>
    </Alert>
  );
};
