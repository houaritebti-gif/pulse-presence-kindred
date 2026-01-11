import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CompatibilityData {
  profileId: string;
  city: string | null;
  tribes: string[];
  musicStyles: string[];
  interests: string[];
  lookingFor: string[] | null;
}

const calculateCompatibility = (
  userA: CompatibilityData,
  userB: CompatibilityData
): number => {
  let score = 0;
  
  // Tribes match
  const sharedTribes = userA.tribes.filter(t => userB.tribes.includes(t));
  score += Math.min(sharedTribes.length, 2); // Max 2 points for tribes
  
  // Music styles match
  const sharedMusic = userA.musicStyles.filter(m => userB.musicStyles.includes(m));
  score += Math.min(sharedMusic.length, 1); // Max 1 point for music
  
  // Looking for match
  if (userA.lookingFor && userB.lookingFor) {
    const sharedLookingFor = userA.lookingFor.filter(l => userB.lookingFor!.includes(l));
    score += Math.min(sharedLookingFor.length, 1); // Max 1 point
  }
  
  // Interests match
  const sharedInterests = userA.interests.filter(i => userB.interests.includes(i));
  score += Math.min(sharedInterests.length, 1); // Max 1 point for interests
  
  return Math.min(score, 5); // Cap at 5
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { profile_id } = await req.json();

    if (!profile_id) {
      return new Response(
        JSON.stringify({ error: "profile_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the connecting user's profile data
    const { data: connectingProfile, error: profileError } = await supabase
      .from("profiles")
      .select("id, city, looking_for")
      .eq("id", profile_id)
      .single();

    if (profileError || !connectingProfile) {
      console.error("Error fetching connecting profile:", profileError);
      return new Response(
        JSON.stringify({ error: "Profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get connecting user's tribes, music, and interests
    const [tribesRes, musicRes, interestsRes] = await Promise.all([
      supabase.from("profile_tribes").select("tribe").eq("profile_id", profile_id),
      supabase.from("profile_music_styles").select("style").eq("profile_id", profile_id),
      supabase.from("profile_interests").select("interest").eq("profile_id", profile_id),
    ]);

    const connectingData: CompatibilityData = {
      profileId: profile_id,
      city: connectingProfile.city,
      tribes: tribesRes.data?.map(t => t.tribe) || [],
      musicStyles: musicRes.data?.map(m => m.style) || [],
      interests: interestsRes.data?.map(i => i.interest) || [],
      lookingFor: connectingProfile.looking_for,
    };

    // Get all other users who have push subscriptions and are not blocked
    const { data: pushUsers, error: pushError } = await supabase
      .from("push_subscriptions")
      .select("profile_id")
      .neq("profile_id", profile_id);

    if (pushError) {
      console.error("Error fetching push subscriptions:", pushError);
      return new Response(
        JSON.stringify({ error: "Error fetching subscriptions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const uniqueProfileIds = [...new Set(pushUsers?.map(p => p.profile_id) || [])];

    if (uniqueProfileIds.length === 0) {
      return new Response(
        JSON.stringify({ message: "No users to notify", notified: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get profiles data for all potential recipients
    const { data: otherProfiles } = await supabase
      .from("profiles")
      .select("id, city, looking_for")
      .in("id", uniqueProfileIds);

    // Get tribes, music, interests for all potential recipients in batch
    const [allTribes, allMusic, allInterests] = await Promise.all([
      supabase.from("profile_tribes").select("profile_id, tribe").in("profile_id", uniqueProfileIds),
      supabase.from("profile_music_styles").select("profile_id, style").in("profile_id", uniqueProfileIds),
      supabase.from("profile_interests").select("profile_id, interest").in("profile_id", uniqueProfileIds),
    ]);

    // Build maps for quick lookup
    const tribesMap: Record<string, string[]> = {};
    const musicMap: Record<string, string[]> = {};
    const interestsMap: Record<string, string[]> = {};

    allTribes.data?.forEach(t => {
      if (!tribesMap[t.profile_id]) tribesMap[t.profile_id] = [];
      tribesMap[t.profile_id].push(t.tribe);
    });

    allMusic.data?.forEach(m => {
      if (!musicMap[m.profile_id]) musicMap[m.profile_id] = [];
      musicMap[m.profile_id].push(m.style);
    });

    allInterests.data?.forEach(i => {
      if (!interestsMap[i.profile_id]) interestsMap[i.profile_id] = [];
      interestsMap[i.profile_id].push(i.interest);
    });

    // Check for blocks
    const { data: blocks } = await supabase
      .from("user_blocks")
      .select("blocker_profile_id, blocked_profile_id")
      .or(`blocker_profile_id.eq.${profile_id},blocked_profile_id.eq.${profile_id}`);

    const blockedSet = new Set<string>();
    blocks?.forEach(b => {
      if (b.blocker_profile_id === profile_id) blockedSet.add(b.blocked_profile_id);
      if (b.blocked_profile_id === profile_id) blockedSet.add(b.blocker_profile_id);
    });

    // Find users with high compatibility (4+)
    const highCompatibilityUsers: string[] = [];

    otherProfiles?.forEach(profile => {
      if (blockedSet.has(profile.id)) return;

      const userData: CompatibilityData = {
        profileId: profile.id,
        city: profile.city,
        tribes: tribesMap[profile.id] || [],
        musicStyles: musicMap[profile.id] || [],
        interests: interestsMap[profile.id] || [],
        lookingFor: profile.looking_for,
      };

      const compatibility = calculateCompatibility(connectingData, userData);

      if (compatibility >= 4) {
        highCompatibilityUsers.push(profile.id);
      }
    });

    console.log(`Found ${highCompatibilityUsers.length} users with high compatibility`);

    // Send push notifications to high compatibility users
    let notifiedCount = 0;
    const cityText = connectingData.city ? ` de ${connectingData.city}` : "";

    for (const recipientId of highCompatibilityUsers) {
      try {
        // Call the send-push-notification function
        const response = await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            profile_id: recipientId,
            title: "💫 Alguien afín está en KIKI",
            body: `Alguien${cityText} con alta compatibilidad acaba de conectarse`,
            url: "/presence",
            tag: "high-compatibility-online",
          }),
        });

        if (response.ok) {
          notifiedCount++;
        }
      } catch (error) {
        console.error(`Error notifying user ${recipientId}:`, error);
      }
    }

    // Also create in-app notifications
    for (const recipientId of highCompatibilityUsers) {
      try {
        await supabase.from("notifications").insert({
          profile_id: recipientId,
          type: "high_compatibility_online",
          title: "💫 Alguien afín está en KIKI",
          description: `Alguien${cityText} con alta compatibilidad acaba de conectarse`,
          link: "/presence",
        });
      } catch (error) {
        console.error(`Error creating notification for ${recipientId}:`, error);
      }
    }

    return new Response(
      JSON.stringify({ 
        message: "Notifications sent", 
        notified: notifiedCount,
        highCompatibilityCount: highCompatibilityUsers.length 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in notify-high-compatibility:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
