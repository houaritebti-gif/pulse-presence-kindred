import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PendingNotification {
  recipient_profile_id: string;
  new_user_count: number;
  cities: string[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting daily presence summary...");

    // Get aggregated pending notifications per recipient
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

    // Aggregate by recipient
    const aggregated = new Map<string, { count: number; cities: Set<string> }>();
    
    for (const notification of pendingData) {
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

    console.log(`Processing summaries for ${aggregated.size} users`);

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

        // Send push notification
        const pushResponse = await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseServiceKey}`,
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

        successCount++;
      } catch (err) {
        console.error(`Error processing recipient ${recipientProfileId}:`, err);
        errorCount++;
      }
    }

    // Clear all pending notifications after processing
    const { error: deleteError } = await supabase
      .from("pending_presence_notifications")
      .delete()
      .gte("created_at", "1970-01-01"); // Delete all

    if (deleteError) {
      console.error("Error clearing pending notifications:", deleteError);
    }

    // Also clear presence_exhaustion records older than 7 days to keep table clean
    await supabase
      .from("presence_exhaustion")
      .delete()
      .lt("exhausted_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    console.log(`Daily summary complete. Success: ${successCount}, Errors: ${errorCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: successCount,
        errors: errorCount,
        totalRecipients: aggregated.size,
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
