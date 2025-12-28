import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";

export type SubscriptionTier = 'free' | 'basic' | 'premium';

interface Subscription {
  id: string;
  profile_id: string;
  tier: SubscriptionTier;
  started_at: string;
  expires_at: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
}

export const useSubscription = () => {
  const { data: profile } = useProfile();

  const { data: subscription, isLoading, error, refetch } = useQuery({
    queryKey: ['subscription', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;

      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('profile_id', profile.id)
        .maybeSingle();

      if (error) throw error;
      return data as Subscription | null;
    },
    enabled: !!profile?.id,
  });

  const tier: SubscriptionTier = subscription?.tier || 'free';
  
  // Check if subscription is expired
  const isExpired = subscription?.expires_at 
    ? new Date(subscription.expires_at) < new Date() 
    : false;
  
  const effectiveTier: SubscriptionTier = isExpired ? 'free' : tier;

  // Feature access helpers
  const canAccessChatbot = effectiveTier === 'basic' || effectiveTier === 'premium';
  const canCreateQuedadas = effectiveTier === 'premium';
  const canDeleteQuedadas = effectiveTier === 'premium';

  return {
    subscription,
    tier: effectiveTier,
    isLoading,
    error,
    refetch,
    // Feature flags
    canAccessChatbot,
    canCreateQuedadas,
    canDeleteQuedadas,
    // Tier checks
    isFree: effectiveTier === 'free',
    isBasic: effectiveTier === 'basic',
    isPremium: effectiveTier === 'premium',
  };
};
