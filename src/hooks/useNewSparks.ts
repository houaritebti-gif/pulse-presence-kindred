import { useCallback } from "react";
import { useSparkChats } from "./useSparks";
import { useLocalStorage, STORAGE_KEYS } from "./useLocalStorage";

// Hook to track which sparks are new (not yet seen by the user)
export const useNewSparks = () => {
  const { data: chats, isLoading } = useSparkChats();
  const [seenSparkIds, setSeenSparkIds] = useLocalStorage<string[]>(
    STORAGE_KEYS.SEEN_SPARKS,
    []
  );

  const seenSet = new Set(seenSparkIds);

  // Mark all current sparks as seen
  const markAllAsSeen = useCallback(() => {
    if (!chats) return;
    
    const allIds = chats.map(chat => chat.id);
    const newSeenIds = [...new Set([...seenSparkIds, ...allIds])];
    setSeenSparkIds(newSeenIds);
  }, [chats, seenSparkIds, setSeenSparkIds]);

  // Mark a specific spark as seen
  const markAsSeen = useCallback((sparkId: string) => {
    if (!seenSet.has(sparkId)) {
      setSeenSparkIds([...seenSparkIds, sparkId]);
    }
  }, [seenSparkIds, seenSet, setSeenSparkIds]);

  // Calculate new sparks (those not in seenSet)
  const newSparks = chats?.filter(chat => !seenSet.has(chat.id)) || [];
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
