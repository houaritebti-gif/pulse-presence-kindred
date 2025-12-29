import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface TypingUser {
  profileId: string;
  name: string;
  avatarUrl: string | null;
}

export const useGroupTypingIndicator = (chatId: string | undefined, chatType: 'quedada' | 'group' = 'quedada') => {
  const { data: profile } = useProfile();
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Subscribe to typing presence
  useEffect(() => {
    if (!chatId || !profile?.id) return;

    const channelName = `${chatType}-typing:${chatId}`;
    
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
          // Get all users who are typing (excluding current user)
          const typing: TypingUser[] = [];
          Object.entries(state).forEach(([key, presences]) => {
            if (key !== profile.id) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const typingPresence = (presences as any[]).find((p) => p.isTyping === true);
              if (typingPresence) {
                typing.push({
                  profileId: key,
                  name: typingPresence.name || "Alguien",
                  avatarUrl: typingPresence.avatarUrl || null,
                });
              }
            }
          });
          setTypingUsers(typing);
        }
      })
      .on("presence", { event: "leave" }, ({ key }) => {
        setTypingUsers(prev => prev.filter(u => u.profileId !== key));
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
  }, [chatId, profile?.id, chatType]);

  // Function to broadcast typing state
  const setTyping = useCallback(async (isTyping: boolean) => {
    if (!channelRef.current || !profile?.id || profile.share_typing_status === false) return;

    try {
      await channelRef.current.track({
        isTyping,
        profileId: profile.id,
        name: profile.name || "Anónima",
        avatarUrl: profile.avatar_url,
      });
    } catch (error) {
      console.error("Error tracking typing state:", error);
    }
  }, [profile?.id, profile?.share_typing_status, profile?.name, profile?.avatar_url]);

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

  // Format typing users for display
  const getTypingText = useCallback(() => {
    if (typingUsers.length === 0) return null;
    if (typingUsers.length === 1) return `${typingUsers[0].name} está escribiendo...`;
    if (typingUsers.length === 2) return `${typingUsers[0].name} y ${typingUsers[1].name} están escribiendo...`;
    return `${typingUsers[0].name} y ${typingUsers.length - 1} más están escribiendo...`;
  }, [typingUsers]);

  return {
    typingUsers,
    isAnyoneTyping: typingUsers.length > 0,
    typingText: getTypingText(),
    handleTyping,
    stopTyping,
  };
};
