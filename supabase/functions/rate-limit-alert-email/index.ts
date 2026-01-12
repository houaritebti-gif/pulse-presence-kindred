import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RateLimitAlertRequest {
  alertCount: number;
  threshold: number;
  timeWindowMinutes: number;
  alerts: Array<{
    profileId: string;
    requestCount: number;
    timestamp: string;
  }>;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if user is admin
    const { data: isAdmin } = await supabaseClient.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const body: RateLimitAlertRequest = await req.json();
    const { alertCount, threshold, timeWindowMinutes, alerts } = body;

    if (!alertCount || !threshold || !alerts || alerts.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get admin emails from profiles with admin role
    const { data: adminRoles } = await supabaseClient
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (!adminRoles || adminRoles.length === 0) {
      console.log("No admin users found to notify");
      return new Response(
        JSON.stringify({ sent: false, reason: "No admin users found" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get auth emails for admins - we need to use the service role for this
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const adminEmails: string[] = [];
    for (const adminRole of adminRoles) {
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(adminRole.user_id);
      if (userData?.user?.email) {
        adminEmails.push(userData.user.email);
      }
    }

    if (adminEmails.length === 0) {
      console.log("No admin emails found");
      return new Response(
        JSON.stringify({ sent: false, reason: "No admin emails found" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Build email content
    const alertsList = alerts
      .map(a => `• Perfil ${a.profileId.substring(0, 8)}...: ${a.requestCount} requests (${new Date(a.timestamp).toLocaleString('es-ES')})`)
      .join('\n');

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0a; color: #fff; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #1a1a1a; border-radius: 12px; padding: 24px; border: 1px solid #333; }
          .header { text-align: center; margin-bottom: 24px; }
          .logo { font-size: 24px; font-weight: bold; color: #f97316; }
          .alert-badge { display: inline-block; background: #dc2626; color: white; padding: 4px 12px; border-radius: 20px; font-size: 14px; margin-top: 8px; }
          .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 20px 0; }
          .stat { background: #262626; padding: 16px; border-radius: 8px; text-align: center; }
          .stat-value { font-size: 24px; font-weight: bold; color: #f97316; }
          .stat-label { font-size: 12px; color: #888; margin-top: 4px; }
          .alerts-list { background: #262626; padding: 16px; border-radius: 8px; margin: 20px 0; }
          .alerts-list pre { margin: 0; font-size: 13px; color: #ccc; white-space: pre-wrap; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 24px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🔥 KIKI</div>
            <div class="alert-badge">⚠️ Alerta de Rate Limit</div>
          </div>
          
          <p>Se han detectado <strong>${alertCount} alertas</strong> de rate limit en los últimos <strong>${timeWindowMinutes} minutos</strong>.</p>
          
          <div class="stats">
            <div class="stat">
              <div class="stat-value">${alertCount}</div>
              <div class="stat-label">Alertas</div>
            </div>
            <div class="stat">
              <div class="stat-value">${threshold}</div>
              <div class="stat-label">Umbral</div>
            </div>
            <div class="stat">
              <div class="stat-value">${timeWindowMinutes}m</div>
              <div class="stat-label">Ventana</div>
            </div>
          </div>
          
          <div class="alerts-list">
            <strong style="color: #f97316;">Últimas alertas:</strong>
            <pre>${alertsList}</pre>
          </div>
          
          <p style="color: #888;">Esto puede indicar un intento de abuso o un problema con las notificaciones push. Revisa el panel de administración para más detalles.</p>
          
          <div class="footer">
            <p>Este es un email automático del sistema de alertas de KIKI.</p>
            <p>${new Date().toLocaleString('es-ES')}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Initialize Resend and send email to all admins
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.log("No RESEND_API_KEY configured");
      return new Response(
        JSON.stringify({ sent: false, reason: "No RESEND_API_KEY configured" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const resend = new Resend(resendApiKey);
    const emailResponse = await resend.emails.send({
      from: "KIKI Alerts <onboarding@resend.dev>",
      to: adminEmails,
      subject: `⚠️ Alerta: ${alertCount} rate limits superados en ${timeWindowMinutes}min`,
      html: emailHtml,
    });

    console.log("Rate limit alert email sent:", emailResponse);

    return new Response(
      JSON.stringify({ 
        sent: true, 
        recipients: adminEmails.length,
        messageId: emailResponse.data?.id 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in rate-limit-alert-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
