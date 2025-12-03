import TeamLayout from "@/layouts/TeamLayout";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const TeamPlans = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      // Load debt calculator settings as "plans" since user_plan_data is now historical
      const { data, error } = await supabase
        .from('debt_calculator_settings')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TeamLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Debt Plans</h1>
          <p className="text-muted-foreground">
            View all user debt plans and calculations
          </p>
        </div>

        <Card className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>Debts</TableHead>
                  <TableHead>Strategy</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => {
                  const debts = Array.isArray(plan.debts) ? plan.debts : [];
                  const settings = plan.settings || {};
                  
                  return (
                    <TableRow key={plan.user_id}>
                      <TableCell className="font-mono text-xs">
                        {plan.user_id.substring(0, 8)}...
                      </TableCell>
                      <TableCell>{debts.length} debts</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {settings.strategy || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(plan.updated_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={plan.plan ? 'default' : 'secondary'}>
                          {plan.plan ? 'Computed' : 'Pending'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </TeamLayout>
  );
};

export default TeamPlans;
