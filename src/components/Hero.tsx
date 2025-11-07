import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";

export function Hero() {
  const navigate = useNavigate();

  return (
    <section className="text-center space-y-8 py-20 animate-fade-in">
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium animate-slide-up">
        <Sparkles className="h-4 w-4" />
        Debt freedom simplified
      </div>

      <h1 className="text-5xl md:text-6xl font-bold leading-tight tracking-tight animate-slide-up">
        Debt Simplified.
        <br />
        <span className="bg-gradient-primary bg-clip-text text-transparent">
          Freedom Visualized.
        </span>
      </h1>

      <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto animate-slide-up">
        Build your personalized payoff plan, see your debt-free date, and share progress with anyone. 
        All powered by our intelligent debt snowball calculator.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up">
        <Button
          size="lg"
          onClick={() => navigate("/demo/start")}
          className="group"
        >
          Try the Demo
          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Button>
        
        <Button
          variant="outline"
          size="lg"
          onClick={() => navigate("/dashboard")}
        >
          Go to Dashboard
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto pt-12 animate-fade-in">
        <div>
          <div className="text-3xl font-bold text-primary">$1M+</div>
          <div className="text-sm text-muted-foreground mt-1">Debt tracked</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-primary">10K+</div>
          <div className="text-sm text-muted-foreground mt-1">Plans created</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-primary">95%</div>
          <div className="text-sm text-muted-foreground mt-1">Success rate</div>
        </div>
      </div>
    </section>
  );
}
