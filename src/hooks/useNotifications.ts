import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";
import { toast } from "sonner";
import { useLocation, useNavigate } from "react-router-dom";

export const useSparkNotifications = () => {
  const { data: profile } = useProfile();
  const location = useLocation();
  const navigate = useNavigate();
  const previousChatsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel("spark-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "spark_chats" },
        (payload) => {
          // Skip initial load
          if (isInitialLoadRef.current) return;

          const newChat = payload.new as { 
            id: string; 
            profile_a_id: string; 
            profile_b_id: string;
          };
          
          // Check if this chat involves the current user
          const isInvolved = 
            newChat.profile_a_id === profile.id || 
            newChat.profile_b_id === profile.id;
          
          if (isInvolved && !previousChatsRef.current.has(newChat.id)) {
            previousChatsRef.current.add(newChat.id);
            
            // Don't show notification if already on sparks page
            if (location.pathname !== "/sparks") {
              toast("✨ ¡Nueva chispa!", {
                description: "Alguien conectó contigo",
                action: {
                  label: "Ver",
                  onClick: () => navigate("/sparks"),
                },
              });
            }
          }
        }
      )
      .subscribe();

    // Mark initial load as complete after a short delay
    const timeout = setTimeout(() => {
      isInitialLoadRef.current = false;
    }, 2000);

    return () => {
      clearTimeout(timeout);
      supabase.removeChannel(channel);
    };
  }, [profile?.id, location.pathname, navigate]);
};

export const useMessageNotifications = () => {
  const { data: profile } = useProfile();
  const location = useLocation();
  const navigate = useNavigate();
  const previousMessagesRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel("message-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => {
          // Skip initial load
          if (isInitialLoadRef.current) return;

          const newMessage = payload.new as { 
            id: string; 
            chat_id: string;
            sender_profile_id: string;
            content: string;
          };
          
          // Don't notify for own messages
          if (newMessage.sender_profile_id === profile.id) return;
          
          // Don't notify if we've already seen this message
          if (previousMessagesRef.current.has(newMessage.id)) return;
          
          previousMessagesRef.current.add(newMessage.id);
          
          // Don't show if already in that specific chat
          const currentChatPath = `/spark/${newMessage.chat_id}`;
          if (location.pathname === currentChatPath) return;
          
          toast("💬 Nuevo mensaje", {
            description: newMessage.content.slice(0, 50) + (newMessage.content.length > 50 ? "..." : ""),
            action: {
              label: "Abrir",
              onClick: () => navigate(currentChatPath),
            },
          });
        }
      )
      .subscribe();

    // Mark initial load as complete after a short delay
    const timeout = setTimeout(() => {
      isInitialLoadRef.current = false;
    }, 2000);

    return () => {
      clearTimeout(timeout);
      supabase.removeChannel(channel);
    };
  }, [profile?.id, location.pathname, navigate]);
};

export const useQuedadaNotifications = () => {
  const { data: profile } = useProfile();
  const location = useLocation();
  const navigate = useNavigate();
  const previousAttendeesRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel("quedada-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "quedada_attendees" },
        async (payload) => {
          // Skip initial load
          if (isInitialLoadRef.current) return;

          const newAttendee = payload.new as { 
            id: string; 
            quedada_id: string;
            profile_id: string;
          };
          
          // Don't notify for own joins
          if (newAttendee.profile_id === profile.id) return;
          
          // Don't notify if we've already seen this
          if (previousAttendeesRef.current.has(newAttendee.id)) return;
          
          previousAttendeesRef.current.add(newAttendee.id);
          
          // Check if this quedada belongs to the current user
          const { data: quedada } = await supabase
            .from("quedadas")
            .select("id, title, creator_profile_id")
            .eq("id", newAttendee.quedada_id)
            .maybeSingle();
          
          if (!quedada || quedada.creator_profile_id !== profile.id) return;
          
          // Get the attendee's name
          const { data: attendeeProfile } = await supabase
            .from("profiles")
            .select("name")
            .eq("id", newAttendee.profile_id)
            .maybeSingle();
          
          const attendeeName = attendeeProfile?.name || "Alguien";
          
          // Don't show if already on quedadas page
          if (location.pathname !== "/quedadas") {
            toast("📅 Nueva persona en tu quedada", {
              description: `${attendeeName} se unió a "${quedada.title}"`,
              action: {
                label: "Ver",
                onClick: () => navigate("/quedadas"),
              },
            });
          }
        }
      )
      .subscribe();

    // Mark initial load as complete after a short delay
    const timeout = setTimeout(() => {
      isInitialLoadRef.current = false;
    }, 2000);

    return () => {
      clearTimeout(timeout);
      supabase.removeChannel(channel);
    };
  }, [profile?.id, location.pathname, navigate]);
};

// Combined hook for easy use in App component
export const useAppNotifications = () => {
  useSparkNotifications();
  useMessageNotifications();
  useQuedadaNotifications();
};
