import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

// Product ID to tier mapping
const PRODUCT_TIERS: Record<string, string> = {
  "prod_TgrWGHXV0OmYYs": "plus",     // KIKI Plan Plus
  "prod_TgryLoQqEUPl9z": "premium",  // KIKI Plan Premium
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get user profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    if (profileError || !profile) {
      logStep("Profile not found, returning free tier");
      return new Response(JSON.stringify({ subscribed: false, tier: "free" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    logStep("Found profile", { profileId: profile.id });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No Stripe customer found, returning free tier");
      return new Response(JSON.stringify({ subscribed: false, tier: "free" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    const hasActiveSub = subscriptions.data.length > 0;
    let tier = "free";
    let subscriptionEnd = null;
    let stripeSubscriptionId = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      stripeSubscriptionId = subscription.id;
      const productId = subscription.items.data[0].price.product as string;
      tier = PRODUCT_TIERS[productId] || "plus";
      logStep("Active subscription found", { 
        subscriptionId: subscription.id, 
        endDate: subscriptionEnd,
        productId,
        tier 
      });

      // Update user_subscriptions table (without Stripe IDs)
      const { error: upsertError } = await supabaseClient
        .from('user_subscriptions')
        .upsert({
          profile_id: profile.id,
          tier: tier,
          expires_at: subscriptionEnd,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'profile_id' });
      
      if (upsertError) {
        logStep("Error upserting subscription", { error: upsertError.message });
      } else {
        logStep("Subscription record updated in database");
      }

      // Store Stripe IDs in separate restricted table
      const { error: stripeError } = await supabaseClient
        .from('stripe_customer_data')
        .upsert({
          profile_id: profile.id,
          stripe_customer_id: customerId,
          stripe_subscription_id: stripeSubscriptionId,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'profile_id' });
      
      if (stripeError) {
        logStep("Error upserting stripe data", { error: stripeError.message });
      }
    } else {
      logStep("No active subscription found");
      
      // Check if there's a local subscription (trial)
      const { data: localSub } = await supabaseClient
        .from('user_subscriptions')
        .select('tier, expires_at, trial_started_at')
        .eq('profile_id', profile.id)
        .single();
      
      if (localSub && localSub.trial_started_at && localSub.expires_at) {
        const isExpired = new Date(localSub.expires_at) < new Date();
        if (!isExpired) {
          tier = localSub.tier;
          subscriptionEnd = localSub.expires_at;
          logStep("Using local trial subscription", { tier, subscriptionEnd });
        }
      }
    }

    // Don't expose stripe_subscription_id to client for security
    return new Response(JSON.stringify({
      subscribed: tier !== "free",
      tier,
      subscription_end: subscriptionEnd,
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
