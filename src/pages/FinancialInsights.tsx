import { PageShell } from '@/components/PageShell';
import { FinancialHealthCard } from '@/components/FinancialHealthCard';
import { MilestonesCard } from '@/components/MilestonesCard';
import { SpendingInsightsCard } from '@/components/SpendingInsightsCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, Trophy, TrendingUp } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';

export default function FinancialInsights() {
  return (
    <>
      <SEOHead
        title="Financial Insights | Finityo"
        description="Track your financial health score, celebrate milestones, and get personalized spending insights"
      />
      <PageShell>
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-variant bg-clip-text text-transparent">
              Financial Insights
            </h1>
            <p className="text-muted-foreground text-lg">
              Track your progress, celebrate wins, and optimize your debt payoff journey
            </p>
          </div>

          <Tabs defaultValue="health" className="w-full">
            <TabsList className="grid w-full grid-cols-3 max-w-md">
              <TabsTrigger value="health" className="gap-2">
                <Activity className="w-4 h-4" />
                Health Score
              </TabsTrigger>
              <TabsTrigger value="milestones" className="gap-2">
                <Trophy className="w-4 h-4" />
                Milestones
              </TabsTrigger>
              <TabsTrigger value="spending" className="gap-2">
                <TrendingUp className="w-4 h-4" />
                Spending
              </TabsTrigger>
            </TabsList>

            <TabsContent value="health" className="mt-6 space-y-6">
              <FinancialHealthCard />
            </TabsContent>

            <TabsContent value="milestones" className="mt-6 space-y-6">
              <MilestonesCard />
            </TabsContent>

            <TabsContent value="spending" className="mt-6 space-y-6">
              <SpendingInsightsCard />
            </TabsContent>
          </Tabs>

          <div className="mt-8 p-6 rounded-xl bg-gradient-to-r from-primary/10 to-primary-variant/10 border border-primary/20">
            <h3 className="text-lg font-semibold mb-2">How It Works</h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm text-muted-foreground">
              <div>
                <p className="font-medium text-foreground mb-1">📊 Health Score</p>
                <p>Your score (300-850) is calculated based on total debt, credit card utilization, and payment progress. Higher scores indicate better financial health.</p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">🏆 Milestones</p>
                <p>Celebrate your achievements as you pay off debts and reach percentage milestones. Track your progress towards becoming debt-free!</p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">💡 Spending Insights</p>
                <p>Get personalized suggestions based on your payment patterns, interest costs, and debt load to optimize your payoff strategy.</p>
              </div>
            </div>
          </div>
        </div>
      </PageShell>
    </>
  );
}
