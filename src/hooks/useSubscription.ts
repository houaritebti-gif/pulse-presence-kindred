import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";
import { useToast } from "@/hooks/use-toast";

export type SubscriptionTier = 'free' | 'plus' | 'premium';

// Stripe price IDs
export const STRIPE_PRICES = {
  plus: "price_1SjTnJ6W6Rrd2z1D9rNwFtwH",
  premium: "price_1SjUEr6W6Rrd2z1D95RIlVEf",
} as const;

interface Subscription {
  id: string;
  profile_id: string;
  tier: SubscriptionTier;
  started_at: string;
  expires_at: string | null;
  trial_started_at: string | null;
  trial_used: boolean | null;
}

const TRIAL_DURATION_DAYS = 7;

export const useSubscription = () => {
  const { data: profile } = useProfile();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
    staleTime: 1000 * 60 * 10, // 10 minutes - subscriptions rarely change
  });

  // Check subscription with Stripe
  const checkStripeSubscription = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data?.subscribed) {
        queryClient.invalidateQueries({ queryKey: ['subscription', profile?.id] });
      }
    },
  });

  // Start trial mutation
  const startTrialMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.id) throw new Error("No profile found");

      // Check if user already has a subscription record
      const { data: existing } = await supabase
        .from('user_subscriptions')
        .select('id, trial_used')
        .eq('profile_id', profile.id)
        .maybeSingle();

      if (existing?.trial_used) {
        throw new Error("Ya has usado tu periodo de prueba");
      }

      const trialStartedAt = new Date().toISOString();
      const expiresAt = new Date(Date.now() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000).toISOString();

      if (existing) {
        // Update existing record
        const { error } = await supabase
          .from('user_subscriptions')
          .update({
            tier: 'plus' as SubscriptionTier,
            trial_started_at: trialStartedAt,
            trial_used: true,
            expires_at: expiresAt,
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Create new subscription with trial
        const { error } = await supabase
          .from('user_subscriptions')
          .insert({
            profile_id: profile.id,
            tier: 'plus' as SubscriptionTier,
            trial_started_at: trialStartedAt,
            trial_used: true,
            expires_at: expiresAt,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription', profile?.id] });
      toast({
        title: "¡Prueba activada!",
        description: "Disfruta de 7 días gratis del plan Plus",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create checkout session
  const createCheckoutMutation = useMutation({
    mutationFn: async (tier: 'plus' | 'premium') => {
      const priceId = STRIPE_PRICES[tier];
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId, tier },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error al crear checkout",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Open customer portal
  const openPortalMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error al abrir portal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const tier: SubscriptionTier = subscription?.tier || 'free';
  
  // Check if subscription is expired
  const isExpired = subscription?.expires_at 
    ? new Date(subscription.expires_at) < new Date() 
    : false;
  
  const effectiveTier: SubscriptionTier = isExpired ? 'free' : tier;

  // Trial status calculations - we check trial status without relying on Stripe IDs (they're now in a separate secure table)
  const isOnTrial = subscription?.trial_started_at && !isExpired && effectiveTier === 'plus';
  const trialUsed = subscription?.trial_used || false;
  
  const trialDaysRemaining = subscription?.expires_at && isOnTrial
    ? Math.max(0, Math.ceil((new Date(subscription.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const canStartTrial = !trialUsed && effectiveTier === 'free';

  // Feature access helpers
  const canAccessChatbot = effectiveTier === 'plus' || effectiveTier === 'premium';
  const canCreateQuedadas = effectiveTier === 'premium';
  const canDeleteQuedadas = effectiveTier === 'premium';
  const canSendPremiumMessages = effectiveTier === 'premium';
  const canSendSecondChance = effectiveTier === 'premium';
  const canUseInvisibleMode = effectiveTier === 'premium';
  const canSeeRealtimePresence = effectiveTier === 'plus' || effectiveTier === 'premium';
  
  // Ghost message limits by tier
  const ghostMessageLimit = effectiveTier === 'premium' ? Infinity : effectiveTier === 'plus' ? 15 : 5;

  return {
    subscription,
    tier: effectiveTier,
    isLoading,
    error,
    refetch,
    // Stripe
    createCheckout: createCheckoutMutation.mutate,
    isCreatingCheckout: createCheckoutMutation.isPending,
    openPortal: openPortalMutation.mutate,
    isOpeningPortal: openPortalMutation.isPending,
    checkStripeSubscription: checkStripeSubscription.mutate,
    // Trial
    isOnTrial,
    trialDaysRemaining,
    trialUsed,
    canStartTrial,
    startTrial: startTrialMutation.mutate,
    isStartingTrial: startTrialMutation.isPending,
    // Feature flags
    canAccessChatbot,
    canCreateQuedadas,
    canDeleteQuedadas,
    canSendPremiumMessages,
    canSendSecondChance,
    canUseInvisibleMode,
    canSeeRealtimePresence,
    ghostMessageLimit,
    // Tier checks
    isFree: effectiveTier === 'free',
    isPlus: effectiveTier === 'plus',
    isPremium: effectiveTier === 'premium',
  };
};
