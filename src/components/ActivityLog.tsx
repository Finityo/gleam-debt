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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Recent Activity
        </CardTitle>
        <CardDescription>
          Track all changes to your debt payoff plan
        </CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No activity yet. Start by adding debts to your plan.</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(activity.change_description)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {activity.change_description || 'Plan updated'}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {activity.debts_count} debts
                          </Badge>
                          <Badge variant="outline" className="text-xs capitalize">
                            {activity.strategy}
                          </Badge>
                          {activity.extra_monthly > 0 && (
                            <Badge variant="outline" className="text-xs">
                              +${activity.extra_monthly}/mo
                            </Badge>
                          )}
                          {activity.one_time > 0 && (
                            <Badge variant="outline" className="text-xs">
                              ${activity.one_time} one-time
                            </Badge>
                          )}
                        </div>
                      </div>
                      <time className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                      </time>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
