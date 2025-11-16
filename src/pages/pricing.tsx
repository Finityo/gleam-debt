import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Check, Loader2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SEOHead } from "@/components/SEOHead";

interface PricingTier {
  name: string;
  price: number;
  interval: string;
  priceId: string;
  description: string;
  features: string[];
  popular?: boolean;
  badge?: string;
}

const PRICING_TIERS: Record<string, PricingTier> = {
  essential: {
    name: "Essentials",
    price: 2.99,
    interval: "month",
    priceId: "price_1SQrPIIUysiSR1zwsdPXSRkD",
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
    priceId: "price_1SQrPnIUysiSR1zwS8XZ5qqc",
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
  ultimate_plus: {
    name: "Ultimate Plus",
    price: 49.99,
    interval: "year",
    priceId: "price_1SN4VWIUysiSR1zwxbFHBX0K",
    description: "Best value - save 58% annually",
    features: [
      "All Ultimate features",
      "Unlimited debt tracking",
      "All payoff strategies",
      "Plaid bank integration",
      "Priority support",
      "Export capabilities",
      "Exclusive email blog content",
    ],
    badge: "Best Value",
  },
};

const Pricing = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const [discountCode, setDiscountCode] = useState('');
  const [applyingDiscount, setApplyingDiscount] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubscribe = async (priceId: string, tierName: string) => {
    try {
      setLoading(priceId);

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please sign in to subscribe",
          variant: "destructive",
        });
        navigate('/auth');
        return;
      }

      // Validate discount code if provided
      let validatedCode = null;
      if (discountCode.trim()) {
        setApplyingDiscount(true);
        const validCodes = ['DEBTFREE', 'DEBTFREE60', 'LEO10', 'MIL10'];
        if (validCodes.includes(discountCode.toUpperCase())) {
          validatedCode = discountCode.toUpperCase();
          toast({
            title: 'Discount Applied!',
            description: `Code "${validatedCode}" will be applied at checkout`,
          });
        } else {
          toast({
            title: 'Invalid Code',
            description: 'The discount code you entered is not valid',
            variant: 'destructive',
          });
          setApplyingDiscount(false);
          setLoading(null);
          return;
        }
        setApplyingDiscount(false);
      }

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { 
          priceId,
          discountCode: validatedCode 
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
        toast({
          title: 'Redirecting to checkout',
          description: 'Opening Stripe checkout in a new tab...',
        });
      }
    } catch (error) {
      console.error("Subscription error:", error);
      toast({
        title: "Subscription failed",
        description: error instanceof Error ? error.message : "Failed to create checkout session",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
      setApplyingDiscount(false);
    }
  };

  return (
    <>
      <SEOHead
        title="Pricing - Finityo"
        description="Choose the perfect plan for your debt freedom journey. Essentials ($2.99/mo) or Ultimate ($4.99/mo). Start your debt-free journey today!"
      />
      <div className="min-h-screen bg-gradient-to-b from-background to-background/80 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Choose Your Path to Financial Freedom
            </h1>
            <p className="text-xl text-muted-foreground">
              Select the plan that fits your needs - from basic tracking to complete debt freedom
            </p>
          </div>

          <div className="max-w-md mx-auto mb-8">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-center">Have a discount code?</CardTitle>
                <CardDescription className="text-center">
                  Enter it here to apply at checkout
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter discount code"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    className="flex-1"
                  />
                </div>
                {discountCode && (
                  <p className="text-sm text-muted-foreground mt-2 text-center">
                    Valid codes: DEBTFREE, DEBTFREE60, LEO10, MIL10
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {Object.entries(PRICING_TIERS).map(([key, tier]) => (
              <Card 
                key={key} 
                className={`relative flex flex-col ${
                  tier.popular ? 'border-primary shadow-lg scale-105' : ''
                }`}
              >
                {tier.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                      {tier.badge}
                    </span>
                  </div>
                )}
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
                      ${tier.interval === "year" ? tier.price : tier.price}
                    </span>
                    <span className="text-muted-foreground">
                      /{tier.interval}
                    </span>
                    {tier.interval === "year" && (
                      <p className="text-sm text-accent mt-1">Save 58% vs monthly</p>
                    )}
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
                      tier.price === 0 ? "Start Free Trial" : "Subscribe Now"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center text-sm text-muted-foreground">
            <p>All plans include a secure checkout powered by Stripe</p>
            <p className="mt-2">Cancel anytime from your account settings</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Pricing;
