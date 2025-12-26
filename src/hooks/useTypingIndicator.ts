import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";
import type { RealtimeChannel } from "@supabase/supabase-js";

export const useTypingIndicator = (chatId: string | undefined, otherProfileId: string | undefined) => {
  const { data: profile } = useProfile();
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Subscribe to typing presence
  useEffect(() => {
    if (!chatId || !profile?.id || !otherProfileId) return;

    const channelName = `typing:${chatId}`;
    
    channelRef.current = supabase.channel(channelName, {
      config: {
        presence: {
          key: profile.id,
        },
      },
    });

    channelRef.current
      .on("presence", { event: "sync" }, () => {
        const state = channelRef.current?.presenceState();
        if (state) {
          // Check if the other user is typing
          const otherUserState = state[otherProfileId];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const isTyping = otherUserState?.some((s: any) => s.isTyping === true) || false;
          setIsOtherTyping(isTyping);
        }
      })
      .on("presence", { event: "join" }, ({ key, newPresences }) => {
        if (key === otherProfileId) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const isTyping = newPresences.some((p: any) => p.isTyping === true);
          setIsOtherTyping(isTyping);
        }
      })
      .on("presence", { event: "leave" }, ({ key }) => {
        if (key === otherProfileId) {
          setIsOtherTyping(false);
        }
      })
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [chatId, profile?.id, otherProfileId]);

  // Function to broadcast typing state
  const setTyping = useCallback(async (isTyping: boolean) => {
    if (!channelRef.current || !profile?.id || profile.share_typing_status === false) return;

    try {
      await channelRef.current.track({
        isTyping,
        profileId: profile.id,
      });
    } catch (error) {
      console.error("Error tracking typing state:", error);
    }
  }, [profile?.id, profile?.share_typing_status]);

  // Debounced typing handler - call this on input change
  const handleTyping = useCallback(() => {
    if (profile?.share_typing_status === false) return;

    // Set typing to true
    setTyping(true);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to clear typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false);
    }, 2000);
  }, [setTyping, profile?.share_typing_status]);

  // Stop typing indicator (call on message send)
  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setTyping(false);
  }, [setTyping]);

  return {
    isOtherTyping,
    handleTyping,
    stopTyping,
  };
};
