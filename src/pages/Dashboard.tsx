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
import { TrialSubscriptionDialog } from '@/components/TrialSubscriptionDialog';
import { DemoBanner } from '@/components/DemoBanner';
import { useToast } from '@/hooks/use-toast';
import { Loader2, LogOut, PieChart, Calculator, User as UserIcon, Bot, Calendar, FileText, UserCircle, Printer, AlertCircle } from 'lucide-react';
import { PrintExportButton } from '@/components/PrintExportButton';
import type { User, Session } from '@supabase/supabase-js';
import { logError } from '@/utils/logger';
import { DEMO } from '@/config/demo';

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
  const [isFetching, setIsFetching] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    // Skip auth checks in demo mode
    if (DEMO) {
      setLoading(false);
      return;
    }
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session) {
          navigate('/auth');
        } else if (event === 'SIGNED_IN' && !isFetching) {
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
      } else if (!isFetching) {
        fetchAccounts();
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchAccounts = async () => {
    if (isFetching) return; // Prevent duplicate fetches
    
    try {
      setIsFetching(true);
      const { data, error } = await supabase.functions.invoke('plaid-get-accounts');
      
      if (error) throw error;
      
      setAccounts(data.accounts || []);
      
      // Check for unmigrated tokens (only if user is authenticated)
      if (user?.id) {
        const { data: items, error: itemsError } = await supabase
          .from('plaid_items')
          .select('item_id, vault_secret_id, access_token')
          .eq('user_id', user.id);
        
        if (!itemsError && items && items.length > 0) {
          // Token migration complete - access_token column removed in security migration
          setUnmigratedItemIds([]);
        }
      }
    } catch (error: any) {
      logError('Dashboard - Fetch Accounts', error);
      toast({
        title: 'Error',
        description: 'Failed to load accounts',
        variant: 'destructive',
      });
    } finally {
      setIsFetching(false);
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
      <DemoBanner />
      <TrialSubscriptionDialog />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-2">{user?.email}</p>
          </div>
          <div className="flex gap-2 no-print">
            <PrintExportButton onPrint={handlePrint} />
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
          
          {accounts.length > 0 && !showPlaidLink && (
            <Button 
              onClick={() => setShowPlaidLink(true)}
              size="lg"
              variant="outline"
              className="w-full sm:w-auto"
            >
              Connect Another Bank Account
            </Button>
          )}
          
          <div className="space-y-8">
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Guided Debt Freedom Flow</h2>
              <p className="text-muted-foreground mb-6">
                Follow this step-by-step process to take control of your finances
              </p>
              
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Import Your Debts</p>
                    <p className="text-blue-800 dark:text-blue-200 leading-relaxed">
                      <strong>Step 1:</strong> Use "Import from Bank" to connect your accounts via Plaid for automatic import.<br/>
                      <strong>Step 2:</strong> For banks not supported by Plaid, download the blank Excel template and fill in your debt information manually, then upload it using "Import Excel".<br/>
                      <strong>Step 3:</strong> Any remaining debts can be added manually using the form below.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button
                  onClick={() => navigate('/debts')}
                  size="lg"
                  variant="outline"
                  className="w-full h-24 flex-col gap-2"
                >
                  <Calculator className="w-6 h-6" />
                  <div className="text-center">
                    <div className="font-bold">My Debts</div>
                    <div className="text-xs text-muted-foreground">Step 1: Track & manage</div>
                  </div>
                </Button>
                
                <Button
                  onClick={() => navigate('/debt-chart')}
                  size="lg"
                  variant="outline"
                  className="w-full h-24 flex-col gap-2"
                >
                  <PieChart className="w-6 h-6" />
                  <div className="text-center">
                    <div className="font-bold">Debt Chart</div>
                    <div className="text-xs text-muted-foreground">Step 2: Visualize data</div>
                  </div>
                </Button>

                <Button
                  onClick={() => navigate('/debt-plan')}
                  size="lg"
                  variant="outline"
                  className="w-full h-24 flex-col gap-2"
                >
                  <Calendar className="w-6 h-6" />
                  <div className="text-center">
                    <div className="font-bold">Debt Plan</div>
                    <div className="text-xs text-muted-foreground">Step 3: Create strategy</div>
                  </div>
                </Button>

                <Button
                  onClick={() => navigate('/ai-advisor')}
                  size="lg"
                  variant="outline"
                  className="w-full h-24 flex-col gap-2"
                >
                  <Bot className="w-6 h-6" />
                  <div className="text-center">
                    <div className="font-bold">AI Advisor</div>
                    <div className="text-xs text-muted-foreground">Step 4: Get guidance</div>
                  </div>
                </Button>

                <Button
                  onClick={() => navigate('/profile')}
                  size="lg"
                  variant="outline"
                  className="w-full h-24 flex-col gap-2"
                >
                  <UserCircle className="w-6 h-6" />
                  <div className="text-center">
                    <div className="font-bold">Profile & Data</div>
                    <div className="text-xs text-muted-foreground">Step 5: Manage account</div>
                  </div>
                </Button>
              </div>
            </div>
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
