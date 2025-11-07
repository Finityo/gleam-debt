import { Btn } from "./Btn";
import { useNavigate } from "react-router-dom";

export function Hero() {
  const navigate = useNavigate();

  return (
    <section className="text-center space-y-6 py-20 animate-fade-in">
      <h1 className="text-4xl font-bold leading-tight">
        Debt Simplified.
      </h1>
      <p className="text-muted-foreground text-lg max-w-lg mx-auto">
        Build your payoff plan. See your debt-free date. Share with your coach.
      </p>

      <Btn onClick={() => navigate("/setup/start")}>Try Setup</Btn>
    </section>
  );
}
