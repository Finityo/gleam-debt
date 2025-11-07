import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export function useUpgrade() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function upgrade(plan: "essentials" | "ultimate") {
    try {
      setLoading(true);

      const priceId =
        plan === "ultimate"
          ? import.meta.env.VITE_STRIPE_PRICE_ULTIMATE
          : import.meta.env.VITE_STRIPE_PRICE_ESSENTIALS;

      if (!priceId) {
        toast.error("Stripe not configured yet");
        return;
      }

      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Please sign in to subscribe");
        navigate("/auth/signin");
        return;
      }

      // Create checkout session
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
      });

      if (error) throw error;

      if (data?.url) {
        // Open checkout in new tab
        window.open(data.url, "_blank");
        toast.success(`Opening checkout for ${plan === "ultimate" ? "Ultimate" : "Essentials"}...`);
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to start checkout");
    } finally {
      setLoading(false);
    }
  }

  return { upgrade, loading };
}
