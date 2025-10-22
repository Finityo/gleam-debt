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
    <Alert className="mb-6 border-orange-500 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-700">
      <Shield className="h-4 w-4 text-orange-600 dark:text-orange-500" />
      <AlertTitle className="text-orange-900 dark:text-orange-200 font-semibold">⚠️ Security Upgrade Required</AlertTitle>
      <AlertDescription className="text-orange-800 dark:text-orange-300">
        <p className="mb-2 font-medium">
          {unmigrated_item_ids.length} bank connection(s) need a security upgrade before they can be disconnected or modified.
        </p>
        <p className="mb-3 text-sm">
          Your tokens will be encrypted using secure vault storage. This is required for account management and enhanced security.
        </p>
        <Button 
          onClick={handleMigrate} 
          disabled={isMigrating}
          variant="default"
          size="sm"
          className="bg-orange-600 hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-600"
        >
          {isMigrating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Encrypting {unmigrated_item_ids.length} Token(s)...
            </>
          ) : (
            <>
              <Shield className="mr-2 h-4 w-4" />
              Upgrade Security Now
            </>
          )}
        </Button>
        <p className="mt-3 text-xs text-orange-700 dark:text-orange-400">
          ✓ No account disconnection required<br />
          ✓ Complies with Plaid security standards<br />
          ✓ Takes less than 30 seconds
        </p>
      </AlertDescription>
    </Alert>
  );
};
