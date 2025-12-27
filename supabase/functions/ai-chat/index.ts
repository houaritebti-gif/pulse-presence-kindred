import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Sending request to Lovable AI with messages:", messages.length, "context:", !!context);

    // Build context about user's quedadas
    let quedadasContext = "";
    if (context?.quedadas && context.quedadas.length > 0) {
      quedadasContext = `\n\nInformación sobre las quedadas del usuario:
${context.quedadas.map((q: any, i: number) => `
${i + 1}. "${q.title}" 
   - Fecha: ${q.event_date}
   - Ciudad: ${q.city}
   - Descripción: ${q.description || "Sin descripción"}
   - Lugar: ${q.location_hint || "No especificado"}
   - Asistentes: ${q.attendee_count || 0}${q.max_attendees ? `/${q.max_attendees}` : ""}
   - Creador: ${q.is_creator ? "Tú" : q.creator_name || "Otro usuario"}
   - Estado: ${q.is_attending ? "Apuntado" : "No apuntado"}`).join("\n")}`;
    }

    // Build context about user's sparks
    let sparksContext = "";
    if (context?.sparks && context.sparks.length > 0) {
      sparksContext = `\n\nInformación sobre los sparks (conexiones) activos del usuario:
${context.sparks.map((s: any, i: number) => `
${i + 1}. Conexión con "${s.other_name || "Usuario anónimo"}"
   - Vibra: ${s.other_vibe || "No especificada"}
   - Conectados desde: ${s.created_at}
   - Mensajes sin leer: ${s.has_unread ? "Sí" : "No"}
   - Último mensaje: ${s.last_message ? `"${s.last_message.substring(0, 50)}${s.last_message.length > 50 ? '...' : ''}"` : "Sin mensajes aún"}`).join("\n")}`;
    }

    let userContext = "";
    if (context?.profile) {
      userContext = `\n\nInformación del usuario:
- Nombre: ${context.profile.name || "No especificado"}
- Ciudad: ${context.profile.city || "No especificada"}`;
    }

    const systemPrompt = `Eres un asistente amigable y útil para una app de eventos y conexiones sociales llamada la app de quedadas.
Ayudas a los usuarios con:
- Información sobre cómo usar la app
- Consejos para crear quedadas interesantes
- Sugerencias para conectar con otros usuarios
- Respuestas sobre sus quedadas y sparks específicos
- Información general de la app

Funcionalidades principales de la app:
- Quedadas: eventos que los usuarios pueden crear y a los que pueden apuntarse
- Sparks: conexiones entre usuarios que se dan cuando ambos se envían un mensaje fantasma mutuamente. Cuando hay un spark, se abre un chat privado entre los dos usuarios.
- Mensajes fantasma: mensajes anónimos que puedes enviar a otros usuarios desde su perfil (límite de 5 al día)
- Modo presencia: permite ver quién está online y disponible para conectar
- Perfil: cada usuario tiene un perfil con foto, nombre, ciudad, y preferencias
${userContext}${quedadasContext}${sparksContext}

Responde siempre en español de forma concisa y amable. Usa emojis ocasionalmente para ser más cercano. Si te preguntan sobre quedadas o sparks específicos, usa la información proporcionada.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Demasiadas solicitudes. Espera un momento." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Límite de uso alcanzado." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "Error del servicio de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
