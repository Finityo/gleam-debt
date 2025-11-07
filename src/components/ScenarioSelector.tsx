import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Scenario } from "@/types/scenario";

type Props = {
  scenario: Scenario;
  setScenario: (s: Scenario) => void;
};

export default function ScenarioSelector({ scenario, setScenario }: Props) {
  return (
    <Tabs value={scenario} onValueChange={(v) => setScenario(v as Scenario)} className="w-full max-w-md">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="snowball" className="flex items-center gap-1">
          🏂 Snowball
        </TabsTrigger>
        <TabsTrigger value="avalanche" className="flex items-center gap-1">
          🏔️ Avalanche
        </TabsTrigger>
        <TabsTrigger value="minimum" className="flex items-center gap-1">
          💤 Minimum
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
