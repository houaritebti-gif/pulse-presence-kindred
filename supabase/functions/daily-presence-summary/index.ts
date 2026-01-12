import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current hour in UTC (cron runs in UTC)
    const currentHour = new Date().getUTCHours();
    console.log(`Starting presence summary for hour ${currentHour} UTC...`);

    // Get all pending notifications grouped by recipient
    const { data: pendingData, error: fetchError } = await supabase
      .from("pending_presence_notifications")
      .select("recipient_profile_id, new_user_city");

    if (fetchError) {
      console.error("Error fetching pending notifications:", fetchError);
      throw fetchError;
    }

    if (!pendingData || pendingData.length === 0) {
      console.log("No pending notifications to process");
      return new Response(
        JSON.stringify({ success: true, message: "No pending notifications" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get unique recipient IDs
    const recipientIds = [...new Set(pendingData.map(n => n.recipient_profile_id))];

    // Get profiles with their preferred hour - only process those matching current hour
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, notify_summary_hour")
      .in("id", recipientIds);

    if (profileError) {
      console.error("Error fetching profiles:", profileError);
      throw profileError;
    }

    // Filter to only recipients whose preferred hour matches current hour
    const recipientsToNotify = profiles
      ?.filter(p => (p.notify_summary_hour ?? 9) === currentHour)
      .map(p => p.id) || [];

    if (recipientsToNotify.length === 0) {
      console.log(`No recipients scheduled for hour ${currentHour}`);
      return new Response(
        JSON.stringify({ success: true, message: `No recipients for hour ${currentHour}`, pendingCount: pendingData.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing summaries for ${recipientsToNotify.length} users at hour ${currentHour}`);

    // Aggregate by recipient (only those we're notifying now)
    const aggregated = new Map<string, { count: number; cities: Set<string> }>();
    
    for (const notification of pendingData) {
      if (!recipientsToNotify.includes(notification.recipient_profile_id)) continue;
      
      const existing = aggregated.get(notification.recipient_profile_id);
      if (existing) {
        existing.count++;
        if (notification.new_user_city) {
          existing.cities.add(notification.new_user_city);
        }
      } else {
        aggregated.set(notification.recipient_profile_id, {
          count: 1,
          cities: notification.new_user_city ? new Set([notification.new_user_city]) : new Set(),
        });
      }
    }

    let successCount = 0;
    let errorCount = 0;

    // Send summary notification to each recipient
    for (const [recipientProfileId, data] of aggregated) {
      try {
        const citiesArray = Array.from(data.cities);
        const cityText = citiesArray.length > 0 
          ? citiesArray.length === 1 
            ? `de ${citiesArray[0]}`
            : citiesArray.length <= 3
              ? `de ${citiesArray.slice(0, -1).join(", ")} y ${citiesArray.slice(-1)}`
              : `de ${citiesArray.slice(0, 2).join(", ")} y más`
          : "";

        const title = "✨ Nuevos perfiles disponibles";
        const description = data.count === 1
          ? `1 persona nueva ${cityText} te está esperando`
          : `${data.count} personas nuevas ${cityText} te están esperando`;

        // Create in-app notification
        const { error: notifError } = await supabase
          .from("notifications")
          .insert({
            profile_id: recipientProfileId,
            type: "new_presence",
            title,
            description,
            link: "/presence",
          });

        if (notifError) {
          console.error(`Error creating notification for ${recipientProfileId}:`, notifError);
          errorCount++;
          continue;
        }

        // Send push notification with internal secret
        const internalSecret = Deno.env.get("INTERNAL_FUNCTION_SECRET") || "kiki-internal-f19d23e8-91ab-4cd0-8e72-66d8ef2cb1a4";
        const pushResponse = await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-internal-secret": internalSecret,
          },
          body: JSON.stringify({
            profile_id: recipientProfileId,
            title,
            body: description,
            url: "/presence",
            tag: "daily-presence-summary",
          }),
        });

        if (!pushResponse.ok) {
          console.warn(`Push notification failed for ${recipientProfileId}:`, await pushResponse.text());
        }

        // Delete pending notifications for this recipient after successful processing
        await supabase
          .from("pending_presence_notifications")
          .delete()
          .eq("recipient_profile_id", recipientProfileId);

        successCount++;
      } catch (err) {
        console.error(`Error processing recipient ${recipientProfileId}:`, err);
        errorCount++;
      }
    }

    // Clean up old presence_exhaustion records (older than 7 days)
    await supabase
      .from("presence_exhaustion")
      .delete()
      .lt("exhausted_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    console.log(`Summary complete for hour ${currentHour}. Success: ${successCount}, Errors: ${errorCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        hour: currentHour,
        processed: successCount,
        errors: errorCount,
        totalRecipients: recipientsToNotify.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in daily presence summary:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
