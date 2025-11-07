import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Clock, Edit, Plus, Trash2, TrendingUp, DollarSign, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ActivityItem {
  id: string;
  created_at: string;
  change_description: string | null;
  debts_count: number;
  strategy: string;
  extra_monthly: number;
  one_time: number;
}

export function ActivityLog({ userId, limit = 10 }: { userId: string; limit?: number }) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    
    loadActivities();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('activity-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_plan_versions',
          filter: `user_id=eq.${userId}`
        },
        () => {
          loadActivities();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const loadActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('user_plan_versions')
        .select('id, created_at, change_description, debts, settings')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const formattedActivities = (data || []).map((item: any) => ({
        id: item.id,
        created_at: item.created_at,
        change_description: item.change_description,
        debts_count: Array.isArray(item.debts) ? item.debts.length : 0,
        strategy: item.settings?.strategy || 'snowball',
        extra_monthly: item.settings?.extraMonthly || 0,
        one_time: item.settings?.oneTimeExtra || 0,
      }));

      setActivities(formattedActivities);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (description: string | null) => {
    if (!description) return <Edit className="w-4 h-4" />;
    
    const lower = description.toLowerCase();
    if (lower.includes('added') || lower.includes('created')) return <Plus className="w-4 h-4 text-green-500" />;
    if (lower.includes('deleted') || lower.includes('removed')) return <Trash2 className="w-4 h-4 text-red-500" />;
    if (lower.includes('payment') || lower.includes('extra')) return <DollarSign className="w-4 h-4 text-blue-500" />;
    if (lower.includes('strategy')) return <TrendingUp className="w-4 h-4 text-purple-500" />;
    if (lower.includes('plan')) return <Calendar className="w-4 h-4 text-orange-500" />;
    
    return <Edit className="w-4 h-4 text-muted-foreground" />;
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-indigo-950/40 via-violet-950/30 to-purple-900/40 backdrop-blur-sm border border-indigo-500/30 rounded-xl p-6 shadow-lg hover:shadow-indigo-500/20 hover:border-indigo-400/50 transition-all duration-300">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-indigo-300" />
          <h3 className="text-xl font-semibold bg-gradient-to-r from-indigo-300 to-violet-300 bg-clip-text text-transparent">Recent Activity</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-indigo-950/40 via-violet-950/30 to-purple-900/40 backdrop-blur-sm border border-indigo-500/30 rounded-xl p-6 shadow-lg hover:shadow-indigo-500/20 hover:border-indigo-400/50 transition-all duration-300 hover:bg-gradient-to-br hover:from-indigo-900/50 hover:via-violet-900/40 hover:to-purple-800/50">
      <div className="mb-4">
        <h3 className="text-xl font-semibold bg-gradient-to-r from-indigo-300 to-violet-300 bg-clip-text text-transparent flex items-center gap-2 mb-2">
          <Clock className="w-5 h-5 text-indigo-300" />
          Recent Activity
        </h3>
        <p className="text-sm text-violet-300/70">
          Track all changes to your debt payoff plan
        </p>
      </div>
      {activities.length === 0 ? (
        <div className="text-center py-8 text-indigo-300/70">
          <p className="text-sm">No activity yet. Start by adding debts to your plan.</p>
        </div>
      ) : (
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex gap-3 p-3 rounded-lg border border-indigo-500/30 bg-indigo-900/20 hover:bg-indigo-800/30 hover:border-indigo-400/40 transition-all duration-200"
              >
                <div className="flex-shrink-0 mt-1">
                  {getActivityIcon(activity.change_description)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-indigo-100">
                        {activity.change_description || 'Plan updated'}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs bg-indigo-500/10 border-indigo-500/30 text-indigo-300">
                          {activity.debts_count} debts
                        </Badge>
                        <Badge variant="outline" className="text-xs capitalize bg-violet-500/10 border-violet-500/30 text-violet-300">
                          {activity.strategy}
                        </Badge>
                        {activity.extra_monthly > 0 && (
                          <Badge variant="outline" className="text-xs bg-purple-500/10 border-purple-500/30 text-purple-300">
                            +${activity.extra_monthly}/mo
                          </Badge>
                        )}
                        {activity.one_time > 0 && (
                          <Badge variant="outline" className="text-xs bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-300">
                            ${activity.one_time} one-time
                          </Badge>
                        )}
                      </div>
                    </div>
                    <time className="text-xs text-violet-300/60 whitespace-nowrap">
                      {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                    </time>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
