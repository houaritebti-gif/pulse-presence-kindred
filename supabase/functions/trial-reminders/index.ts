import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('Checking for trials expiring in 2 days...');
    
    // Find users whose trial expires in approximately 2 days (between 1.5 and 2.5 days)
    const now = new Date();
    const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const twoDaysFromNowStart = new Date(twoDaysFromNow.getTime() - 12 * 60 * 60 * 1000); // 1.5 days
    const twoDaysFromNowEnd = new Date(twoDaysFromNow.getTime() + 12 * 60 * 60 * 1000); // 2.5 days
    
    // Find trials that don't have a Stripe subscription (check stripe_customer_data table)
    const { data: expiringTrials, error: trialsError } = await supabase
      .from('user_subscriptions')
      .select('profile_id, expires_at')
      .not('trial_started_at', 'is', null)
      .eq('tier', 'plus')
      .gte('expires_at', twoDaysFromNowStart.toISOString())
      .lte('expires_at', twoDaysFromNowEnd.toISOString());
    
    // Filter out users who have a Stripe subscription
    let filteredTrials = expiringTrials || [];
    if (filteredTrials.length > 0) {
      const profileIds = filteredTrials.map(t => t.profile_id);
      const { data: stripeData } = await supabase
        .from('stripe_customer_data')
        .select('profile_id')
        .in('profile_id', profileIds)
        .not('stripe_subscription_id', 'is', null);
      
      const paidProfileIds = new Set(stripeData?.map(s => s.profile_id) || []);
      filteredTrials = filteredTrials.filter(t => !paidProfileIds.has(t.profile_id));
    }
    
    if (trialsError) {
      console.error('Error fetching expiring trials:', trialsError);
      throw trialsError;
    }
    
    console.log(`Found ${filteredTrials.length} trials expiring in ~2 days`);
    
    if (filteredTrials.length === 0) {
      return new Response(JSON.stringify({ 
        message: 'No trials expiring in 2 days',
        processed: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    let sentCount = 0;
    let errorCount = 0;
    
    for (const trial of filteredTrials) {
      try {
        // Create a notification in the database
        const { error: notifError } = await supabase
          .from('notifications')
          .insert({
            profile_id: trial.profile_id,
            type: 'trial_ending',
            title: '¡Tu prueba termina pronto!',
            description: 'Te quedan 2 días de prueba gratuita. Suscríbete para mantener el acceso al chatbot IA.',
            link: '/subscription',
          });
        
        if (notifError) {
          console.error(`Error creating notification for ${trial.profile_id}:`, notifError);
        }
        
        // Send push notification
        const pushResponse = await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            profile_id: trial.profile_id,
            title: '¡Tu prueba termina pronto!',
            body: 'Te quedan 2 días. Suscríbete para mantener el acceso.',
            url: '/subscription',
            tag: 'trial-reminder',
          }),
        });
        
        if (pushResponse.ok) {
          sentCount++;
          console.log(`Notification sent to ${trial.profile_id}`);
        } else {
          const errorText = await pushResponse.text();
          console.error(`Push failed for ${trial.profile_id}:`, errorText);
          errorCount++;
        }
        
      } catch (error) {
        console.error(`Error processing trial for ${trial.profile_id}:`, error);
        errorCount++;
      }
    }
    
    console.log(`Trial reminders complete: ${sentCount} sent, ${errorCount} errors`);
    
    return new Response(JSON.stringify({ 
      message: 'Trial reminders processed',
      processed: filteredTrials.length,
      sent: sentCount,
      errors: errorCount,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Error in trial-reminders:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
