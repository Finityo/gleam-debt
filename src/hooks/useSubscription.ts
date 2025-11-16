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
    name: 'Essentials',
    maxDebts: 5,
    plaidIntegration: false,
    exportCapabilities: false,
    emailBlogs: false,
    prioritySupport: false,
  },
  ultimate: {
    name: 'Ultimate',
    maxDebts: Infinity,
    plaidIntegration: true,
    exportCapabilities: true,
    emailBlogs: false,
    prioritySupport: true,
  },
  ultimate_plus: {
    name: 'Ultimate Plus',
    maxDebts: Infinity,
    plaidIntegration: true,
    exportCapabilities: true,
    emailBlogs: true,
    prioritySupport: true,
  },
  trial: {
    name: 'Trial',
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
      
      // Handle authentication errors gracefully
      if (error) {
        // If it's an auth error, treat as not subscribed
        if (error.message?.includes('Auth') || error.message?.includes('session')) {
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
        throw error;
      }
      
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
    // Check subscription on mount
    checkSubscription();
    
    // Set up auth state listener to check subscription when auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          checkSubscription();
        } else {
          // Clear subscription status when logged out
          setStatus({
            subscribed: false,
            tier: null,
            product_id: null,
            price_id: null,
            subscription_end: null,
            loading: false,
          });
        }
      }
    );
    
    // Refresh subscription status every 60 seconds only if user is authenticated
    const interval = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        checkSubscription();
      }
    }, 60000);
    
    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
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

  const getTierDisplayName = (): string | null => {
    if (!status.tier) return null;
    return TIER_FEATURES[status.tier]?.name || status.tier;
  };

  const formatSubscriptionEnd = (): string | null => {
    if (!status.subscription_end) return null;
    
    try {
      return new Date(status.subscription_end).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return null;
    }
  };

  const openCustomerPortal = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
    }
  };

  return {
    ...status,
    checkSubscription,
    hasFeature,
    canAddDebt,
    getTierDisplayName,
    formatSubscriptionEnd,
    openCustomerPortal,
  };
};
