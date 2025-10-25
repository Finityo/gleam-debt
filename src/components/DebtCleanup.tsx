import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Trash2, AlertCircle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface Debt {
  id: string;
  name: string;
  balance: number;
  last4?: string;
  apr: number;
  min_payment: number;
}

interface DuplicateGroup {
  baseName: string;
  debts: Debt[];
}

export const DebtCleanup = () => {
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [selectedForDeletion, setSelectedForDeletion] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const normalizeName = (name: string): string => {
    // Remove last 4 digits pattern and common variations
    return name
      .replace(/\s*[-•]\s*\d{4}$/i, '')
      .replace(/\s*\(.*?\d{4}.*?\)$/i, '')
      .replace(/\s*x+\d{4}$/i, '')
      .toLowerCase()
      .trim();
  };

  const findDuplicates = async () => {
    setAnalyzing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: debts, error } = await supabase
        .from('debts')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      // Group debts by normalized name
      const groups = new Map<string, Debt[]>();
      
      debts?.forEach((debt) => {
        const normalized = normalizeName(debt.name);
        if (!groups.has(normalized)) {
          groups.set(normalized, []);
        }
        groups.get(normalized)!.push(debt);
      });

      // Filter to only groups with duplicates
      const duplicateGroups: DuplicateGroup[] = [];
      groups.forEach((debts, baseName) => {
        if (debts.length > 1) {
          duplicateGroups.push({ baseName, debts });
        }
      });

      setDuplicates(duplicateGroups);

      if (duplicateGroups.length === 0) {
        toast({
          title: 'No Duplicates Found',
          description: 'Your debt list looks clean!',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to analyze debts',
        variant: 'destructive',
      });
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    findDuplicates();
  }, []);

  const toggleSelection = (debtId: string) => {
    const newSet = new Set(selectedForDeletion);
    if (newSet.has(debtId)) {
      newSet.delete(debtId);
    } else {
      newSet.add(debtId);
    }
    setSelectedForDeletion(newSet);
  };

  const handleCleanup = async () => {
    if (selectedForDeletion.size === 0) {
      toast({
        title: 'No Selection',
        description: 'Please select debts to remove',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('debts')
        .delete()
        .in('id', Array.from(selectedForDeletion));

      if (error) throw error;

      toast({
        title: 'Cleanup Complete',
        description: `Removed ${selectedForDeletion.size} duplicate entries`,
      });

      setSelectedForDeletion(new Set());
      await findDuplicates();
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
          Smart duplicate detection - matches similar account names even with different identifiers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {analyzing ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Analyzing debts...</span>
          </div>
        ) : duplicates.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>No duplicates found</span>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {duplicates.map((group, idx) => (
                <div key={idx} className="border rounded-lg p-4 space-y-2">
                  <h4 className="font-semibold capitalize">{group.baseName}</h4>
                  <div className="space-y-2">
                    {group.debts.map((debt) => (
                      <div key={debt.id} className="flex items-start gap-3 p-2 hover:bg-muted/50 rounded">
                        <Checkbox
                          checked={selectedForDeletion.has(debt.id)}
                          onCheckedChange={() => toggleSelection(debt.id)}
                        />
                        <div className="flex-1 text-sm">
                          <div className="font-medium">{debt.name}</div>
                          <div className="text-muted-foreground">
                            Balance: ${debt.balance.toLocaleString()} • 
                            APR: {debt.apr}% • 
                            Min Payment: ${debt.min_payment}
                            {debt.last4 && ` • ****${debt.last4}`}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <Button 
              onClick={handleCleanup} 
              disabled={loading || selectedForDeletion.size === 0}
              variant="destructive"
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove {selectedForDeletion.size} Selected Debts
                </>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};
