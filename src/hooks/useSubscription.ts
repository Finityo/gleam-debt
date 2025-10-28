import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SubscriptionStatus {
  subscribed: boolean;
  tier: 'essential' | 'ultimate' | 'ultimate_plus' | 'trial' | null;
  product_id: string | null;
  price_id: string | null;
  subscription_end: string | null;
  loading: boolean;
}

export const TIER_FEATURES = {
  essential: {
    maxDebts: 5,
    plaidIntegration: false,
    exportCapabilities: false,
    emailBlogs: false,
    prioritySupport: false,
  },
  ultimate: {
    maxDebts: Infinity,
    plaidIntegration: true,
    exportCapabilities: true,
    emailBlogs: false,
    prioritySupport: true,
  },
  ultimate_plus: {
    maxDebts: Infinity,
    plaidIntegration: true,
    exportCapabilities: true,
    emailBlogs: true,
    prioritySupport: true,
  },
  trial: {
    maxDebts: Infinity,
    plaidIntegration: true,
    exportCapabilities: true,
    emailBlogs: true,
    prioritySupport: true,
  },
};

export const useSubscription = () => {
  const [status, setStatus] = useState<SubscriptionStatus>({
    subscribed: false,
    tier: null,
    product_id: null,
    price_id: null,
    subscription_end: null,
    loading: true,
  });

  const checkSubscription = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setStatus({
          subscribed: false,
          tier: null,
          product_id: null,
          price_id: null,
          subscription_end: null,
          loading: false,
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) throw error;
      
      setStatus({
        subscribed: data.subscribed || false,
        tier: data.tier || null,
        product_id: data.product_id || null,
        price_id: data.price_id || null,
        subscription_end: data.subscription_end || null,
        loading: false,
      });
    } catch (error) {
      console.error('Error checking subscription:', error);
      setStatus(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    checkSubscription();
    
    // Refresh subscription status every 60 seconds
    const interval = setInterval(checkSubscription, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const hasFeature = (feature: keyof typeof TIER_FEATURES.essential): boolean => {
    if (!status.tier) return false;
    const featureValue = TIER_FEATURES[status.tier]?.[feature];
    return typeof featureValue === 'boolean' ? featureValue : false;
  };

  const canAddDebt = (currentDebtCount: number): boolean => {
    if (!status.tier) return false;
    const maxDebts = TIER_FEATURES[status.tier]?.maxDebts || 0;
    return currentDebtCount < maxDebts;
  };

  return {
    ...status,
    checkSubscription,
    hasFeature,
    canAddDebt,
  };
};
