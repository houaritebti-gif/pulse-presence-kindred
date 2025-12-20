import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";
import { toast } from "sonner";
import { useLocation, useNavigate } from "react-router-dom";
import { createNotification } from "./useNotificationCenter";
import { playNotificationSound } from "@/utils/notificationSound";
import { showBrowserNotification, requestNotificationPermission } from "@/utils/browserNotifications";
import { sendPushNotification } from "@/utils/pushNotifications";

// Combined hook that handles all notifications with a single useProfile call
export const useAppNotifications = () => {
  const { data: profile } = useProfile();
  const location = useLocation();
  const navigate = useNavigate();
  
  const previousChatsRef = useRef<Set<string>>(new Set());
  const previousMessagesRef = useRef<Set<string>>(new Set());
  const previousAttendeesRef = useRef<Set<string>>(new Set());
  const previousQuedadaMessagesRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef(true);

  // Spark notifications
  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel("spark-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "spark_chats" },
        (payload) => {
          if (isInitialLoadRef.current) return;

          const newChat = payload.new as { 
            id: string; 
            profile_a_id: string; 
            profile_b_id: string;
          };
          
          const isInvolved = 
            newChat.profile_a_id === profile.id || 
            newChat.profile_b_id === profile.id;
          
          if (isInvolved && !previousChatsRef.current.has(newChat.id)) {
            previousChatsRef.current.add(newChat.id);
            
            // Determine the other profile ID for push notification
            const otherProfileId = newChat.profile_a_id === profile.id 
              ? newChat.profile_b_id 
              : newChat.profile_a_id;
            
            // Send push to the other user (they might have the app closed)
            sendPushNotification({
              profileId: otherProfileId,
              title: "✨ ¡Nueva chispa!",
              body: "Alguien conectó contigo",
              url: "/sparks",
              tag: `spark-${newChat.id}`,
            });
            
            // Save to notification center
            createNotification({
              profile_id: profile.id,
              type: "spark",
              title: "✨ ¡Nueva chispa!",
              description: "Alguien conectó contigo",
              link: "/sparks",
            });
            
            if (location.pathname !== "/sparks") {
              playNotificationSound("spark");
              toast("✨ ¡Nueva chispa!", {
                description: "Alguien conectó contigo",
                action: {
                  label: "Ver",
                  onClick: () => navigate("/sparks"),
                },
              });
              showBrowserNotification("✨ ¡Nueva chispa!", {
                body: "Alguien conectó contigo",
                tag: "spark-" + newChat.id,
                onClick: () => navigate("/sparks"),
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, location.pathname, navigate]);

  // Message notifications
  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel("message-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => {
          if (isInitialLoadRef.current) return;

          const newMessage = payload.new as { 
            id: string; 
            chat_id: string;
            sender_profile_id: string;
            content: string;
          };
          
          if (newMessage.sender_profile_id === profile.id) return;
          if (previousMessagesRef.current.has(newMessage.id)) return;
          
          previousMessagesRef.current.add(newMessage.id);
          
          const currentChatPath = `/spark/${newMessage.chat_id}`;
          if (location.pathname === currentChatPath) return;
          
          const description = newMessage.content.slice(0, 50) + (newMessage.content.length > 50 ? "..." : "");
          
          // Save to notification center
          createNotification({
            profile_id: profile.id,
            type: "message",
            title: "💬 Nuevo mensaje",
            description,
            link: currentChatPath,
          });
          
          playNotificationSound("message");
          toast("💬 Nuevo mensaje", {
            description,
            action: {
              label: "Abrir",
              onClick: () => navigate(currentChatPath),
            },
          });
          showBrowserNotification("💬 Nuevo mensaje", {
            body: description,
            tag: "message-" + newMessage.id,
            onClick: () => navigate(currentChatPath),
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, location.pathname, navigate]);

  // Quedada attendee notifications
  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel("quedada-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "quedada_attendees" },
        async (payload) => {
          if (isInitialLoadRef.current) return;

          const newAttendee = payload.new as { 
            id: string; 
            quedada_id: string;
            profile_id: string;
          };
          
          if (newAttendee.profile_id === profile.id) return;
          if (previousAttendeesRef.current.has(newAttendee.id)) return;
          
          previousAttendeesRef.current.add(newAttendee.id);
          
          const { data: quedada } = await supabase
            .from("quedadas")
            .select("id, title, creator_profile_id")
            .eq("id", newAttendee.quedada_id)
            .maybeSingle();
          
          if (!quedada || quedada.creator_profile_id !== profile.id) return;
          
          const { data: attendeeProfile } = await supabase
            .from("profiles")
            .select("name")
            .eq("id", newAttendee.profile_id)
            .maybeSingle();
          
          const attendeeName = attendeeProfile?.name || "Alguien";
          const description = `${attendeeName} se unió a "${quedada.title}"`;
          
          // Save to notification center
          createNotification({
            profile_id: profile.id,
            type: "attendee",
            title: "📅 Nueva persona en tu quedada",
            description,
            link: "/quedadas",
          });
          
          if (location.pathname !== "/quedadas") {
            playNotificationSound("quedada");
            toast("📅 Nueva persona en tu quedada", {
              description,
              action: {
                label: "Ver",
                onClick: () => navigate("/quedadas"),
              },
            });
            showBrowserNotification("📅 Nueva persona en tu quedada", {
              body: description,
              tag: "attendee-" + newAttendee.id,
              onClick: () => navigate("/quedadas"),
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, location.pathname, navigate]);

  // Quedada message notifications
  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel("quedada-message-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "quedada_messages" },
        async (payload) => {
          if (isInitialLoadRef.current) return;

          const newMessage = payload.new as { 
            id: string; 
            quedada_id: string;
            sender_profile_id: string;
            content: string;
          };
          
          if (newMessage.sender_profile_id === profile.id) return;
          if (previousQuedadaMessagesRef.current.has(newMessage.id)) return;
          
          previousQuedadaMessagesRef.current.add(newMessage.id);
          
          // Check if user is creator or attendee of this quedada
          const { data: quedada } = await supabase
            .from("quedadas")
            .select("id, title, creator_profile_id")
            .eq("id", newMessage.quedada_id)
            .maybeSingle();
          
          if (!quedada) return;
          
          const isCreator = quedada.creator_profile_id === profile.id;
          
          const { data: attendance } = await supabase
            .from("quedada_attendees")
            .select("id")
            .eq("quedada_id", newMessage.quedada_id)
            .eq("profile_id", profile.id)
            .maybeSingle();
          
          const isAttendee = !!attendance;
          
          if (!isCreator && !isAttendee) return;
          
          const currentChatPath = `/quedada/${newMessage.quedada_id}`;
          if (location.pathname === currentChatPath) return;
          
          const { data: senderProfile } = await supabase
            .from("profiles")
            .select("name")
            .eq("id", newMessage.sender_profile_id)
            .maybeSingle();
          
          const senderName = senderProfile?.name || "Alguien";
          const description = `${senderName}: ${newMessage.content.slice(0, 40)}${newMessage.content.length > 40 ? "..." : ""}`;
          
          // Save to notification center
          createNotification({
            profile_id: profile.id,
            type: "quedada_message",
            title: `💬 ${quedada.title}`,
            description,
            link: currentChatPath,
          });
          
          playNotificationSound("quedada");
          toast(`💬 ${quedada.title}`, {
            description,
            action: {
              label: "Abrir",
              onClick: () => navigate(currentChatPath),
            },
          });
          showBrowserNotification(`💬 ${quedada.title}`, {
            body: description,
            tag: "quedada-msg-" + newMessage.id,
            onClick: () => navigate(currentChatPath),
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, location.pathname, navigate]);

  // Mark initial load as complete
  useEffect(() => {
    const timeout = setTimeout(() => {
      isInitialLoadRef.current = false;
    }, 2000);

    return () => clearTimeout(timeout);
  }, []);
};
