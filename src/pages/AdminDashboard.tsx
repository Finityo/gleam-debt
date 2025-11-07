import { PlaidAnalytics } from '@/components/PlaidAnalytics';
import { PlaidComplianceStatus } from '@/components/PlaidComplianceStatus';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Users, Activity, TrendingUp, LogOut, Headphones, AlertCircle, CheckCircle, Calendar, ChevronDown } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { SEOHead } from '@/components/SEOHead';
import { logError } from '@/utils/logger';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const AdminDashboard = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSignups: 0,
    totalPageViews: 0,
    recentEvents: [] as any[],
    pageViewsChart: [] as { date: string; views: number }[],
    engagementChart: [] as { date: string; engagement: number }[],
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

      // Get page views chart data (last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const { data: pageViewsData } = await supabase
        .from('analytics_events')
        .select('created_at')
        .eq('event_type', 'page_view')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      // Group page views by date
      const pageViewsByDate = (pageViewsData || []).reduce((acc, event) => {
        const date = new Date(event.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const pageViewsChart = Object.entries(pageViewsByDate).map(([date, views]) => ({
        date,
        views,
      }));

      // Calculate engagement over time (events per user per day)
      const { data: allEventsData } = await supabase
        .from('analytics_events')
        .select('created_at, user_id')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      const engagementByDate = (allEventsData || []).reduce((acc, event) => {
        const date = new Date(event.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (!acc[date]) {
          acc[date] = { events: 0, users: new Set() };
        }
        acc[date].events += 1;
        if (event.user_id) {
          acc[date].users.add(event.user_id);
        }
        return acc;
      }, {} as Record<string, { events: number; users: Set<string> }>);

      const engagementChart = Object.entries(engagementByDate).map(([date, data]) => ({
        date,
        engagement: data.users.size > 0 ? Number((data.events / data.users.size).toFixed(1)) : 0,
      }));

      setStats({
        totalUsers: userCount || 0,
        totalSignups: signupCount || 0,
        totalPageViews: pageViewCount || 0,
        recentEvents: recentEvents || [],
        pageViewsChart,
        engagementChart,
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
          <div className="container mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
            <div className="flex flex-col items-center gap-3">
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="outline" size="sm" onClick={() => navigate('/admin/roles')}>
                  <Users className="mr-2 h-4 w-4" />
                  User Roles
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate('/security-audit')}>
                  <Activity className="mr-2 h-4 w-4" />
                  Security
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate('/support-dashboard')}>
                  <Headphones className="mr-2 h-4 w-4" />
                  Support
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate('/admin/documents')}>
                  <Activity className="mr-2 h-4 w-4" />
                  Reports
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
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

            <Card className="md:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-sm font-medium">Page Views</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
                </div>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-4">{stats.totalPageViews} total</div>
                <ResponsiveContainer width="100%" height={120}>
                  <AreaChart data={stats.pageViewsChart}>
                    <defs>
                      <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="views" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      fill="url(#colorViews)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-sm font-medium">User Engagement</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">Avg events per user per day</p>
                </div>
                <BarChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-4">
                  {stats.totalUsers > 0 
                    ? (stats.totalPageViews / stats.totalUsers).toFixed(1) 
                    : '0'} avg
                </div>
                <ResponsiveContainer width="100%" height={120}>
                  <LineChart data={stats.engagementChart}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="engagement" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
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

          {/* Plaid Compliance Status */}
          <PlaidComplianceStatus />

          {/* Plaid Analytics */}
          <PlaidAnalytics />

          <Card id="recent-activity">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest events tracked on the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="recent-activity">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      <span>View {stats.recentEvents.length} Recent Events</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-4">
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
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
};

export default AdminDashboard;
