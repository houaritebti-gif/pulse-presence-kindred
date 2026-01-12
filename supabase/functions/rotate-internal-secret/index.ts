import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Send email notification to admins about secret rotation
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function notifyAdminsAboutRotation(
  supabase: any,
  action: 'rotated' | 'initialized' | 'rotation_failed',
  details: {
    newSecretPrefix?: string;
    gracePeriodHours?: number;
    nextRotationAt?: string;
    error?: string;
  }
) {
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  if (!resendApiKey) {
    console.log('[rotate-internal-secret] No RESEND_API_KEY configured, skipping email notification');
    return;
  }

  try {
    // Get admin emails
    const { data: admins, error: adminError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (adminError || !admins?.length) {
      console.log('[rotate-internal-secret] No admins found or error:', adminError);
      return;
    }

    // Get emails from auth.users
    const adminEmails: string[] = [];
    for (const admin of admins as { user_id: string }[]) {
      const { data: userData } = await supabase.auth.admin.getUserById(admin.user_id);
      if (userData?.user?.email) {
        adminEmails.push(userData.user.email);
      }
    }

    if (adminEmails.length === 0) {
      console.log('[rotate-internal-secret] No admin emails found');
      return;
    }

    const resend = new Resend(resendApiKey);
    
    let subject: string;
    let htmlContent: string;
    
    if (action === 'rotated') {
      subject = '🔐 KIKI: Secreto interno rotado - ACCIÓN REQUERIDA';
      htmlContent = `
        <h1>🔐 Secreto interno rotado</h1>
        <p><strong>El secreto interno usado por los triggers SQL ha sido rotado automáticamente.</strong></p>
        
        <h2>⚠️ ACCIÓN REQUERIDA</h2>
        <p>Tienes <strong>${details.gracePeriodHours || 24} horas</strong> para actualizar los triggers SQL con el nuevo secreto.</p>
        
        <h3>Detalles:</h3>
        <ul>
          <li><strong>Prefijo del nuevo secreto:</strong> ${details.newSecretPrefix}...</li>
          <li><strong>Próxima rotación:</strong> ${details.nextRotationAt}</li>
          <li><strong>Período de gracia:</strong> El secreto anterior seguirá funcionando ${details.gracePeriodHours || 24} horas</li>
        </ul>
        
        <h3>Triggers SQL a actualizar:</h3>
        <ul>
          <li><code>handle_new_connection_request</code></li>
          <li><code>handle_connection_accepted</code></li>
          <li><code>handle_profile_visit_notification</code></li>
          <li><code>handle_premium_ghost_message</code></li>
        </ul>
        
        <p>Consulta la tabla <code>internal_secrets_rotation</code> para obtener el secreto completo.</p>
        
        <hr>
        <p><small>Este email fue enviado automáticamente por el sistema de rotación de secretos de KIKI.</small></p>
      `;
    } else if (action === 'initialized') {
      subject = '🔐 KIKI: Sistema de rotación de secretos inicializado';
      htmlContent = `
        <h1>🔐 Sistema de rotación inicializado</h1>
        <p>El sistema de rotación automática de secretos internos ha sido inicializado correctamente.</p>
        
        <h3>Detalles:</h3>
        <ul>
          <li><strong>Próxima rotación:</strong> ${details.nextRotationAt}</li>
        </ul>
        
        <p>Recibirás un email cuando el secreto sea rotado.</p>
        
        <hr>
        <p><small>Este email fue enviado automáticamente por el sistema de rotación de secretos de KIKI.</small></p>
      `;
    } else {
      subject = '❌ KIKI: Error en rotación de secreto';
      htmlContent = `
        <h1>❌ Error en rotación de secreto</h1>
        <p><strong>La rotación automática del secreto interno ha fallado.</strong></p>
        
        <h3>Error:</h3>
        <pre>${details.error}</pre>
        
        <p>Por favor, revisa los logs de la función <code>rotate-internal-secret</code> para más detalles.</p>
        
        <hr>
        <p><small>Este email fue enviado automáticamente por el sistema de rotación de secretos de KIKI.</small></p>
      `;
    }

    const { error: emailError } = await resend.emails.send({
      from: 'KIKI Security <onboarding@resend.dev>',
      to: adminEmails,
      subject,
      html: htmlContent,
    });

    if (emailError) {
      console.error('[rotate-internal-secret] Error sending email:', emailError);
    } else {
      console.log(`[rotate-internal-secret] Email notification sent to ${adminEmails.length} admin(s)`);
    }
  } catch (error) {
    console.error('[rotate-internal-secret] Error in notifyAdminsAboutRotation:', error);
  }
}

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
      
      const nextRotationDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString();
      
      // Send email notification to admins
      await notifyAdminsAboutRotation(supabase, 'initialized', {
        nextRotationAt: nextRotationDate
      });
      
      return new Response(JSON.stringify({ 
        action: 'initialized',
        message: 'Secret rotation system initialized',
        next_rotation_at: nextRotationDate
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
      
      // Send failure notification to admins
      await notifyAdminsAboutRotation(supabase, 'rotation_failed', {
        error: rotateError.message
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
    
    const nextRotationDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString();
    
    // Send email notification to admins
    await notifyAdminsAboutRotation(supabase, 'rotated', {
      newSecretPrefix: newSecret?.substring(0, 20),
      gracePeriodHours: 24,
      nextRotationAt: nextRotationDate
    });
    
    return new Response(JSON.stringify({ 
      action: 'rotated',
      message: 'Secret rotated successfully',
      new_secret_prefix: newSecret?.substring(0, 20),
      grace_period_hours: 24,
      next_rotation_at: nextRotationDate,
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
