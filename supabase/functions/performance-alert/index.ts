import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MetricData {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp?: string;
}

interface MetricSummary {
  latest: MetricData | null;
  average: number;
  count: number;
}

interface AlertRequest {
  test?: boolean;
  email: string;
  metrics: Record<string, MetricSummary>;
  thresholds: Record<string, number>;
}

const METRIC_DESCRIPTIONS: Record<string, string> = {
  LCP: 'Largest Contentful Paint - Tiempo de carga del contenido más grande',
  FCP: 'First Contentful Paint - Primer contenido visible',
  CLS: 'Cumulative Layout Shift - Estabilidad visual',
  INP: 'Interaction to Next Paint - Responsividad',
  TTFB: 'Time to First Byte - Respuesta del servidor',
};

const getRatingEmoji = (rating: string): string => {
  switch (rating) {
    case 'good': return '🟢';
    case 'needs-improvement': return '🟡';
    case 'poor': return '🔴';
    default: return '⚪';
  }
};

const formatValue = (name: string, value: number): string => {
  if (name === 'CLS') return value.toFixed(3);
  return `${Math.round(value)}ms`;
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { test, email, metrics, thresholds }: AlertRequest = await req.json();

    console.log(`Performance alert request - Test: ${test}, Email: ${email}`);

    if (!email) {
      throw new Error("Email is required");
    }

    // Find metrics that exceed thresholds
    const alertMetrics: Array<{ name: string; value: number; threshold: number; rating: string }> = [];
    
    Object.entries(metrics).forEach(([name, data]) => {
      if (!data.latest) return;
      
      const threshold = thresholds[name];
      if (threshold && data.latest.value > threshold) {
        alertMetrics.push({
          name,
          value: data.latest.value,
          threshold,
          rating: data.latest.rating,
        });
      }
    });

    // Build metrics summary table
    const metricsRows = Object.entries(metrics)
      .filter(([_, data]) => data.latest)
      .map(([name, data]) => {
        const latest = data.latest!;
        const threshold = thresholds[name];
        const isExceeding = threshold && latest.value > threshold;
        
        return `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px; font-weight: 500;">${getRatingEmoji(latest.rating)} ${name}</td>
            <td style="padding: 12px; color: ${latest.rating === 'good' ? '#22c55e' : latest.rating === 'needs-improvement' ? '#eab308' : '#ef4444'}; font-weight: 600;">
              ${formatValue(name, latest.value)}
            </td>
            <td style="padding: 12px; color: #6b7280;">
              ${threshold ? formatValue(name, threshold) : '-'}
            </td>
            <td style="padding: 12px;">
              ${isExceeding ? '<span style="color: #ef4444; font-weight: 600;">⚠️ Excede</span>' : '<span style="color: #22c55e;">✓ OK</span>'}
            </td>
          </tr>
        `;
      })
      .join('');

    const isTest = test === true;
    const hasAlerts = alertMetrics.length > 0;

    const subject = isTest 
      ? '🧪 [PRUEBA] Alerta de Rendimiento - KIKI'
      : hasAlerts 
        ? `🔴 Alerta de Rendimiento - ${alertMetrics.length} métrica(s) exceden umbral`
        : '📊 Resumen de Rendimiento - KIKI';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #ef4444, #f97316); border-radius: 12px 12px 0 0; padding: 24px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">
                ${isTest ? '🧪 Alerta de Prueba' : hasAlerts ? '⚠️ Alerta de Rendimiento' : '📊 Resumen'}
              </h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">
                KIKI - Monitoreo Web Vitals
              </p>
            </div>
            
            <div style="background: white; border-radius: 0 0 12px 12px; padding: 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              ${isTest ? `
                <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                  <p style="margin: 0; color: #92400e; font-weight: 500;">
                    📧 Este es un email de prueba para verificar la configuración de alertas.
                  </p>
                </div>
              ` : ''}
              
              ${hasAlerts && !isTest ? `
                <div style="background: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                  <h3 style="margin: 0 0 8px 0; color: #dc2626;">
                    ⚠️ ${alertMetrics.length} métrica(s) requieren atención
                  </h3>
                  <ul style="margin: 0; padding-left: 20px; color: #7f1d1d;">
                    ${alertMetrics.map(m => `
                      <li><strong>${m.name}</strong>: ${formatValue(m.name, m.value)} (umbral: ${formatValue(m.name, m.threshold)})</li>
                    `).join('')}
                  </ul>
                </div>
              ` : ''}
              
              <h3 style="margin: 0 0 16px 0; color: #374151;">📊 Resumen de Métricas</h3>
              
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <thead>
                  <tr style="background: #f9fafb;">
                    <th style="padding: 12px; text-align: left; color: #6b7280; font-weight: 500;">Métrica</th>
                    <th style="padding: 12px; text-align: left; color: #6b7280; font-weight: 500;">Valor</th>
                    <th style="padding: 12px; text-align: left; color: #6b7280; font-weight: 500;">Umbral</th>
                    <th style="padding: 12px; text-align: left; color: #6b7280; font-weight: 500;">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  ${metricsRows}
                </tbody>
              </table>
              
              <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <h4 style="margin: 0 0 12px 0; color: #374151;">📖 Guía de Métricas</h4>
                <ul style="margin: 0; padding-left: 20px; color: #6b7280; font-size: 13px; line-height: 1.6;">
                  ${Object.entries(METRIC_DESCRIPTIONS).map(([key, desc]) => `
                    <li><strong>${key}</strong>: ${desc}</li>
                  `).join('')}
                </ul>
              </div>
              
              <div style="margin-top: 24px; text-align: center;">
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                  Generado: ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}
                </p>
              </div>
            </div>
            
            <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 16px;">
              Este email fue enviado desde KIKI Community
            </p>
          </div>
        </body>
      </html>
    `;

    // Send email using Resend API directly
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: "KIKI <onboarding@resend.dev>",
        to: [email],
        subject,
        html: htmlContent,
      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      throw new Error(emailResult.message || 'Failed to send email');
    }

    console.log("Performance alert email sent:", emailResult);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: emailResult.id,
        alertCount: alertMetrics.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error in performance-alert function:", errorMessage);
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
