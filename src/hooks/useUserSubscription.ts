import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SubscriptionTier = 'free' | 'plus' | 'premium';

export const useUserSubscription = (profileId: string | undefined) => {
  return useQuery({
    queryKey: ['user_subscription', profileId],
    queryFn: async () => {
      if (!profileId) return null;

      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('tier, expires_at')
        .eq('profile_id', profileId)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) return 'free' as SubscriptionTier;
      
      // Check if subscription is expired
      const isExpired = data.expires_at 
        ? new Date(data.expires_at) < new Date() 
        : false;
      
      return isExpired ? 'free' as SubscriptionTier : data.tier as SubscriptionTier;
    },
    enabled: !!profileId,
    staleTime: 1000 * 60 * 10, // 10 minutes - subscriptions rarely change
  });
};
