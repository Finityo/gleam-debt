import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface ConversionStats {
  date: string;
  total_sessions: number;
  successful_sessions: number;
  abandoned_sessions: number;
  error_sessions: number;
  conversion_rate_pct: number;
}

export const PlaidAnalytics = () => {
  const [stats, setStats] = useState<ConversionStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversionStats();
  }, []);

  const fetchConversionStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user is admin to view analytics
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (roles?.role !== 'admin') {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('plaid_link_conversion_stats')
        .select('*')
        .limit(30); // Last 30 days

      if (error) throw error;
      setStats(data || []);
    } catch (error) {
      console.error('Error fetching conversion stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;
  if (stats.length === 0) return null;

  // Calculate overall stats
  const totalSessions = stats.reduce((sum, s) => sum + s.total_sessions, 0);
  const totalSuccessful = stats.reduce((sum, s) => sum + s.successful_sessions, 0);
  const totalAbandoned = stats.reduce((sum, s) => sum + s.abandoned_sessions, 0);
  const totalErrors = stats.reduce((sum, s) => sum + s.error_sessions, 0);
  const overallConversion = totalSessions > 0 
    ? Math.round((totalSuccessful / totalSessions) * 100) 
    : 0;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Link Conversion Analytics
        </CardTitle>
        <CardDescription>
          Last 30 days - Track how users progress through bank connection flow
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-start gap-3 p-4 rounded-lg border">
            <Users className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <p className="text-2xl font-bold">{totalSessions}</p>
              <p className="text-sm text-muted-foreground">Total Sessions</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-lg border">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <p className="text-2xl font-bold text-green-600">{totalSuccessful}</p>
              <p className="text-sm text-muted-foreground">Successful</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-lg border">
            <XCircle className="h-5 w-5 text-gray-500 mt-0.5" />
            <div>
              <p className="text-2xl font-bold text-gray-600">{totalAbandoned}</p>
              <p className="text-sm text-muted-foreground">Abandoned</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-lg border">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
            <div>
              <p className="text-2xl font-bold text-amber-600">{totalErrors}</p>
              <p className="text-sm text-muted-foreground">With Errors</p>
            </div>
          </div>
        </div>

        <div className="mt-6 p-6 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Overall Conversion Rate</p>
              <p className="text-4xl font-bold text-primary">{overallConversion}%</p>
            </div>
            <TrendingUp className="h-12 w-12 text-primary/30" />
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Conversion = Successful Sessions / Total Sessions
          </p>
        </div>

        {stats.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium mb-3">Recent Daily Performance</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {stats.slice(0, 10).map((stat) => (
                <div 
                  key={stat.date}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                >
                  <span className="text-sm text-muted-foreground">
                    {new Date(stat.date).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm">
                      {stat.successful_sessions}/{stat.total_sessions} sessions
                    </span>
                    <span className={`text-sm font-medium px-2 py-1 rounded ${
                      stat.conversion_rate_pct >= 80 ? 'bg-green-100 text-green-700' :
                      stat.conversion_rate_pct >= 60 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {stat.conversion_rate_pct}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};