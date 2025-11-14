import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useRecommendations } from '@/hooks/useRecommendations';
import { MessageSquare, Lightbulb, Calculator, TrendingUp } from 'lucide-react';

export const EnhancedCoachPanel: React.FC = () => {
  const { data: recommendations, loading } = useRecommendations();
  const [activeTab, setActiveTab] = useState('insights');

  const getRecommendationExplanation = (type: string) => {
    switch (type) {
      case 'accelerate':
        return {
          why: "Adding extra monthly payments compounds over time, reducing both your payoff period and total interest paid. Even small increases make a significant difference.",
          how: "Navigate to your Debt Plan settings and increase the 'Extra Monthly Payment' field. Start small if needed - even $25/month helps!",
          impact: "Each extra dollar goes directly to principal, creating a snowball effect that accelerates your entire debt payoff timeline."
        };
      case 'utilization':
        return {
          why: "Credit utilization (balance vs. limit) is a major factor in your Financial Health Score. Keeping it below 30%, ideally below 20%, significantly boosts your score.",
          how: "Make an extra payment on the specific card mentioned, or split your spending across multiple cards to lower individual utilization rates.",
          impact: "Lower utilization can increase your score by 20-50 points, improving loan approval odds and potentially lowering future interest rates."
        };
      case 'strategy':
        return {
          why: "Different debt payoff strategies work better for different situations. Avalanche saves the most money, while Snowball provides psychological wins.",
          how: "Go to Debt Plan → Settings → Strategy and compare the projections. You can switch strategies anytime without losing progress.",
          impact: "The right strategy keeps you motivated and optimizes your payoff timeline based on your specific debt mix and financial goals."
        };
      case 'consolidation':
        return {
          why: "Multiple high-interest debts can be overwhelming and costly. Consolidation simplifies payments and may lower your average interest rate.",
          how: "Research debt consolidation loans or balance transfer cards. Compare rates, fees, and terms. Some credit unions offer competitive consolidation loans.",
          impact: "A good consolidation can save thousands in interest and reduce payment complexity from many accounts to just one."
        };
      case 'emergency':
        return {
          why: "Without an emergency fund, unexpected expenses often lead to new debt, derailing your progress. A small buffer prevents setbacks.",
          how: "Temporarily reduce extra debt payments to $50-100/month and direct the rest to a separate savings account until you reach $1,000.",
          impact: "This safety net prevents you from needing to use credit cards for emergencies, protecting your debt-free momentum."
        };
      default:
        return {
          why: "This recommendation is based on your current debt profile and payment patterns.",
          how: "Follow the suggested action in the recommendation card.",
          impact: "Implementing this suggestion will help optimize your debt payoff strategy."
        };
    }
  };

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Financial Coach</h3>
        <Badge variant="secondary" className="ml-auto">
          {recommendations?.recommendations.length ?? 0} insights
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="insights" className="text-xs">
            <Lightbulb className="mr-1 h-3 w-3" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="guide" className="text-xs">
            <TrendingUp className="mr-1 h-3 w-3" />
            How-To Guide
          </TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="mt-4 space-y-3">
          {loading ? (
            <div className="space-y-2">
              <div className="h-16 w-full animate-pulse rounded bg-muted" />
              <div className="h-16 w-full animate-pulse rounded bg-muted" />
            </div>
          ) : recommendations && recommendations.recommendations.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground">
                Your personalized action items based on your current debt situation:
              </p>
              {recommendations.recommendations.slice(0, 3).map((rec, idx) => (
                <div key={idx} className="rounded-lg border border-border bg-card p-3 text-sm">
                  <div className="font-medium text-foreground">{rec.text}</div>
                  {Object.keys(rec.impact).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {rec.impact.months_saved && (
                        <Badge variant="outline" className="text-[10px]">
                          -{rec.impact.months_saved} months
                        </Badge>
                      )}
                      {rec.impact.interest_saved && (
                        <Badge variant="outline" className="text-[10px]">
                          -${rec.impact.interest_saved} interest
                        </Badge>
                      )}
                      {rec.impact.score_increase && (
                        <Badge variant="outline" className="text-[10px]">
                          +{rec.impact.score_increase} score
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </>
          ) : (
            <div className="rounded-lg border border-border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
              You're doing great! No urgent actions needed right now.
            </div>
          )}
        </TabsContent>

        <TabsContent value="guide" className="mt-4 space-y-4">
          {recommendations && recommendations.recommendations.length > 0 ? (
            recommendations.recommendations.slice(0, 2).map((rec, idx) => {
              const guide = getRecommendationExplanation(rec.type);
              return (
                <div key={idx} className="space-y-3 rounded-lg border border-border p-4">
                  <h4 className="font-semibold text-foreground">
                    {rec.type === 'accelerate' && '💰 Accelerating Payoff'}
                    {rec.type === 'utilization' && '📊 Managing Credit Utilization'}
                    {rec.type === 'strategy' && '🎯 Choosing the Right Strategy'}
                    {rec.type === 'consolidation' && '🔄 Debt Consolidation'}
                    {rec.type === 'emergency' && '⚠️ Emergency Fund Priority'}
                  </h4>

                  <div className="space-y-2 text-sm">
                    <div>
                      <div className="font-medium text-muted-foreground">Why this matters:</div>
                      <p className="mt-1 text-foreground">{guide.why}</p>
                    </div>

                    <div>
                      <div className="font-medium text-muted-foreground">How to do it:</div>
                      <p className="mt-1 text-foreground">{guide.how}</p>
                    </div>

                    <div>
                      <div className="font-medium text-muted-foreground">Expected impact:</div>
                      <p className="mt-1 text-foreground">{guide.impact}</p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-lg border border-border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
              <p>Keep up the great work! When you have active recommendations, detailed guides will appear here.</p>
            </div>
          )}

          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
            <p className="text-xs text-foreground">
              <span className="font-semibold">💡 Pro tip:</span> The most successful debt payoff plans 
              combine consistent monthly payments with occasional extra payments when possible. 
              Even $10-20 extra makes a difference over time!
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default EnhancedCoachPanel;
