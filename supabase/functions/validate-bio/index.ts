import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();

    if (!text || typeof text !== "string") {
      return new Response(
        JSON.stringify({ valid: true, matchCount: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role to access blacklist
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Use the database function to check for blacklisted words
    // This doesn't reveal which words are in the blacklist
    const { data: containsBlacklisted, error: checkError } = await supabase.rpc(
      "contains_blacklisted_words",
      { text_to_check: text }
    );

    if (checkError) {
      console.error("Error checking blacklist:", checkError);
      // Fail open - allow the text if we can't check
      return new Response(
        JSON.stringify({ valid: true, matchCount: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Only return if valid or not - don't reveal which words matched
    // This protects the blacklist from being enumerated
    return new Response(
      JSON.stringify({
        valid: !containsBlacklisted,
        // Don't reveal specific words to prevent enumeration attacks
        message: containsBlacklisted
          ? "El texto contiene palabras no permitidas"
          : null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Validate bio error:", error);
    return new Response(
      JSON.stringify({ valid: true, matchCount: 0, error: "Error validating" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
