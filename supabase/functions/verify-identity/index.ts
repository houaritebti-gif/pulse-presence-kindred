import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Get user from token
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const { verification_id } = await req.json();

    // Get verification request with profile info
    const { data: verification, error: verificationError } = await supabase
      .from("identity_verifications")
      .select(`
        *,
        profile:profiles(id, avatar_url, user_id)
      `)
      .eq("id", verification_id)
      .single();

    if (verificationError || !verification) {
      throw new Error("Verification not found");
    }

    // Verify the user owns this verification
    if (verification.profile.user_id !== user.id) {
      throw new Error("Unauthorized");
    }

    if (verification.status !== "pending") {
      throw new Error("Verification already processed");
    }

    const profilePhotoUrl = verification.profile.avatar_url;
    const selfieUrl = verification.selfie_url;

    if (!profilePhotoUrl) {
      // Auto-reject if no profile photo
      await supabase
        .from("identity_verifications")
        .update({
          status: "rejected",
          rejection_reason: "No tienes foto de perfil. Añade una foto de perfil primero.",
        })
        .eq("id", verification_id);

      return new Response(
        JSON.stringify({ success: false, reason: "No profile photo" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use AI to compare photos
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `You are an identity verification assistant. Compare these two photos and determine if they show the SAME person.

IMPORTANT CRITERIA:
1. The selfie should show a real person (not a photo of a photo, not a screen, not an obvious fake)
2. The facial features should match between the profile photo and the selfie
3. Be reasonably lenient - different lighting, angles, and minor changes (glasses, haircut) are acceptable
4. The person should be clearly visible in both photos

Respond with ONLY a JSON object in this exact format:
{
  "match": true or false,
  "confidence": "high", "medium", or "low",
  "reason": "brief explanation in Spanish"
}

If you cannot determine (e.g., face not visible, photo quality too low), respond with match: false and explain why.`,
              },
              {
                type: "image_url",
                image_url: { url: profilePhotoUrl },
              },
              {
                type: "image_url",
                image_url: { url: selfieUrl },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error("AI verification failed");
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || "";

    // Parse AI response
    let verificationResult;
    try {
      // Extract JSON from response (might have markdown)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        verificationResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON in response");
      }
    } catch {
      console.error("Failed to parse AI response:", content);
      verificationResult = { match: false, reason: "Error al procesar la verificación" };
    }

    const isApproved = verificationResult.match === true;

    // Update verification status
    await supabase
      .from("identity_verifications")
      .update({
        status: isApproved ? "approved" : "rejected",
        rejection_reason: isApproved ? null : verificationResult.reason,
        verified_at: isApproved ? new Date().toISOString() : null,
      })
      .eq("id", verification_id);

    // If approved, update profile
    if (isApproved) {
      await supabase
        .from("profiles")
        .update({ identity_verified: true })
        .eq("id", verification.profile_id);
    }

    return new Response(
      JSON.stringify({
        success: isApproved,
        reason: verificationResult.reason,
        confidence: verificationResult.confidence,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
