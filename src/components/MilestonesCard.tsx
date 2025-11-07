import { DebtPlan } from "@/lib/computeDebtPlan";
import { getMilestones } from "@/lib/milestones";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Target } from "lucide-react";

type Props = {
  plan: DebtPlan;
};

export default function MilestonesCard({ plan }: Props) {
  const milestones = getMilestones(plan);

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Target className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Milestones</h3>
      </div>

      <div className="space-y-3">
        {milestones.map((milestone, index) => (
          <div
            key={index}
            className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
          >
            <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold">{milestone.name}</span>
                <Badge variant="secondary">Month {milestone.monthIndex + 1}</Badge>
                {milestone.date && (
                  <Badge variant="outline">{milestone.date}</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {milestone.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
