import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlaidLink } from '@/components/PlaidLink';
import { PlaidUpdateBanner } from '@/components/PlaidUpdateBanner';
import { PlaidTokenMigration } from '@/components/PlaidTokenMigration';
import { AccountsList } from '@/components/AccountsList';
import { ConnectedAccountsList } from '@/components/ConnectedAccountsList';
import { PlaidAnalytics } from '@/components/PlaidAnalytics';
import { useToast } from '@/hooks/use-toast';
import { Loader2, LogOut, PieChart, Calculator, User as UserIcon, Bot } from 'lucide-react';
import type { User, Session } from '@supabase/supabase-js';
import { logError } from '@/utils/logger';

interface Account {
  id: string;
  name: string;
  official_name: string | null;
  type: string;
  subtype: string | null;
  mask: string | null;
  current_balance: number;
  available_balance: number | null;
  currency_code: string;
  plaid_items: {
    id: string;
    item_id: string;
    institution_name: string | null;
  };
}

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [unmigratedItemIds, setUnmigratedItemIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPlaidLink, setShowPlaidLink] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session) {
          navigate('/auth');
        } else if (event === 'SIGNED_IN') {
          // Defer the account fetch to avoid blocking the callback
          setTimeout(() => {
            fetchAccounts();
          }, 0);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate('/auth');
      } else {
        fetchAccounts();
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchAccounts = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('plaid-get-accounts');
      
      if (error) throw error;
      
      setAccounts(data.accounts || []);
      
      // Check for unmigrated tokens (only if user is authenticated)
      if (user?.id) {
        const { data: items, error: itemsError } = await supabase
          .from('plaid_items')
          .select('item_id, vault_secret_id, access_token')
          .eq('user_id', user.id);
        
        if (!itemsError && items) {
          const unmigrated = items
            .filter(item => !item.vault_secret_id && item.access_token)
            .map(item => item.item_id);
          setUnmigratedItemIds(unmigrated);
          
          // Show toast notification if unmigrated tokens detected
          if (unmigrated.length > 0) {
            toast({
              title: '🔒 Security Upgrade Available',
              description: `${unmigrated.length} bank connection(s) can be upgraded to encrypted storage. Please upgrade to ensure full account management capabilities.`,
              duration: 10000,
            });
          }
        }
      }
    } catch (error: any) {
      logError('Dashboard - Fetch Accounts', error);
      toast({
        title: 'Error',
        description: 'Failed to load accounts',
        variant: 'destructive',
      });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-2">{user?.email}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/profile')}>
              <UserIcon className="w-4 h-4 mr-2" />
              Profile
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        <PlaidUpdateBanner />
        
        <PlaidAnalytics />
        
        <PlaidTokenMigration 
          unmigrated_item_ids={unmigratedItemIds}
          onMigrationComplete={fetchAccounts}
        />

        <div className="grid gap-6 mb-8">
          {/* Show connected accounts to prevent accidental duplicates */}
          {accounts.length > 0 && <ConnectedAccountsList />}
          
          {/* Only show PlaidLink when user clicks the button */}
          {!showPlaidLink && accounts.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <p className="text-muted-foreground">
                    Connect your bank account to get started
                  </p>
                  <Button 
                    onClick={() => setShowPlaidLink(true)}
                    size="lg"
                  >
                    Connect Bank Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          {showPlaidLink && (
            <PlaidLink onSuccess={() => {
              setShowPlaidLink(false);
              fetchAccounts();
            }} />
          )}
          
          {accounts.length > 0 && (
            <Button 
              onClick={() => setShowPlaidLink(true)}
              size="lg"
              variant="outline"
              className="w-full sm:w-auto"
            >
              Connect Another Bank Account
            </Button>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => navigate('/debts')}
              size="lg"
              variant="outline"
              className="w-full"
            >
              <Calculator className="w-4 h-4 mr-2" />
              Manage Debts & Payoff Strategy
            </Button>
            
            <Button
              onClick={() => navigate('/debt-chart')}
              size="lg"
              variant="outline"
              className="w-full"
            >
              <PieChart className="w-4 h-4 mr-2" />
              View Debt Visualization
            </Button>

            <Button
              onClick={() => navigate('/ai-advisor')}
              size="lg"
              variant="outline"
              className="w-full"
            >
              <Bot className="w-4 h-4 mr-2" />
              AI Financial Advisor
            </Button>
          </div>
        </div>

        {accounts.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Connected Accounts</h2>
            <AccountsList accounts={accounts} onAccountsChange={fetchAccounts} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
