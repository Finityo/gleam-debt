import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Trash2 } from 'lucide-react';

export const DebtCleanup = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCleanup = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Delete entries with name "Credit Card" and balance 0 (the bad duplicates)
      const { error, count } = await supabase
        .from('debts')
        .delete()
        .eq('user_id', user.id)
        .eq('name', 'Credit Card')
        .eq('balance', 0);

      if (error) throw error;

      toast({
        title: 'Cleanup Complete',
        description: `Removed ${count || 0} duplicate placeholder entries`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to clean up duplicates',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Clean Up Duplicate Debts</CardTitle>
        <CardDescription>
          Remove placeholder "Credit Card" entries with $0 balance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={handleCleanup} 
          disabled={loading}
          variant="destructive"
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Cleaning up...
            </>
          ) : (
            <>
              <Trash2 className="mr-2 h-4 w-4" />
              Remove Duplicate Entries
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
