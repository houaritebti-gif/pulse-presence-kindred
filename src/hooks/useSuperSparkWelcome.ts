import { useEffect, useRef } from "react";
import { useReceivedGhostMessages } from "./useReceivedGhostMessages";
import { fireSuperSparkReceived } from "@/utils/superSparkConfetti";
import { triggerHaptic } from "@/utils/haptics";

const SUPER_SPARK_SEEN_KEY = "kiki_super_spark_seen_ids";

/**
 * Hook that detects new (unseen) Super Chispas when the app loads
 * and triggers the reception confetti animation automatically.
 */
export const useSuperSparkWelcome = () => {
  const { data: messages, isLoading } = useReceivedGhostMessages();
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    // Only run once when messages are loaded
    if (isLoading || !messages || hasTriggeredRef.current) return;

    // Get Super Chispas that haven't been read yet
    const unreadSuperSparks = messages.filter(
      (msg) => msg.is_super_spark && !msg.read_at
    );

    if (unreadSuperSparks.length === 0) return;

    // Get previously seen Super Spark IDs from localStorage
    const seenIdsRaw = localStorage.getItem(SUPER_SPARK_SEEN_KEY);
    const seenIds = new Set<string>(seenIdsRaw ? JSON.parse(seenIdsRaw) : []);

    // Find truly new Super Chispas (unread AND not seen before)
    const newSuperSparks = unreadSuperSparks.filter(
      (msg) => !seenIds.has(msg.id)
    );

    if (newSuperSparks.length > 0) {
      // Mark as triggered so we don't do this again in this session
      hasTriggeredRef.current = true;

      // Small delay to ensure the UI has rendered
      setTimeout(() => {
        // Fire the reception confetti!
        fireSuperSparkReceived();
        triggerHaptic("success");

        // Update seen IDs in localStorage
        const allSeenIds = [
          ...seenIds,
          ...newSuperSparks.map((msg) => msg.id),
        ];
        localStorage.setItem(SUPER_SPARK_SEEN_KEY, JSON.stringify(allSeenIds));
      }, 500);
    }

    // Cleanup: remove old IDs (keep only last 100 to prevent localStorage bloat)
    const allMessageIds = new Set(messages.map((m) => m.id));
    const cleanedSeenIds = [...seenIds].filter((id) => allMessageIds.has(id));
    if (cleanedSeenIds.length !== seenIds.size) {
      localStorage.setItem(
        SUPER_SPARK_SEEN_KEY,
        JSON.stringify(cleanedSeenIds.slice(-100))
      );
    }
  }, [messages, isLoading]);
};
