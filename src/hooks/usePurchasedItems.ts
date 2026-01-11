import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { ShopItemKey } from "@/hooks/useSparkEnergy";

export interface PurchasedItem {
  id: string;
  profile_id: string;
  item_key: string;
  quantity: number;
  used_quantity: number;
  expires_at: string | null;
  created_at: string;
  metadata: Record<string, unknown>;
}

// Item durations for time-limited items (in hours)
const ITEM_DURATIONS: Partial<Record<ShopItemKey, number>> = {
  visibility_boost: 1, // 1 hour
  extra_filter: 24, // 24 hours
  profile_theme: 24 * 7, // 7 days
};

// Item quantities
const ITEM_QUANTITIES: Partial<Record<ShopItemKey, number>> = {
  ghost_message_1: 1,
  ghost_message_3: 3,
  super_spark: 1,
  super_spark_3: 3,
};

export function usePurchasedItems() {
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const profileId = profile?.id;

  // Fetch all purchased items
  const { data: purchasedItems, isLoading } = useQuery({
    queryKey: ["purchased-items", profileId],
    queryFn: async (): Promise<PurchasedItem[]> => {
      if (!profileId) return [];

      const { data, error } = await supabase
        .from("spark_purchased_items")
        .select("*")
        .eq("profile_id", profileId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as PurchasedItem[];
    },
    enabled: !!profileId,
    staleTime: 30000,
  });

  // Get available quantity for a specific item
  const getAvailableQuantity = (itemKey: ShopItemKey): number => {
    if (!purchasedItems) return 0;
    
    const now = new Date();
    return purchasedItems
      .filter(item => 
        item.item_key === itemKey &&
        item.used_quantity < item.quantity &&
        (!item.expires_at || new Date(item.expires_at) > now)
      )
      .reduce((sum, item) => sum + (item.quantity - item.used_quantity), 0);
  };

  // Check if item is active (for time-limited items like visibility_boost)
  const isItemActive = (itemKey: ShopItemKey): boolean => {
    if (!purchasedItems) return false;
    
    const now = new Date();
    return purchasedItems.some(item => 
      item.item_key === itemKey &&
      item.expires_at &&
      new Date(item.expires_at) > now
    );
  };

  // Get active item expiry time
  const getActiveItemExpiry = (itemKey: ShopItemKey): Date | null => {
    if (!purchasedItems) return null;
    
    const now = new Date();
    const activeItem = purchasedItems.find(item => 
      item.item_key === itemKey &&
      item.expires_at &&
      new Date(item.expires_at) > now
    );
    
    return activeItem ? new Date(activeItem.expires_at!) : null;
  };

  // Record a purchase
  const recordPurchaseMutation = useMutation({
    mutationFn: async (itemKey: ShopItemKey) => {
      if (!profileId) throw new Error("No profile");

      const quantity = ITEM_QUANTITIES[itemKey] || 1;
      const durationHours = ITEM_DURATIONS[itemKey];
      
      const expiresAt = durationHours 
        ? new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString()
        : null;

      const { data, error } = await supabase
        .from("spark_purchased_items")
        .insert({
          profile_id: profileId,
          item_key: itemKey,
          quantity,
          expires_at: expiresAt,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchased-items", profileId] });
    },
  });

  // Use an item (decrement available quantity)
  const useItemMutation = useMutation({
    mutationFn: async (itemKey: ShopItemKey) => {
      if (!profileId) throw new Error("No profile");

      // Find the oldest non-expired item with available uses
      const now = new Date();
      const availableItem = purchasedItems
        ?.filter(item => 
          item.item_key === itemKey &&
          item.used_quantity < item.quantity &&
          (!item.expires_at || new Date(item.expires_at) > now)
        )
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0];

      if (!availableItem) {
        throw new Error("No hay items disponibles");
      }

      const { error } = await supabase
        .from("spark_purchased_items")
        .update({ used_quantity: availableItem.used_quantity + 1 })
        .eq("id", availableItem.id);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchased-items", profileId] });
    },
  });

  return {
    purchasedItems,
    isLoading,
    getAvailableQuantity,
    isItemActive,
    getActiveItemExpiry,
    recordPurchase: recordPurchaseMutation.mutateAsync,
    useItem: useItemMutation.mutateAsync,
    isRecording: recordPurchaseMutation.isPending,
    isUsing: useItemMutation.isPending,
  };
}

// Hook specifically for ghost message extras
export function useExtraGhostMessages() {
  const { getAvailableQuantity, useItem } = usePurchasedItems();
  
  const extraMessages = getAvailableQuantity("ghost_message_1") + getAvailableQuantity("ghost_message_3");
  
  return {
    extraMessages,
    useExtraMessage: () => {
      // Try to use from single messages first, then packs
      if (getAvailableQuantity("ghost_message_1") > 0) {
        return useItem("ghost_message_1");
      } else if (getAvailableQuantity("ghost_message_3") > 0) {
        return useItem("ghost_message_3");
      }
      throw new Error("No hay mensajes extra disponibles");
    },
  };
}

// Hook for visibility boost status
export function useVisibilityBoost() {
  const { isItemActive, getActiveItemExpiry } = usePurchasedItems();
  
  return {
    isBoostActive: isItemActive("visibility_boost"),
    boostExpiresAt: getActiveItemExpiry("visibility_boost"),
  };
}

// Hook for second chance availability
export function useSecondChance() {
  const { getAvailableQuantity, useItem } = usePurchasedItems();
  
  return {
    availableSecondChances: getAvailableQuantity("second_chance"),
    useSecondChance: () => useItem("second_chance"),
  };
}

// Hook for Super Spark availability
export function useSuperSpark() {
  const { getAvailableQuantity, useItem, recordPurchase, isRecording } = usePurchasedItems();
  
  const availableSuperSparks = getAvailableQuantity("super_spark") + getAvailableQuantity("super_spark_3");
  
  const useSuperSparkItem = async () => {
    // Try to use from single sparks first, then packs
    if (getAvailableQuantity("super_spark") > 0) {
      return useItem("super_spark");
    } else if (getAvailableQuantity("super_spark_3") > 0) {
      return useItem("super_spark_3");
    }
    throw new Error("No hay super chispas disponibles");
  };
  
  return {
    availableSuperSparks,
    useSuperSpark: useSuperSparkItem,
    recordPurchase,
    isRecording,
  };
}
