import { useEffect, useState, useCallback } from "react";
import { useSparkChats } from "./useSparks";

const SEEN_SPARKS_KEY = "kiki_seen_sparks";

// Hook to track which sparks are new (not yet seen by the user)
export const useNewSparks = () => {
  const { data: chats, isLoading } = useSparkChats();
  const [seenSparkIds, setSeenSparkIds] = useState<Set<string>>(new Set());

  // Load seen sparks from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SEEN_SPARKS_KEY);
      if (stored) {
        setSeenSparkIds(new Set(JSON.parse(stored)));
      }
    } catch (error) {
      console.error("Error loading seen sparks:", error);
    }
  }, []);

  // Mark all current sparks as seen
  const markAllAsSeen = useCallback(() => {
    if (!chats) return;
    
    const allIds = chats.map(chat => chat.id);
    const newSeenSet = new Set([...seenSparkIds, ...allIds]);
    
    setSeenSparkIds(newSeenSet);
    
    try {
      localStorage.setItem(SEEN_SPARKS_KEY, JSON.stringify([...newSeenSet]));
    } catch (error) {
      console.error("Error saving seen sparks:", error);
    }
  }, [chats, seenSparkIds]);

  // Mark a specific spark as seen
  const markAsSeen = useCallback((sparkId: string) => {
    const newSeenSet = new Set([...seenSparkIds, sparkId]);
    
    setSeenSparkIds(newSeenSet);
    
    try {
      localStorage.setItem(SEEN_SPARKS_KEY, JSON.stringify([...newSeenSet]));
    } catch (error) {
      console.error("Error saving seen spark:", error);
    }
  }, [seenSparkIds]);

  // Calculate new sparks (those not in seenSparkIds)
  const newSparks = chats?.filter(chat => !seenSparkIds.has(chat.id)) || [];
  const newSparkCount = newSparks.length;
  const hasNewSparks = newSparkCount > 0;

  return {
    newSparks,
    newSparkCount,
    hasNewSparks,
    markAllAsSeen,
    markAsSeen,
    isLoading,
    totalSparkCount: chats?.length || 0,
  };
};
