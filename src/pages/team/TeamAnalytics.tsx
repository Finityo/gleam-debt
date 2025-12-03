import TeamLayout from "@/layouts/TeamLayout";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

const TeamAnalytics = () => {
  const [visitsData, setVisitsData] = useState([]);
  const [funnelData, setFunnelData] = useState([]);
  const [routeHeatmap, setRouteHeatmap] = useState([]);
  const [plaidSuccess, setPlaidSuccess] = useState({ success: 0, failed: 0 });
  const [dau, setDau] = useState(0);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      // Load visits (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: visits } = await supabase
        .from('analytics_visits')
        .select('timestamp')
        .gte('timestamp', thirtyDaysAgo.toISOString())
        .order('timestamp', { ascending: true });

      // Group by date
      const visitsByDate = visits?.reduce((acc: any, visit: any) => {
        const date = new Date(visit.timestamp).toLocaleDateString();
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});

      setVisitsData(
        Object.entries(visitsByDate || {}).map(([date, count]) => ({
          date,
          visits: count,
        }))
      );

      // Load funnel data
      const { data: profiles } = await supabase.from('profiles').select('onboarding_completed');
      const { data: usersWithDebts } = await supabase.from('debts').select('user_id');
      const { data: plaidItems } = await supabase.from('plaid_items').select('user_id');

      // Count unique users with debts
      const uniqueDebtUsers = new Set(usersWithDebts?.map(d => d.user_id) || []).size;

      setFunnelData([
        { step: 'Visited Landing', count: visits?.length || 0 },
        { step: 'Began Onboarding', count: profiles?.length || 0 },
        { step: 'Completed Onboarding', count: profiles?.filter(p => p.onboarding_completed).length || 0 },
        { step: 'Created Debt Plan', count: uniqueDebtUsers },
        { step: 'Linked Bank', count: plaidItems?.length || 0 },
      ]);

      // Load route heatmap
      const { data: routeVisits } = await supabase
        .from('analytics_visits')
        .select('page_path')
        .gte('timestamp', thirtyDaysAgo.toISOString());

      const routeCounts = routeVisits?.reduce((acc: any, visit: any) => {
        acc[visit.page_path] = (acc[visit.page_path] || 0) + 1;
        return acc;
      }, {});

      setRouteHeatmap(
        Object.entries(routeCounts || {})
          .map(([route, count]) => ({ route, count }))
          .sort((a: any, b: any) => b.count - a.count)
          .slice(0, 10)
      );

      // Load Plaid success rate
      const { data: plaidLogs } = await supabase
        .from('plaid_api_logs')
        .select('status_code')
        .gte('created_at', thirtyDaysAgo.toISOString());

      const successCount = plaidLogs?.filter(log => log.status_code === 200).length || 0;
      const failedCount = plaidLogs?.filter(log => log.status_code !== 200).length || 0;

      setPlaidSuccess({ success: successCount, failed: failedCount });

      // Calculate DAU (last 24 hours)
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const { data: recentVisits } = await supabase
        .from('analytics_visits')
        .select('ip')
        .gte('timestamp', twentyFourHoursAgo.toISOString());

      const uniqueIps = new Set(recentVisits?.map(v => v.ip).filter(Boolean));
      setDau(uniqueIps.size);

    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  return (
    <TeamLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive analytics and insights
          </p>
        </div>

        {/* DAU Card */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-2">Daily Active Users (24h)</h2>
          <p className="text-4xl font-bold text-primary">{dau}</p>
        </Card>

        {/* Website Visits */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Website Visits (Last 30 Days)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={visitsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="visits" stroke="hsl(var(--primary))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* User Funnel */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">User Funnel Metrics</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={funnelData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="step" type="category" width={150} />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Route Heatmap */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Engagement Heatmap (Top 10 Routes)</h2>
          <div className="space-y-2">
            {routeHeatmap.map((route: any, idx: number) => (
              <div key={idx} className="flex items-center gap-4">
                <div className="w-40 text-sm font-mono truncate">{route.route}</div>
                <div className="flex-1 bg-muted rounded-full h-8 overflow-hidden">
                  <div
                    className="bg-primary h-full flex items-center justify-end px-3 text-xs font-medium text-primary-foreground"
                    style={{ width: `${(route.count / routeHeatmap[0].count) * 100}%` }}
                  >
                    {route.count}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Plaid Success Rate */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Plaid Connection Success Rate</h2>
          <div className="flex items-center gap-8">
            <div className="flex-1">
              <div className="text-3xl font-bold text-green-500">{plaidSuccess.success}</div>
              <div className="text-sm text-muted-foreground">Successful</div>
            </div>
            <div className="flex-1">
              <div className="text-3xl font-bold text-destructive">{plaidSuccess.failed}</div>
              <div className="text-sm text-muted-foreground">Failed</div>
            </div>
            <div className="flex-1">
              <div className="text-3xl font-bold text-primary">
                {plaidSuccess.success + plaidSuccess.failed > 0
                  ? Math.round((plaidSuccess.success / (plaidSuccess.success + plaidSuccess.failed)) * 100)
                  : 0}%
              </div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
            </div>
          </div>
        </Card>
      </div>
    </TeamLayout>
  );
};

export default TeamAnalytics;
