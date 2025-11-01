import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { DebtCalculator } from '@/components/DebtCalculator';
import { Loader2, ArrowLeft } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';
import type { User } from '@supabase/supabase-js';

const Debts = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate('/auth');
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        
        if (!session) {
          navigate('/auth');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="My Debts | Finityo Debt Payoff"
        description="Track, manage, and optimize your debt payoff strategy with Finityo"
        canonical="https://finityo-debt.com/debts"
      />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-4xl font-bold text-foreground">My Debts</h1>
          <p className="text-muted-foreground mt-2">
            Track, manage, and optimize your debt payoff strategy
          </p>
        </div>

        <DebtCalculator />
      </div>
    </div>
  );
};

export default Debts;
