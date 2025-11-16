import TeamLayout from "@/layouts/TeamLayout";
import { Card } from "@/components/ui/card";
import { Users, FileText, Activity, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const TeamDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPlans: 0,
    activeUsers: 0,
    visits: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Get total users
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get total plans
      const { count: planCount } = await supabase
        .from('user_plan_data')
        .select('*', { count: 'exact', head: true });

      // Get visits from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { count: visitCount } = await supabase
        .from('analytics_visits')
        .select('*', { count: 'exact', head: true })
        .gte('timestamp', thirtyDaysAgo.toISOString());

      setStats({
        totalUsers: userCount || 0,
        totalPlans: planCount || 0,
        activeUsers: userCount || 0, // Simplified for now
        visits: visitCount || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "text-primary",
    },
    {
      title: "Debt Plans",
      value: stats.totalPlans,
      icon: FileText,
      color: "text-accent",
    },
    {
      title: "Active Users",
      value: stats.activeUsers,
      icon: Activity,
      color: "text-green-500",
    },
    {
      title: "Visits (30d)",
      value: stats.visits,
      icon: TrendingUp,
      color: "text-blue-500",
    },
  ];

  return (
    <TeamLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to the Finityo team portal
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </h3>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <p className="text-3xl font-bold">{stat.value.toLocaleString()}</p>
              </Card>
            );
          })}
        </div>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 border border-border rounded-lg hover:bg-muted transition-colors text-left">
              <h3 className="font-medium mb-1">View All Users</h3>
              <p className="text-sm text-muted-foreground">
                Manage user accounts and permissions
              </p>
            </button>
            <button className="p-4 border border-border rounded-lg hover:bg-muted transition-colors text-left">
              <h3 className="font-medium mb-1">Analytics</h3>
              <p className="text-sm text-muted-foreground">
                View detailed analytics and insights
              </p>
            </button>
            <button className="p-4 border border-border rounded-lg hover:bg-muted transition-colors text-left">
              <h3 className="font-medium mb-1">System Logs</h3>
              <p className="text-sm text-muted-foreground">
                Review error logs and system events
              </p>
            </button>
          </div>
        </Card>
      </div>
    </TeamLayout>
  );
};

export default TeamDashboard;
