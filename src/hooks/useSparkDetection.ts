import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";
import { useQueryClient } from "@tanstack/react-query";
import { vibrateDevice, playNotificationSound } from "@/utils/notificationSound";

interface SparkDetectionResult {
  sparkDetected: boolean;
  sparkChatId: string | null;
  otherProfileName: string | null;
  checkForNewSpark: (targetProfileId: string) => Promise<boolean>;
}

export const useSparkDetection = (): SparkDetectionResult => {
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const [sparkDetected, setSparkDetected] = useState(false);
  const [sparkChatId, setSparkChatId] = useState<string | null>(null);
  const [otherProfileName, setOtherProfileName] = useState<string | null>(null);

  // Function to check if a spark was just created with a specific profile
  const checkForNewSpark = useCallback(async (targetProfileId: string): Promise<boolean> => {
    if (!profile?.id) return false;

    try {
      // Order profile IDs consistently (same as database trigger)
      const orderedA = profile.id < targetProfileId ? profile.id : targetProfileId;
      const orderedB = profile.id < targetProfileId ? targetProfileId : profile.id;

      const { data: sparkChat, error } = await supabase
        .from("spark_chats")
        .select(`
          id,
          profile_a:profiles!spark_chats_profile_a_id_fkey(id, name),
          profile_b:profiles!spark_chats_profile_b_id_fkey(id, name)
        `)
        .eq("profile_a_id", orderedA)
        .eq("profile_b_id", orderedB)
        .maybeSingle();

      if (error) {
        console.error("Error checking for spark:", error);
        return false;
      }

      if (sparkChat) {
        setSparkDetected(true);
        setSparkChatId(sparkChat.id);
        
        // Haptic and sound feedback for spark match!
        vibrateDevice("spark");
        playNotificationSound("spark");
        
        // Get other profile's name
        const otherProfile = sparkChat.profile_a?.id === profile.id 
          ? sparkChat.profile_b 
          : sparkChat.profile_a;
        setOtherProfileName(otherProfile?.name || null);
        
        // Invalidate spark chats query to update UI
        queryClient.invalidateQueries({ queryKey: ["spark_chats", profile.id] });
        
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error in spark detection:", error);
      return false;
    }
  }, [profile?.id, queryClient]);

  // Subscribe to realtime spark_chats changes
  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel("spark-detection")
      .on(
        "postgres_changes",
        { 
          event: "INSERT", 
          schema: "public", 
          table: "spark_chats" 
        },
        async (payload) => {
          const newChat = payload.new as { 
            id: string; 
            profile_a_id: string; 
            profile_b_id: string 
          };
          
          // Check if this spark involves the current user
          if (newChat.profile_a_id === profile.id || newChat.profile_b_id === profile.id) {
            const otherProfileId = newChat.profile_a_id === profile.id 
              ? newChat.profile_b_id 
              : newChat.profile_a_id;
            
            // Fetch other profile name
            const { data: otherProfile } = await supabase
              .from("profiles")
              .select("name")
              .eq("id", otherProfileId)
              .single();
            
            setSparkDetected(true);
            setSparkChatId(newChat.id);
            setOtherProfileName(otherProfile?.name || null);
            
            // Invalidate queries
            queryClient.invalidateQueries({ queryKey: ["spark_chats", profile.id] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, queryClient]);

  return {
    sparkDetected,
    sparkChatId,
    otherProfileName,
    checkForNewSpark,
  };
};
