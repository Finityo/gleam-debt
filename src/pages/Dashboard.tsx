import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlaidLink } from '@/components/PlaidLink';
import { PlaidUpdateBanner } from '@/components/PlaidUpdateBanner';
import { PlaidTokenMigration } from '@/components/PlaidTokenMigration';
import { ConnectedAccountsList } from '@/components/ConnectedAccountsList';
import { PlaidAnalytics } from '@/components/PlaidAnalytics';
import { TrialSubscriptionDialog } from '@/components/TrialSubscriptionDialog';
import { DemoBanner } from '@/components/DemoBanner';
import { useToast } from '@/hooks/use-toast';
import { Loader2, LogOut, PieChart, Calculator, User as UserIcon, Bot, Calendar, FileText, UserCircle, Share2, Award, MessageSquare, Settings, AlertCircle } from 'lucide-react';
import { PrintExportButton } from '@/components/PrintExportButton';
import { PlanVersionHistory } from '@/components/PlanVersionHistory';
import type { User, Session } from '@supabase/supabase-js';
import { logError } from '@/utils/logger';
import { AppDB } from '@/live/lovableCloudDB';

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
  const [planData, setPlanData] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session) {
          navigate('/auth');
        } else if (event === 'SIGNED_IN' && !isFetching) {
          // Defer fetches to avoid blocking the callback
          setTimeout(() => {
            fetchAccounts();
            loadPlanData(session.user.id);
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
        loadPlanData(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadPlanData = async (userId: string) => {
    try {
      const data = await AppDB.get(userId);
      setPlanData(data);
    } catch (error) {
      logError('Dashboard - Load Plan Data', error);
    }
  };

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
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-4xl font-bold text-foreground">Dashboard</h1>
              <p className="text-muted-foreground mt-2">Welcome to your Finityo workspace</p>
            </div>
            <div className="flex gap-2 no-print">
              <Button variant="outline" size="sm" onClick={() => navigate('/settings')}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          {planData?.debts?.length > 0 && (
            <div className="grid gap-4 md:grid-cols-3 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Debt</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(planData.debts.reduce((sum: number, d: any) => sum + (d.balance || 0), 0))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Active Debts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{planData.debts.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Strategy</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold capitalize">
                    {planData.settings?.strategy || 'Snowball'}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
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
          
          {/* Main Navigation Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
            <DashboardCard
              title="My Debts"
              description="Add, edit, and manage your debts"
              icon={<Calculator className="w-6 h-6" />}
              href="/debts"
            />
            
            <DashboardCard
              title="Debt Plan"
              description="Configure your payoff strategy"
              icon={<Calendar className="w-6 h-6" />}
              href="/debt-plan"
            />
            
            <DashboardCard
              title="Visualization"
              description="See your progress charts"
              icon={<PieChart className="w-6 h-6" />}
              href="/visualization"
            />
            
            <DashboardCard
              title="Payoff Calendar"
              description="View payoff timeline"
              icon={<Calendar className="w-6 h-6" />}
              href="/payoff-calendar"
            />
            
            <DashboardCard
              title="Scenarios"
              description="Compare different strategies"
              icon={<FileText className="w-6 h-6" />}
              href="/scenarios"
            />
            
            <DashboardCard
              title="Share History"
              description="View shared plans"
              icon={<Share2 className="w-6 h-6" />}
              href="/share/history"
            />
            
            <DashboardCard
              title="AI Advisor"
              description="Get personalized guidance"
              icon={<Bot className="w-6 h-6" />}
              href="/ai-advisor"
            />
            
            <DashboardCard
              title="Profile"
              description="Manage your account"
              icon={<UserCircle className="w-6 h-6" />}
              href="/profile"
            />
          </div>

          {/* Quick Start Guide */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Quick Start Guide</CardTitle>
              <CardDescription>Follow these steps to get started with Finityo</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 text-sm">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">1</span>
                  <span>Add your debts manually or import from your bank using Plaid</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">2</span>
                  <span>Configure your debt plan and choose between Snowball or Avalanche strategy</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">3</span>
                  <span>Track your progress with visualizations and calendar view</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">4</span>
                  <span>Export, share, and get AI advisor tips to stay on track</span>
                </li>
              </ol>
            </CardContent>
          </Card>
        </div>

        {accounts.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Connected Bank Accounts</h2>
            <ConnectedAccountsList />
          </div>
        )}
      </div>
    </div>
  );
};

function DashboardCard({ title, description, icon, href }: {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}) {
  return (
    <Link to={href}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg mb-1">{title}</CardTitle>
              <CardDescription className="text-sm">{description}</CardDescription>
            </div>
            <div className="text-primary">{icon}</div>
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
}

export default Dashboard;
