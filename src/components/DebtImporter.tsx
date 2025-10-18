import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Download } from 'lucide-react';

interface DebtImporterProps {
  onImportComplete?: () => void;
}

export const DebtImporter = ({ onImportComplete }: DebtImporterProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleImport = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('plaid-import-debts');

      if (error) throw error;

      toast({
        title: 'Success!',
        description: data.message || 'Debts imported from your connected accounts',
      });

      if (onImportComplete) {
        onImportComplete();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to import debts',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Debts from Plaid</CardTitle>
        <CardDescription>
          Automatically import your credit cards, loans, and mortgages from connected accounts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={handleImport} 
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Import Debts from Plaid
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
