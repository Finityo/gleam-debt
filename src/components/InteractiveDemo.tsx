import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw } from "lucide-react";

const demoSteps = [
  {
    title: "Enter Your Debts",
    description: "Add your credit cards, loans, and other debts",
    content: (
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border">
          <div>
            <div className="font-medium">Chase Credit Card</div>
            <div className="text-sm text-muted-foreground">$5,200 @ 18.9% APR</div>
          </div>
          <div className="text-sm font-semibold">Min: $156</div>
        </div>
        <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border">
          <div>
            <div className="font-medium">Student Loan</div>
            <div className="text-sm text-muted-foreground">$12,400 @ 6.5% APR</div>
          </div>
          <div className="text-sm font-semibold">Min: $143</div>
        </div>
        <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border">
          <div>
            <div className="font-medium">Car Loan</div>
            <div className="text-sm text-muted-foreground">$8,900 @ 4.2% APR</div>
          </div>
          <div className="text-sm font-semibold">Min: $312</div>
        </div>
      </div>
    ),
  },
  {
    title: "Choose Your Strategy",
    description: "Select Snowball, Avalanche, or let AI optimize",
    content: (
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 bg-primary/10 border-2 border-primary rounded-lg">
          <div className="text-lg font-bold mb-2">❄️ Snowball</div>
          <div className="text-sm text-muted-foreground">Pay smallest debts first for quick wins</div>
        </div>
        <div className="p-4 bg-background/50 border border-border rounded-lg">
          <div className="text-lg font-bold mb-2">🏔️ Avalanche</div>
          <div className="text-sm text-muted-foreground">Target highest interest rates</div>
        </div>
        <div className="col-span-2 p-4 bg-background/50 border border-border rounded-lg">
          <div className="text-lg font-bold mb-2">🤖 AI Custom</div>
          <div className="text-sm text-muted-foreground">Intelligent hybrid approach</div>
        </div>
      </div>
    ),
  },
  {
    title: "Add Extra Payments",
    description: "See how extra payments accelerate your freedom",
    content: (
      <div className="space-y-4">
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Extra Monthly Payment</span>
            <span className="text-lg font-bold text-primary">$200</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full w-2/5 bg-primary rounded-full"></div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
          <div>
            <div className="text-sm text-muted-foreground">Saves You</div>
            <div className="text-2xl font-bold text-green-600">$2,847</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Time Saved</div>
            <div className="text-2xl font-bold text-green-600">8 months</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Your Payoff Timeline",
    description: "See exactly when you'll be debt-free",
    content: (
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/20">
          <div>
            <div className="text-sm text-muted-foreground">Freedom Date</div>
            <div className="text-xl font-bold text-green-600">September 2027</div>
          </div>
          <div className="text-4xl">🎉</div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <div className="text-sm">Chase Card paid off: Jun 2025</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
            <div className="text-sm">Car Loan paid off: Mar 2026</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <div className="text-sm">Student Loan paid off: Sep 2027</div>
          </div>
        </div>
        <div className="h-32 relative">
          <svg viewBox="0 0 300 100" className="w-full h-full">
            <motion.path
              d="M 0 80 Q 100 60, 150 40 T 300 0"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="3"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, ease: "easeInOut" }}
            />
          </svg>
        </div>
      </div>
    ),
  },
];

export function InteractiveDemo() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= demoSteps.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 3000);

    return () => clearInterval(timer);
  }, [isPlaying]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setCurrentStep(0);
    setIsPlaying(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="p-6 bg-background/60 backdrop-blur-xl border-border/50">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold">See It In Action</h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePlayPause}
              className="h-10 w-10"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleReset}
              className="h-10 w-10"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex gap-2 mb-4">
            {demoSteps.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentStep(index);
                  setIsPlaying(false);
                }}
                className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden"
              >
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{
                    width: index < currentStep ? "100%" : index === currentStep ? "100%" : "0%",
                  }}
                  transition={{ duration: 0.3 }}
                />
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4 }}
            className="min-h-[320px]"
          >
            <div className="mb-4">
              <h4 className="text-xl font-bold mb-2">{demoSteps[currentStep].title}</h4>
              <p className="text-muted-foreground">{demoSteps[currentStep].description}</p>
            </div>
            <div className="mt-6">{demoSteps[currentStep].content}</div>
          </motion.div>
        </AnimatePresence>

        <div className="mt-6 pt-6 border-t border-border">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Step {currentStep + 1} of {demoSteps.length}
            </span>
            <span>Auto-playing every 3 seconds</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
