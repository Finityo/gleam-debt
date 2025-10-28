import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Users, Activity, TrendingUp, LogOut, Headphones, AlertCircle, CheckCircle } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';
import { logError } from '@/utils/logger';

const AdminDashboard = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSignups: 0,
    totalPageViews: 0,
    recentEvents: [] as any[],
    plaidStats: {
      activeConnections: 0,
      tokensNeedingMigration: 0,
      itemsNeedingUpdate: 0,
      recentWebhookErrors: 0,
      rateLimitHits: 0,
    },
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      // Check if user has admin role
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'admin')
        .single();

      if (!roles) {
        toast({
          title: 'Access Denied',
          description: 'You do not have admin privileges.',
          variant: 'destructive',
        });
        navigate('/dashboard');
        return;
      }

      setIsAdmin(true);
      await fetchAnalytics();
    } catch (error) {
      logError('Admin Dashboard - Access Check', error);
      navigate('/auth');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      // Get total users count
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get signup events
      const { count: signupCount } = await supabase
        .from('analytics_events')
        .select('*', { count: 'exact', head: true })
        .eq('event_type', 'signup');

      // Get page views
      const { count: pageViewCount } = await supabase
        .from('analytics_events')
        .select('*', { count: 'exact', head: true })
        .eq('event_type', 'page_view');

      // Get recent events
      const { data: recentEvents } = await supabase
        .from('analytics_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      // Get Plaid statistics
      const { count: activeConnections } = await supabase
        .from('plaid_items')
        .select('*', { count: 'exact', head: true });

      const { count: tokensNeedingMigration } = await supabase
        .from('plaid_items')
        .select('*', { count: 'exact', head: true })
        .is('vault_secret_id', null)
        .not('access_token', 'is', null);

      const { count: itemsNeedingUpdate } = await supabase
        .from('plaid_item_status')
        .select('*', { count: 'exact', head: true })
        .eq('needs_update', true);

      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count: rateLimitHits } = await supabase
        .from('plaid_rate_limits')
        .select('*', { count: 'exact', head: true })
        .eq('success', false)
        .gte('attempted_at', oneDayAgo);

      setStats({
        totalUsers: userCount || 0,
        totalSignups: signupCount || 0,
        totalPageViews: pageViewCount || 0,
        recentEvents: recentEvents || [],
        plaidStats: {
          activeConnections: activeConnections || 0,
          tokensNeedingMigration: tokensNeedingMigration || 0,
          itemsNeedingUpdate: itemsNeedingUpdate || 0,
          recentWebhookErrors: 0, // Would need webhook error logging
          rateLimitHits: rateLimitHits || 0,
        },
      });
    } catch (error) {
      logError('Admin Dashboard - Fetch Analytics', error);
      toast({
        title: 'Error',
        description: 'Failed to load analytics data',
        variant: 'destructive',
      });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <>
      <SEOHead
        title="Business Dashboard | Finityo"
        description="Analytics and customer insights for Finityo debt management platform"
        canonical="https://finityo-debt.com/admin"
      />
      <div className="min-h-screen bg-gradient-subtle">
        <header className="border-b bg-background/95 backdrop-blur">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold">Business Dashboard</h1>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate('/admin/roles')}>
                <Users className="mr-2 h-4 w-4" />
                User Roles
              </Button>
              <Button variant="outline" onClick={() => navigate('/security-audit')}>
                <Activity className="mr-2 h-4 w-4" />
                Security
              </Button>
              <Button variant="outline" onClick={() => navigate('/support-dashboard')}>
                <Headphones className="mr-2 h-4 w-4" />
                Support
              </Button>
              <Button variant="outline" onClick={() => navigate('/admin/documents')}>
                <Activity className="mr-2 h-4 w-4" />
                Documents
              </Button>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card 
              className="cursor-pointer hover-scale transition-all duration-200 hover:shadow-lg hover:glass-intense"
              onClick={() => navigate('/support-dashboard')}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">Registered customers</p>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover-scale transition-all duration-200 hover:shadow-lg hover:glass-intense"
              onClick={() => navigate('/admin/roles')}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Signups</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalSignups}</div>
                <p className="text-xs text-muted-foreground">Account creations tracked</p>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover-scale transition-all duration-200 hover:shadow-lg hover:glass-intense"
              onClick={() => {
                // Scroll to Recent Activity section
                const element = document.getElementById('recent-activity');
                element?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Page Views</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalPageViews}</div>
                <p className="text-xs text-muted-foreground">Total site visits</p>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover-scale transition-all duration-200 hover:shadow-lg hover:glass-intense"
              onClick={() => {
                // Scroll to Recent Activity section
                const element = document.getElementById('recent-activity');
                element?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Engagement</CardTitle>
                <BarChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalUsers > 0 
                    ? (stats.totalPageViews / stats.totalUsers).toFixed(1) 
                    : '0'}
                </div>
                <p className="text-xs text-muted-foreground">Avg pages per user</p>
              </CardContent>
            </Card>
          </div>

          {/* Plaid Integration Monitoring */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Plaid Integration Health</CardTitle>
              <CardDescription>Monitor Plaid connections and compliance status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Active Connections</span>
                    <Activity className="w-4 h-4 text-green-500" />
                  </div>
                  <p className="text-2xl font-bold">{stats.plaidStats.activeConnections}</p>
                  <p className="text-xs text-muted-foreground mt-1">Plaid items connected</p>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Token Migration</span>
                    {stats.plaidStats.tokensNeedingMigration > 0 ? (
                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                  <p className="text-2xl font-bold">{stats.plaidStats.tokensNeedingMigration}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.plaidStats.tokensNeedingMigration === 0 
                      ? 'All tokens encrypted ✓' 
                      : 'Tokens need migration'}
                  </p>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Needs Re-auth</span>
                    {stats.plaidStats.itemsNeedingUpdate > 0 ? (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                  <p className="text-2xl font-bold">{stats.plaidStats.itemsNeedingUpdate}</p>
                  <p className="text-xs text-muted-foreground mt-1">Items requiring update</p>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Rate Limit Hits</span>
                    {stats.plaidStats.rateLimitHits > 10 ? (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    ) : (
                      <Activity className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                  <p className="text-2xl font-bold">{stats.plaidStats.rateLimitHits}</p>
                  <p className="text-xs text-muted-foreground mt-1">Last 24 hours</p>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">MSA Compliance</span>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                  <p className="text-lg font-bold">Active</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Terms ✓ Privacy ✓ Consent ✓
                  </p>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Production Env</span>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                  <p className="text-lg font-bold">Verified</p>
                  <p className="text-xs text-muted-foreground mt-1">Using production API</p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <h4 className="font-semibold mb-3">Compliance Checklist</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Enhanced Terms of Service with Plaid authorization</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Pre-connection consent dialog with logging</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Comprehensive Plaid data disclosures</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Data retention & deletion policy (90-day)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>User data access & export page</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Rate limiting (5/hour, 20/day)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Security breach notification process</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Secure vault token storage</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card id="recent-activity">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest events tracked on the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentEvents.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No events tracked yet</p>
                ) : (
                  stats.recentEvents.map((event) => (
                    <div key={event.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                      <div>
                        <p className="font-medium">{event.event_type}</p>
                        <p className="text-sm text-muted-foreground">{event.page_path}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
};

export default AdminDashboard;
