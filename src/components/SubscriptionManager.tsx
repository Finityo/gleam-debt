import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const PRODUCTS = {
  "prod_THCAK8cbwXL0uU": { name: "30-Day Free Trial", tier: "trial" },
  "prod_THCLpDCgCrrLRl": { name: "Essential", tier: "essential" },
  "prod_THCVRchRdi2nyi": { name: "Ultimate", tier: "ultimate" },
  "prod_THCVNWQSE8tqHZ": { name: "Ultimate Annual", tier: "ultimate-annual" },
};

export const SubscriptionManager = () => {
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [subscription, setSubscription] = useState<{
    subscribed: boolean;
    product_id?: string;
    subscription_end?: string;
  } | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const checkSubscription = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke("check-subscription");

      if (error) throw error;

      setSubscription(data);
    } catch (error) {
      console.error("Error checking subscription:", error);
      toast({
        title: "Failed to load subscription",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openCustomerPortal = async () => {
    try {
      setPortalLoading(true);
      const { data, error } = await supabase.functions.invoke("customer-portal");

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Error opening customer portal:", error);
      toast({
        title: "Failed to open portal",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setPortalLoading(false);
    }
  };

  useEffect(() => {
    checkSubscription();
    // Refresh every 60 seconds
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const productInfo = subscription?.product_id 
    ? PRODUCTS[subscription.product_id as keyof typeof PRODUCTS]
    : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Subscription Status
              {subscription?.subscribed && <Crown className="h-5 w-5 text-accent" />}
            </CardTitle>
            <CardDescription>Manage your Finityo subscription</CardDescription>
          </div>
          {subscription?.subscribed ? (
            <Badge variant="default" className="bg-accent">Active</Badge>
          ) : (
            <Badge variant="secondary">Free</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {subscription?.subscribed && productInfo ? (
          <>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current Plan:</span>
                <span className="font-medium">{productInfo.name}</span>
              </div>
              {subscription.subscription_end && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Renews:</span>
                  <span className="font-medium">
                    {new Date(subscription.subscription_end).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
            <Button
              onClick={openCustomerPortal}
              disabled={portalLoading}
              className="w-full"
              variant="outline"
            >
              {portalLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  Manage Subscription
                  <ExternalLink className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              You are currently on the free plan. Upgrade to unlock premium features!
            </p>
            <Button
              onClick={() => navigate("/pricing")}
              className="w-full"
            >
              View Pricing Plans
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};
