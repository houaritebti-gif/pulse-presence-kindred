import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";

// Image limits per conversation by tier
const IMAGE_LIMITS = {
  free: 5,
  plus: 15,
  premium: 30,
} as const;

// Helper to check if a message content is an image
const isImageContent = (content: string): boolean => {
  return content.includes("chat-images") && (
    content.includes(".jpg") || 
    content.includes(".jpeg") || 
    content.includes(".png") || 
    content.includes(".gif") || 
    content.includes(".webp")
  );
};

export const useChatImageLimit = (chatId: string | undefined, profileId: string | undefined) => {
  const { tier } = useSubscription();
  
  // Count images sent by the current user in this chat
  const { data: imageCount = 0, isLoading, refetch } = useQuery({
    queryKey: ['chat-image-count', chatId, profileId],
    queryFn: async () => {
      if (!chatId || !profileId) return 0;
      
      // Fetch all messages from this user in this chat
      const { data, error } = await supabase
        .from('chat_messages')
        .select('content')
        .eq('chat_id', chatId)
        .eq('sender_profile_id', profileId);
      
      if (error) {
        console.error('[ChatImageLimit] Error fetching messages:', error);
        return 0;
      }
      
      // Count how many are images
      const count = data?.filter(msg => isImageContent(msg.content)).length || 0;
      return count;
    },
    enabled: !!chatId && !!profileId,
    staleTime: 1000 * 60, // 1 minute
  });

  const limit = IMAGE_LIMITS[tier] || IMAGE_LIMITS.free;
  const remaining = Math.max(0, limit - imageCount);
  const canSendImage = imageCount < limit;
  const isNearLimit = remaining <= 2 && remaining > 0;

  return {
    imageCount,
    limit,
    remaining,
    canSendImage,
    isNearLimit,
    isLoading,
    refetch,
    tier,
  };
};
