import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Automatic secret rotation function - called by cron job every 90 days
// This function rotates the internal secret used by SQL triggers
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Validate this is a service_role call (cron job)
    const authHeader = req.headers.get('Authorization') || '';
    if (!authHeader.includes(supabaseServiceKey)) {
      console.error('Unauthorized: rotate-internal-secret is for cron jobs only');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('[rotate-internal-secret] Starting secret rotation check...');
    
    // Check if rotation is needed (next_rotation_at has passed)
    const { data: secretRecord, error: fetchError } = await supabase
      .from('internal_secrets_rotation')
      .select('*')
      .eq('secret_name', 'trigger_internal_secret')
      .maybeSingle();
    
    if (fetchError) {
      console.error('Error fetching secret record:', fetchError);
      throw fetchError;
    }
    
    const now = new Date();
    
    // If no record exists, initialize with the current hardcoded secret
    if (!secretRecord) {
      console.log('[rotate-internal-secret] Initializing secret rotation system...');
      
      // Use the current hardcoded secret as the initial value
      const currentSecret = Deno.env.get('INTERNAL_FUNCTION_SECRET') || 'kiki-internal-f19d23e8-91ab-4cd0-8e72-66d8ef2cb1a4';
      
      const { error: insertError } = await supabase
        .from('internal_secrets_rotation')
        .insert({
          secret_name: 'trigger_internal_secret',
          current_secret: currentSecret,
          previous_secret: null,
          rotated_at: now.toISOString(),
          next_rotation_at: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString()
        });
      
      if (insertError) {
        console.error('Error initializing secret:', insertError);
        throw insertError;
      }
      
      // Log the initialization
      await supabase.from('secrets_rotation_log').insert({
        secret_name: 'trigger_internal_secret',
        action: 'initialized',
        details: 'Secret rotation system initialized with current secret'
      });
      
      console.log('[rotate-internal-secret] Secret rotation system initialized');
      
      return new Response(JSON.stringify({ 
        action: 'initialized',
        message: 'Secret rotation system initialized',
        next_rotation_at: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Check if rotation is due
    const nextRotation = new Date(secretRecord.next_rotation_at);
    if (now < nextRotation) {
      const daysUntilRotation = Math.ceil((nextRotation.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      console.log(`[rotate-internal-secret] No rotation needed. Next rotation in ${daysUntilRotation} days`);
      
      return new Response(JSON.stringify({ 
        action: 'none',
        message: `Rotation not due yet. ${daysUntilRotation} days remaining`,
        next_rotation_at: secretRecord.next_rotation_at
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Perform rotation
    console.log('[rotate-internal-secret] Rotating secret...');
    
    const { data: newSecret, error: rotateError } = await supabase.rpc('rotate_internal_secret', {
      p_secret_name: 'trigger_internal_secret'
    });
    
    if (rotateError) {
      console.error('Error rotating secret:', rotateError);
      
      // Log the failure
      await supabase.from('secrets_rotation_log').insert({
        secret_name: 'trigger_internal_secret',
        action: 'rotation_failed',
        details: rotateError.message
      });
      
      throw rotateError;
    }
    
    console.log('[rotate-internal-secret] Secret rotated successfully');
    console.log('[rotate-internal-secret] IMPORTANT: Update SQL triggers with new secret within 24 hours');
    console.log(`[rotate-internal-secret] New secret starts with: ${newSecret?.substring(0, 20)}...`);
    
    // Create admin notification about the rotation
    // In a production system, you'd want to alert admins to update the hardcoded triggers
    await supabase.from('secrets_rotation_log').insert({
      secret_name: 'trigger_internal_secret',
      action: 'rotation_completed',
      details: `Secret rotated. Previous secret valid for 24h grace period. New secret: ${newSecret?.substring(0, 20)}...`
    });
    
    // Clean up old rate limit records
    const { data: cleanedCount } = await supabase.rpc('cleanup_old_rate_limits');
    console.log(`[rotate-internal-secret] Cleaned up ${cleanedCount || 0} old rate limit records`);
    
    return new Response(JSON.stringify({ 
      action: 'rotated',
      message: 'Secret rotated successfully',
      new_secret_prefix: newSecret?.substring(0, 20),
      grace_period_hours: 24,
      next_rotation_at: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      rate_limits_cleaned: cleanedCount || 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Error in rotate-internal-secret:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
