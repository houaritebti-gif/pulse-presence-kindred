import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as jose from "https://deno.land/x/jose@v5.2.0/index.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function base64UrlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - base64.length % 4) % 4);
  const binary = atob(base64 + padding);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function createVapidAuth(
  audience: string,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<string> {
  // Decode the keys
  const publicKeyBytes = base64UrlDecode(vapidPublicKey);
  const privateKeyBytes = base64UrlDecode(vapidPrivateKey);

  // Create JWK for the private key (P-256/ES256)
  const privateJwk = {
    kty: 'EC',
    crv: 'P-256',
    // Extract x and y from the public key (skip first byte which is 0x04)
    x: btoa(String.fromCharCode(...publicKeyBytes.slice(1, 33))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, ''),
    y: btoa(String.fromCharCode(...publicKeyBytes.slice(33, 65))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, ''),
    d: btoa(String.fromCharCode(...privateKeyBytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, ''),
  };

  const privateKey = await jose.importJWK(privateJwk, 'ES256');
  
  const jwt = await new jose.SignJWT({})
    .setProtectedHeader({ alg: 'ES256', typ: 'JWT' })
    .setAudience(audience)
    .setSubject('mailto:push@kiki.app')
    .setExpirationTime('12h')
    .sign(privateKey);
  
  return `vapid t=${jwt}, k=${vapidPublicKey}`;
}

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
        const endpoint = new URL(sub.endpoint);
        const audience = endpoint.origin;
        
        // Create VAPID authorization header
        const authorization = await createVapidAuth(audience, vapidPublicKey, vapidPrivateKey);
        
        console.log(`Sending to: ${sub.endpoint.substring(0, 60)}...`);
        
        // Send push notification - for FCM we can send without encryption for simple payloads
        const response = await fetch(sub.endpoint, {
          method: 'POST',
          headers: {
            'Authorization': authorization,
            'TTL': '86400',
            'Urgency': 'high',
          },
        });
        
        console.log(`Push response status: ${response.status}`);
        
        if (response.status === 201 || response.ok) {
          successCount++;
        } else if (response.status === 410 || response.status === 404) {
          console.log('Subscription expired');
          expiredEndpoints.push(sub.endpoint);
        } else {
          const text = await response.text();
          console.error(`Push failed: ${response.status} - ${text}`);
        }
        
      } catch (pushError: any) {
        console.error('Error sending push:', pushError.message);
        
        if (pushError.statusCode === 410 || pushError.statusCode === 404) {
          expiredEndpoints.push(sub.endpoint);
        }
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
    
    console.log(`Push complete: ${successCount}/${subscriptions.length} sent`);
    
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
