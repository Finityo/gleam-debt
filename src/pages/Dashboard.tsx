import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlaidUpdateBanner } from '@/components/PlaidUpdateBanner';
import { PlaidTokenMigration } from '@/components/PlaidTokenMigration';
import { ConnectedAccountsList } from '@/components/ConnectedAccountsList';
import { PlaidAnalytics } from '@/components/PlaidAnalytics';
import { ActivityLog } from '@/components/ActivityLog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, LogOut, PieChart, Calculator, User as UserIcon, Bot, Calendar, FileText, UserCircle, Share2, Award, MessageSquare, Settings, AlertCircle, CreditCard, Crown, Building2 } from 'lucide-react';
import { PrintExportButton } from '@/components/PrintExportButton';
import { PlanVersionHistory } from '@/components/PlanVersionHistory';
import type { User, Session } from '@supabase/supabase-js';
import { logError } from '@/utils/logger';
import { AppDB } from '@/live/lovableCloudDB';
import { useSubscription } from '@/hooks/useSubscription';
import FinancialDashboardExtras from '@/features/FinancialDashboardExtras';
import AdvancedInsightsSection from '@/features/AdvancedInsightsSection';
import RecommendationsCard from '@/components/RecommendationsCard';
import WhatIfCalculator from '@/components/WhatIfCalculator';
import EnhancedCoachPanel from '@/components/EnhancedCoachPanel';
import PayoffIntelligenceSection from '@/features/PayoffIntelligenceSection';
import SmartPayoffSuite from '@/features/SmartPayoffSuite';
import ImpactSuite from '@/features/ImpactSuite';
import EngagementSuite from '@/features/EngagementSuite';
import IntelligenceSuite from '@/features/IntelligenceSuite';
import { DEMO } from '@/config/demo';
import PlanGate from '@/components/PlanGate';
import ReauthPlaidCard from '@/components/ReauthPlaidCard';

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
  const [isFetching, setIsFetching] = useState(false);
  const [planData, setPlanData] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const subscription = useSubscription();

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
      
      // Load profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      setProfileData(profile);
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
      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">Dashboard</h1>
              <p className="text-muted-foreground mt-2">
                Welcome back{profileData?.first_name ? `, ${profileData.first_name}` : ''}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 no-print w-full sm:w-auto">
              <Button 
                size="sm" 
                onClick={() => navigate('/plaid-connect')}
                className="flex-1 sm:flex-none bg-gradient-to-r from-cyan-600 via-teal-600 to-cyan-600 hover:from-cyan-500 hover:via-teal-500 hover:to-cyan-500 text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 border-0 transition-all duration-300"
              >
                <Building2 className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Connect Bank</span>
                <span className="sm:hidden">Bank</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/settings')} className="flex-1 sm:flex-none">
                <Settings className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Settings</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleSignOut} className="flex-1 sm:flex-none">
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </div>

          {/* Subscription Status Banner */}
          {!subscription.loading && (
            <div className="mb-6 bg-gradient-to-br from-pink-950/40 via-fuchsia-950/30 to-purple-950/40 backdrop-blur-sm border border-pink-500/30 rounded-xl p-6 shadow-lg hover:shadow-pink-500/20 hover:border-pink-400/50 transition-all duration-300 hover:bg-gradient-to-br hover:from-pink-900/50 hover:via-fuchsia-900/40 hover:to-purple-900/50">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  {subscription.subscribed ? (
                    <>
                      <Crown className="w-6 h-6 text-pink-300" />
                      <div>
                        <div className="font-semibold text-pink-100 flex items-center gap-2">
                          {subscription.getTierDisplayName()} Plan
                          <Badge className="bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border-emerald-400/30">
                            Active
                          </Badge>
                        </div>
                        <div className="text-sm text-fuchsia-300/80">
                          Renews {subscription.formatSubscriptionEnd()}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-6 h-6 text-purple-300" />
                      <div>
                        <div className="font-semibold text-purple-100">Free Plan</div>
                        <div className="text-sm text-pink-300/80">
                          Upgrade to unlock premium features
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex gap-2">
                  {subscription.subscribed ? (
                    <Button variant="outline" size="sm" onClick={subscription.openCustomerPortal} className="border-pink-500/40 bg-slate-900/30 hover:bg-pink-500/10 hover:border-pink-400/60 text-pink-200 hover:text-pink-100">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Manage
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => navigate('/pricing')} className="bg-gradient-to-r from-pink-500 via-fuchsia-500 to-purple-500 hover:opacity-90 text-white">
                      <Crown className="w-4 h-4 mr-2" />
                      Upgrade
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Plaid Re-authentication Card */}
          <ReauthPlaidCard />

          {/* Quick Stats */}
          {planData?.debts?.length > 0 && (
            <div className="grid gap-4 md:grid-cols-3 mb-6">
              <div className="bg-gradient-to-br from-cyan-950/40 via-teal-950/30 to-cyan-900/40 backdrop-blur-sm border border-cyan-500/30 rounded-xl p-6 shadow-lg hover:shadow-cyan-500/20 hover:border-cyan-400/50 transition-all duration-300 hover:bg-gradient-to-br hover:from-cyan-900/50 hover:via-teal-900/40 hover:to-cyan-800/50">
                <div className="text-sm font-medium text-cyan-300 mb-2">Total Debt</div>
                <div className="text-3xl font-bold bg-gradient-to-r from-cyan-200 to-teal-200 bg-clip-text text-transparent">
                  {formatCurrency(planData.debts.reduce((sum: number, d: any) => sum + (d.balance || 0), 0))}
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-950/40 via-fuchsia-950/30 to-purple-900/40 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6 shadow-lg hover:shadow-purple-500/20 hover:border-purple-400/50 transition-all duration-300 hover:bg-gradient-to-br hover:from-purple-900/50 hover:via-fuchsia-900/40 hover:to-purple-800/50">
                <div className="text-sm font-medium text-purple-300 mb-2">Active Debts</div>
                <div className="text-3xl font-bold bg-gradient-to-r from-purple-200 to-fuchsia-200 bg-clip-text text-transparent">{planData.debts.length}</div>
              </div>
              <div className="bg-gradient-to-br from-pink-950/40 via-rose-950/30 to-pink-900/40 backdrop-blur-sm border border-pink-500/30 rounded-xl p-6 shadow-lg hover:shadow-pink-500/20 hover:border-pink-400/50 transition-all duration-300 hover:bg-gradient-to-br hover:from-pink-900/50 hover:via-rose-900/40 hover:to-pink-800/50">
                <div className="text-sm font-medium text-pink-300 mb-2">Strategy</div>
                <div className="text-3xl font-bold bg-gradient-to-r from-pink-200 to-rose-200 bg-clip-text text-transparent capitalize">
                  {planData.settings?.strategy || 'Snowball'}
                </div>
              </div>
            </div>
          )}
        </div>

        <PlaidUpdateBanner />
        
        <PlaidAnalytics />
        
        {user && !DEMO && (
          <>
            <FinancialDashboardExtras />
            
            <PlanGate feature="canSeeInsights">
              <AdvancedInsightsSection />
            </PlanGate>
            
            <PayoffIntelligenceSection />
            
            <PlanGate feature="canUseWhatIf">
              <SmartPayoffSuite />
            </PlanGate>
            
            <ImpactSuite />
            
            <PlanGate feature="canSeeHeatmap">
              <EngagementSuite />
            </PlanGate>
            
            <PlanGate feature="canUseCoach">
              <IntelligenceSuite />
            </PlanGate>
            
            <div className="mt-6">
              <EnhancedCoachPanel />
            </div>
          </>
        )}
        
        <PlaidTokenMigration
          unmigrated_item_ids={unmigratedItemIds}
          onMigrationComplete={fetchAccounts}
        />

        <div className="grid gap-6 mb-8">
          {/* Show connected accounts to prevent accidental duplicates */}
          {accounts.length > 0 && <ConnectedAccountsList />}
          
          {/* Show connect button when no accounts */}
          {accounts.length === 0 && (
            <Card className="glass-intense border-primary/30">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <p className="text-foreground">
                    Connect your bank account to get started
                  </p>
                  <Button 
                    onClick={() => navigate('/plaid-connect')}
                    size="lg"
                    className="bg-gradient-to-r from-cyan-600 via-teal-600 to-cyan-600 hover:from-cyan-500 hover:via-teal-500 hover:to-cyan-500 text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50"
                  >
                    <Building2 className="w-5 h-5 mr-2" />
                    Connect Bank Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Show "Connect Another" button when accounts exist */}
          {accounts.length > 0 && (
            <Button 
              onClick={() => navigate('/plaid-connect')}
              size="lg"
              variant="outline"
              className="w-full sm:w-auto border-cyan-500/40 hover:bg-cyan-500/10 hover:border-cyan-400/60 text-cyan-300 hover:text-cyan-200"
            >
              <Building2 className="w-5 h-5 mr-2" />
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
          <div className="grid gap-6 md:grid-cols-2 mb-8">
            <div className="bg-gradient-to-br from-emerald-950/40 via-teal-950/30 to-green-900/40 backdrop-blur-sm border border-emerald-500/30 rounded-xl p-6 shadow-lg hover:shadow-emerald-500/20 hover:border-emerald-400/50 transition-all duration-300 hover:bg-gradient-to-br hover:from-emerald-900/50 hover:via-teal-900/40 hover:to-green-800/50">
              <h3 className="text-xl font-semibold mb-2 bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">Quick Start Guide</h3>
              <p className="text-sm text-emerald-300/70 mb-4">Follow these steps to get started with Finityo</p>
              <ol className="space-y-3 text-sm">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white flex items-center justify-center text-xs font-semibold">1</span>
                  <span className="text-emerald-100">Add your debts manually or import from your bank using Plaid</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white flex items-center justify-center text-xs font-semibold">2</span>
                  <span className="text-emerald-100">Configure your debt plan and choose between Snowball or Avalanche strategy</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white flex items-center justify-center text-xs font-semibold">3</span>
                  <span className="text-emerald-100">Track your progress with visualizations and calendar view</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white flex items-center justify-center text-xs font-semibold">4</span>
                  <span className="text-emerald-100">Export, share, and get AI advisor tips to stay on track</span>
                </li>
              </ol>
            </div>

            {/* Activity Log */}
            {user && <ActivityLog userId={user.id} limit={8} />}
          </div>
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

const cardColors = [
  'from-purple-950/40 via-violet-950/30 to-purple-900/40 border-purple-500/30 hover:shadow-purple-500/20 hover:border-purple-400/50 hover:from-purple-900/50 hover:via-violet-900/40 hover:to-purple-800/50',
  'from-pink-950/40 via-fuchsia-950/30 to-pink-900/40 border-pink-500/30 hover:shadow-pink-500/20 hover:border-pink-400/50 hover:from-pink-900/50 hover:via-fuchsia-900/40 hover:to-pink-800/50',
  'from-cyan-950/40 via-sky-950/30 to-cyan-900/40 border-cyan-500/30 hover:shadow-cyan-500/20 hover:border-cyan-400/50 hover:from-cyan-900/50 hover:via-sky-900/40 hover:to-cyan-800/50',
  'from-teal-950/40 via-emerald-950/30 to-teal-900/40 border-teal-500/30 hover:shadow-teal-500/20 hover:border-teal-400/50 hover:from-teal-900/50 hover:via-emerald-900/40 hover:to-teal-800/50',
  'from-fuchsia-950/40 via-pink-950/30 to-purple-900/40 border-fuchsia-500/30 hover:shadow-fuchsia-500/20 hover:border-fuchsia-400/50 hover:from-fuchsia-900/50 hover:via-pink-900/40 hover:to-purple-800/50',
  'from-violet-950/40 via-purple-950/30 to-indigo-900/40 border-violet-500/30 hover:shadow-violet-500/20 hover:border-violet-400/50 hover:from-violet-900/50 hover:via-purple-900/40 hover:to-indigo-800/50',
  'from-rose-950/40 via-pink-950/30 to-rose-900/40 border-rose-500/30 hover:shadow-rose-500/20 hover:border-rose-400/50 hover:from-rose-900/50 hover:via-pink-900/40 hover:to-rose-800/50',
  'from-sky-950/40 via-cyan-950/30 to-blue-900/40 border-sky-500/30 hover:shadow-sky-500/20 hover:border-sky-400/50 hover:from-sky-900/50 hover:via-cyan-900/40 hover:to-blue-800/50',
];

let cardColorIndex = 0;

function DashboardCard({ title, description, icon, href }: {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}) {
  const colorClass = cardColors[cardColorIndex % cardColors.length];
  cardColorIndex++;
  
  return (
    <Link to={href}>
      <div className={`bg-gradient-to-br backdrop-blur-sm border rounded-xl p-6 shadow-lg transition-all duration-300 cursor-pointer h-full ${colorClass}`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-1 text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <div className="text-primary/80">{icon}</div>
        </div>
      </div>
    </Link>
  );
}

export default Dashboard;
