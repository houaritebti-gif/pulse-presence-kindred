import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-internal-secret',
};

// Internal-only push notification function
// Only callable by other edge functions or triggers using internal secret
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const internalSecret = Deno.env.get('INTERNAL_FUNCTION_SECRET');
    
    // SECURITY: Validate this is an internal call, not from a user
    // Option 1: Check for internal secret header (from other edge functions)
    const providedSecret = req.headers.get('x-internal-secret');
    
    // Option 2: Check if called with service_role key (from triggers/internal)
    const authHeader = req.headers.get('Authorization') || '';
    const isServiceRole = authHeader.includes(supabaseServiceKey);
    
    // Validate internal access
    const isInternalCall = (internalSecret && providedSecret === internalSecret) || isServiceRole;
    
    if (!isInternalCall) {
      console.error('Unauthorized: This function is for internal use only');
      return new Response(JSON.stringify({ error: 'Unauthorized: Internal function only' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error('VAPID keys not configured');
      throw new Error('VAPID keys not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { profile_id, title, body, url, tag, quedada_id, spark_chat_id } = await req.json();
    
    if (!profile_id || !title) {
      throw new Error('profile_id and title are required');
    }
    
    console.log(`[Internal] Sending push to profile: ${profile_id}, title: ${title}`);
    
    // Check if this is a quedada notification and user has muted it
    if (quedada_id) {
      const { data: mutedCheck } = await supabase
        .from('muted_quedadas')
        .select('id')
        .eq('profile_id', profile_id)
        .eq('quedada_id', quedada_id)
        .maybeSingle();
      
      if (mutedCheck) {
        console.log(`Quedada ${quedada_id} is muted for profile ${profile_id}, skipping push`);
        return new Response(JSON.stringify({ sent: 0, message: 'Quedada muted' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
    
    // Check if this is a spark chat notification and user has muted it
    if (spark_chat_id) {
      const { data: mutedCheck } = await supabase
        .from('muted_spark_chats')
        .select('id')
        .eq('profile_id', profile_id)
        .eq('chat_id', spark_chat_id)
        .maybeSingle();
      
      if (mutedCheck) {
        console.log(`Spark chat ${spark_chat_id} is muted for profile ${profile_id}, skipping push`);
        return new Response(JSON.stringify({ sent: 0, message: 'Spark chat muted' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
    
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
    
    let successCount = 0;
    const expiredEndpoints: string[] = [];
    
    for (const sub of subscriptions) {
      try {
        console.log(`Processing subscription: ${sub.endpoint.substring(0, 60)}...`);
        
        // Create JWT for VAPID
        const endpoint = new URL(sub.endpoint);
        const audience = endpoint.origin;
        
        // Create VAPID JWT manually
        const header = { alg: 'ES256', typ: 'JWT' };
        const payload = {
          aud: audience,
          exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
          sub: 'mailto:push@kiki.app'
        };
        
        // Base64url encode
        const base64UrlEncode = (obj: unknown) => {
          const str = JSON.stringify(obj);
          const bytes = new TextEncoder().encode(str);
          let binary = '';
          for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        };
        
        const headerB64 = base64UrlEncode(header);
        const payloadB64 = base64UrlEncode(payload);
        const unsignedToken = `${headerB64}.${payloadB64}`;
        
        // Import private key and sign
        const privateKeyBytes = Uint8Array.from(atob(vapidPrivateKey.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
        const publicKeyBytes = Uint8Array.from(atob(vapidPublicKey.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
        
        // Create the JWK for signing
        const jwk = {
          kty: 'EC',
          crv: 'P-256',
          x: btoa(String.fromCharCode(...publicKeyBytes.slice(1, 33))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
          y: btoa(String.fromCharCode(...publicKeyBytes.slice(33, 65))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
          d: btoa(String.fromCharCode(...privateKeyBytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
        };
        
        const key = await crypto.subtle.importKey(
          'jwk',
          jwk,
          { name: 'ECDSA', namedCurve: 'P-256' },
          false,
          ['sign']
        );
        
        const signature = await crypto.subtle.sign(
          { name: 'ECDSA', hash: 'SHA-256' },
          key,
          new TextEncoder().encode(unsignedToken)
        );
        
        // Convert signature from DER to raw format and base64url encode
        const sigBytes = new Uint8Array(signature);
        const sigB64 = btoa(String.fromCharCode(...sigBytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        
        const jwt = `${unsignedToken}.${sigB64}`;
        const authorization = `vapid t=${jwt}, k=${vapidPublicKey}`;
        
        // Send push notification without encrypted payload
        // This triggers the service worker which shows a generic notification
        const response = await fetch(sub.endpoint, {
          method: 'POST',
          headers: {
            'Authorization': authorization,
            'TTL': '86400',
            'Urgency': 'high',
            'Content-Length': '0',
          },
        });
        
        console.log(`Push response: ${response.status}`);
        
        if (response.status === 201 || response.status === 200) {
          successCount++;
          console.log('Push sent successfully');
        } else if (response.status === 410 || response.status === 404) {
          console.log('Subscription expired, marking for removal');
          expiredEndpoints.push(sub.endpoint);
        } else {
          const text = await response.text();
          console.error(`Push failed: ${response.status} - ${text}`);
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
