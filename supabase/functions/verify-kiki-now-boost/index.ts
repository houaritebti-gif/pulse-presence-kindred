import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-KIKI-NOW] ${step}${detailsStr}`);
};

// Boost duration in hours
const BOOST_DURATION_HOURS = 1;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Use service role to insert boosts
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const { session_id } = await req.json();
    if (!session_id) throw new Error("No session_id provided");
    logStep("Session ID received", { session_id });

    // Retrieve authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Get profile ID
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError || !profile) throw new Error("Profile not found");
    logStep("Profile found", { profileId: profile.id });

    // Initialize Stripe and verify payment
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const session = await stripe.checkout.sessions.retrieve(session_id);
    logStep("Stripe session retrieved", { status: session.payment_status, metadata: session.metadata });

    if (session.payment_status !== "paid") {
      throw new Error("Payment not completed");
    }

    // Verify this session is for the right profile
    if (session.metadata?.profile_id !== profile.id) {
      throw new Error("Session does not match user profile");
    }

    // Check if boost already exists for this session
    const { data: existingBoost } = await supabaseAdmin
      .from("kiki_now_boosts")
      .select("id")
      .eq("stripe_payment_intent_id", session.payment_intent as string)
      .maybeSingle();

    if (existingBoost) {
      logStep("Boost already activated for this payment");
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Boost already active",
        already_active: true 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Create the boost
    const now = new Date();
    const expiresAt = new Date(now.getTime() + BOOST_DURATION_HOURS * 60 * 60 * 1000);

    const { error: insertError } = await supabaseAdmin
      .from("kiki_now_boosts")
      .insert({
        profile_id: profile.id,
        started_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        stripe_payment_intent_id: session.payment_intent as string,
      });

    if (insertError) throw insertError;
    logStep("Boost activated", { expiresAt: expiresAt.toISOString() });

    return new Response(JSON.stringify({ 
      success: true, 
      expires_at: expiresAt.toISOString(),
      duration_hours: BOOST_DURATION_HOURS
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});