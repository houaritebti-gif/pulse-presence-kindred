import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";

/**
 * Hook to record a profile visit when viewing another user's profile.
 * Only records one visit per visitor-visited pair per day.
 */
export function useRecordProfileVisit(visitedProfileId: string | undefined) {
  const { data: myProfile } = useProfile();
  const hasRecordedRef = useRef<string | null>(null);

  useEffect(() => {
    const recordVisit = async () => {
      // Don't record if no profile ID, or viewing own profile, or already recorded this session
      if (!visitedProfileId || !myProfile?.id) return;
      if (myProfile.id === visitedProfileId) return;
      if (hasRecordedRef.current === visitedProfileId) return;

      // Mark as recorded to prevent duplicate attempts
      hasRecordedRef.current = visitedProfileId;

      try {
        // Use upsert with onConflict to handle the unique constraint gracefully
        const { error } = await supabase
          .from("profile_visits")
          .insert({
            visitor_profile_id: myProfile.id,
            visited_profile_id: visitedProfileId,
          });

        // Ignore unique constraint violations (already visited today)
        if (error && !error.message.includes("unique_visit_per_day")) {
          console.error("Error recording profile visit:", error);
        }
      } catch (err) {
        console.error("Error recording profile visit:", err);
      }
    };

    recordVisit();
  }, [visitedProfileId, myProfile?.id]);
}
