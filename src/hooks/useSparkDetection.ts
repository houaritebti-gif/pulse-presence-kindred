import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";
import { useQueryClient } from "@tanstack/react-query";
import { vibrateDevice, playNotificationSound } from "@/utils/notificationSound";
import { fireSparkConfetti } from "@/utils/sparkConfetti";

const CELEBRATED_SPARKS_KEY = "kiki_celebrated_spark_ids";

// Get already celebrated spark IDs from localStorage
const getCelebratedSparkIds = (): Set<string> => {
  try {
    const raw = localStorage.getItem(CELEBRATED_SPARKS_KEY);
    return new Set<string>(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set<string>();
  }
};

// Save celebrated spark ID to localStorage
const markSparkAsCelebrated = (sparkId: string) => {
  const celebrated = getCelebratedSparkIds();
  celebrated.add(sparkId);
  // Keep only last 200 to prevent bloat
  const arr = [...celebrated].slice(-200);
  localStorage.setItem(CELEBRATED_SPARKS_KEY, JSON.stringify(arr));
};

// Check if a spark has already been celebrated
const hasBeenCelebrated = (sparkId: string): boolean => {
  return getCelebratedSparkIds().has(sparkId);
};

interface SparkDetectionResult {
  sparkDetected: boolean;
  sparkChatId: string | null;
  otherProfileName: string | null;
  checkForNewSpark: (targetProfileId: string) => Promise<boolean>;
  clearSparkDetection: () => void;
}

export const useSparkDetection = (): SparkDetectionResult => {
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const [sparkDetected, setSparkDetected] = useState(false);
  const [sparkChatId, setSparkChatId] = useState<string | null>(null);
  const [otherProfileName, setOtherProfileName] = useState<string | null>(null);
  const celebrationCooldownRef = useRef<Set<string>>(new Set());

  // Clear the spark detection state
  const clearSparkDetection = useCallback(() => {
    setSparkDetected(false);
    setSparkChatId(null);
    setOtherProfileName(null);
  }, []);

  // Function to celebrate a spark (only once per session + persisted)
  const celebrateSpark = useCallback((chatId: string, otherName: string | null) => {
    // Skip if already celebrated in this session
    if (celebrationCooldownRef.current.has(chatId)) {
      return;
    }

    // Skip if already celebrated in a previous session
    if (hasBeenCelebrated(chatId)) {
      // Still update state but don't show celebration
      setSparkDetected(true);
      setSparkChatId(chatId);
      setOtherProfileName(otherName);
      return;
    }

    // Mark as celebrated
    celebrationCooldownRef.current.add(chatId);
    markSparkAsCelebrated(chatId);

    // Update state
    setSparkDetected(true);
    setSparkChatId(chatId);
    setOtherProfileName(otherName);
    
    // Haptic, sound, and visual feedback for spark match!
    vibrateDevice("spark");
    playNotificationSound("spark");
    fireSparkConfetti();
  }, []);

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
        // Get other profile's name
        const otherProfile = sparkChat.profile_a?.id === profile.id 
          ? sparkChat.profile_b 
          : sparkChat.profile_a;
        
        // Celebrate only if not already celebrated
        celebrateSpark(sparkChat.id, otherProfile?.name || null);
        
        // Invalidate spark chats query to update UI
        queryClient.invalidateQueries({ queryKey: ["spark_chats", profile.id] });
        
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error in spark detection:", error);
      return false;
    }
  }, [profile?.id, queryClient, celebrateSpark]);

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
            
            // Celebrate only if not already celebrated
            celebrateSpark(newChat.id, otherProfile?.name || null);
            
            // Invalidate queries
            queryClient.invalidateQueries({ queryKey: ["spark_chats", profile.id] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, queryClient, celebrateSpark]);

  return {
    sparkDetected,
    sparkChatId,
    otherProfileName,
    checkForNewSpark,
    clearSparkDetection,
  };
};
