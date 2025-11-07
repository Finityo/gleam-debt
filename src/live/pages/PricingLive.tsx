import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Loader2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PricingTier {
  name: string;
  price: number;
  interval: string;
  priceId: string;
  description: string;
  features: string[];
  popular?: boolean;
}

const PRICING_TIERS: Record<string, PricingTier> = {
  essential: {
    name: "Essentials",
    price: 2.99,
    interval: "month",
    priceId: import.meta.env.VITE_STRIPE_PRICE_ESSENTIALS || "price_1SQrPIIUysiSR1zwsdPXSRkD",
    description: "Perfect for getting started",
    features: [
      "Save your payoff plan",
      "Share link",
      "Export your plan",
      "Basic debt tracking",
      "Progress tracking",
    ],
  },
  ultimate: {
    name: "Ultimate",
    price: 4.99,
    interval: "month",
    priceId: import.meta.env.VITE_STRIPE_PRICE_ULTIMATE || "price_1SQrPnIUysiSR1zwS8XZ5qqc",
    description: "Complete debt freedom toolkit",
    features: [
      "Plaid bank sync",
      "Coach Mode",
      "Notes + History",
      "Everything in Essentials",
      "Unlimited debt tracking",
      "All payoff strategies",
    ],
    popular: true,
  },
};

export default function PricingLive() {
  const [loading, setLoading] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubscribe = async (priceId: string, tierName: string) => {
    try {
      setLoading(priceId);

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Please sign in to subscribe");
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
        toast.success(`Opening checkout for ${tierName}...`);
      }
    } catch (error) {
      console.error("Subscription error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to start checkout");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-finityo-textMain">
            Choose Your Path to Financial Freedom
          </h1>
          <p className="text-xl text-finityo-textBody">
            Select the plan that fits your needs
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {Object.entries(PRICING_TIERS).map(([key, tier]) => (
            <Card 
              key={key} 
              className={`relative flex flex-col ${
                tier.popular ? 'border-primary shadow-lg scale-105' : ''
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-accent text-accent-foreground px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-2xl">{tier.name}</CardTitle>
                <CardDescription>{tier.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">
                    ${tier.price}
                  </span>
                  <span className="text-muted-foreground">
                    /{tier.interval}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <ul className="space-y-3">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={tier.popular ? "default" : "outline"}
                  onClick={() => handleSubscribe(tier.priceId, tier.name)}
                  disabled={loading === tier.priceId}
                >
                  {loading === tier.priceId ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Subscribe Now"
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>All plans include secure checkout powered by Stripe</p>
          <p className="mt-2">Cancel anytime from your account settings</p>
        </div>
      </div>
    </div>
  );
}
