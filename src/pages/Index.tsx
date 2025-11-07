import { Hero } from "@/components/Hero";
import AppLayout from "@/layouts/AppLayout";
import { SEOHead } from "@/components/SEOHead";

export default function Index() {
  return (
    <AppLayout>
      <SEOHead 
        title="Home - Finityo Debt Payoff Calculator" 
        description="Take control of your debt with Finityo's intelligent payoff calculator. Visualize your path to financial freedom."
      />
      <Hero />
    </AppLayout>
  );
}
