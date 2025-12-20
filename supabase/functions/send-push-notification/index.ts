import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!vapidPublicKey || !vapidPrivateKey) {
      throw new Error('VAPID keys not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { profile_id, title, body, url, tag } = await req.json();
    
    if (!profile_id || !title) {
      throw new Error('profile_id and title are required');
    }
    
    console.log(`Sending push to profile: ${profile_id}`);
    
    // Get all subscriptions for this profile
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('profile_id', profile_id);
    
    if (subError) {
      console.error('Error fetching subscriptions:', subError);
      throw subError;
    }
    
    if (!subscriptions || subscriptions.length === 0) {
      console.log('No subscriptions found for profile');
      return new Response(JSON.stringify({ sent: 0, message: 'No subscriptions' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log(`Found ${subscriptions.length} subscriptions`);
    
    const payload = JSON.stringify({ title, body, url, tag });
    let successCount = 0;
    const expiredEndpoints: string[] = [];
    
    for (const sub of subscriptions) {
      try {
        // Use simple fetch to push service - the browser handles decryption
        const response = await fetch(sub.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'TTL': '86400',
          },
          body: payload,
        });
        
        console.log(`Push to ${sub.endpoint.substring(0, 50)}..., status: ${response.status}`);
        
        if (response.status === 410 || response.status === 404) {
          console.log('Subscription expired or invalid');
          expiredEndpoints.push(sub.endpoint);
        } else if (response.ok || response.status === 201) {
          successCount++;
        }
      } catch (pushError) {
        console.error('Error sending individual push:', pushError);
      }
    }
    
    // Clean up expired subscriptions
    if (expiredEndpoints.length > 0) {
      console.log(`Removing ${expiredEndpoints.length} expired subscriptions`);
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('endpoint', expiredEndpoints);
    }
    
    return new Response(JSON.stringify({ 
      sent: successCount, 
      total: subscriptions.length,
      expired: expiredEndpoints.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Error in send-push-notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
