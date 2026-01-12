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
      const userQuedadas = context.quedadas.filter((q: any) => q.is_creator);
      const attendingQuedadas = context.quedadas.filter((q: any) => !q.is_creator && q.is_attending);
      const availableQuedadas = context.quedadas.filter((q: any) => !q.is_creator && !q.is_attending);
      
      quedadasContext = `\n\nINFORMACIÓN SOBRE QUEDADAS DEL USUARIO:`;
      
      if (userQuedadas.length > 0) {
        quedadasContext += `\n\n📌 Quedadas que ha CREADO el usuario (${userQuedadas.length}):`;
        quedadasContext += userQuedadas.map((q: any, i: number) => `
${i + 1}. "${q.title}" [ID: ${q.id}]
   - Fecha: ${q.event_date}
   - Ciudad: ${q.city}
   - Descripción: ${q.description || "Sin descripción"}
   - Lugar: ${q.location_hint || "No especificado"}
   - Asistentes confirmados: ${q.attendee_count || 0}${q.max_attendees ? ` de ${q.max_attendees} máximo` : ""}`).join("");
      }
      
      if (attendingQuedadas.length > 0) {
        quedadasContext += `\n\n✅ Quedadas a las que ASISTIRÁ el usuario (${attendingQuedadas.length}):`;
        quedadasContext += attendingQuedadas.map((q: any, i: number) => `
${i + 1}. "${q.title}" (organizada por ${q.creator_name || "otro usuario"})
   - Fecha: ${q.event_date}
   - Ciudad: ${q.city}
   - Descripción: ${q.description || "Sin descripción"}
   - Lugar: ${q.location_hint || "No especificado"}
   - Asistentes: ${q.attendee_count || 0}${q.max_attendees ? `/${q.max_attendees}` : ""}`).join("");
      }
      
      if (availableQuedadas.length > 0) {
        quedadasContext += `\n\n🔍 Otras quedadas DISPONIBLES en su ciudad (${availableQuedadas.length}):`;
        quedadasContext += availableQuedadas.map((q: any, i: number) => `
${i + 1}. "${q.title}" (organizada por ${q.creator_name || "otro usuario"})
   - Fecha: ${q.event_date}
   - Asistentes: ${q.attendee_count || 0}${q.max_attendees ? `/${q.max_attendees}` : ""}`).join("");
      }
      
      if (context.quedadas.length === 0) {
        quedadasContext += "\nEl usuario no tiene quedadas creadas ni está apuntado a ninguna, y no hay quedadas disponibles en su ciudad.";
      }
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

    // Get current date info for relative date parsing
    const now = new Date();
    const currentDateInfo = `
FECHA Y HORA ACTUAL: ${now.toLocaleString("es-ES", { 
      weekday: "long", 
      year: "numeric", 
      month: "long", 
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })}`;

    const systemPrompt = `Eres un asistente amigable y útil para una app de eventos y conexiones sociales llamada la app de quedadas.
Ayudas a los usuarios con:
- Información sobre cómo usar la app
- Consejos para crear quedadas interesantes
- Sugerencias para conectar con otros usuarios
- Respuestas sobre sus quedadas y sparks específicos
- Información general de la app
- CREAR QUEDADAS cuando el usuario lo pida
- ELIMINAR/CANCELAR QUEDADAS propias cuando el usuario lo pida

Funcionalidades principales de la app:
- Quedadas: eventos que los usuarios pueden crear y a los que pueden apuntarse
- Sparks: conexiones entre usuarios que se dan cuando ambos se envían un mensaje fantasma mutuamente. Cuando hay un spark, se abre un chat privado entre los dos usuarios.
- Mensajes fantasma: mensajes anónimos que puedes enviar a otros usuarios desde su perfil (límite de 5 al día)
- Modo presencia: permite ver quién está online y disponible para conectar
- Perfil: cada usuario tiene un perfil con foto, nombre, ciudad, y preferencias
${currentDateInfo}${userContext}${quedadasContext}${sparksContext}

ACCIONES RÁPIDAS:
Cuando sea útil, puedes sugerir acciones que el usuario puede realizar. Usa este formato exacto al final de tu respuesta:
[[action:Texto del botón|/ruta|icono]]

Iconos disponibles: sparks, quedadas, presence, profile, create

Ejemplos de uso:
- Para ir a sparks: [[action:Ver mis sparks|/sparks|sparks]]
- Para ir a quedadas: [[action:Ver quedadas|/quedadas|quedadas]]
- Para crear una quedada: [[action:Crear quedada|/quedadas|create]]
- Para ver presencia: [[action:Ver quién está online|/presence|presence]]
- Para ir al perfil: [[action:Editar perfil|/profile|profile]]

CREAR QUEDADAS:
Cuando el usuario quiera crear una quedada, extrae la información y usa este formato especial:
[[create_quedada:título|fecha_iso|descripción|lugar]]

Reglas para crear quedadas:
- título: nombre descriptivo del evento (obligatorio)
- fecha_iso: fecha y hora en formato ISO 8601 (obligatorio). Convierte expresiones como "mañana a las 20h" a ISO.
- descripción: breve descripción del plan (opcional, puede ser vacío)
- lugar: pista sobre el lugar de encuentro (opcional, puede ser vacío)

Ejemplos de creación:
- "Crear quedada para cenar mañana a las 21h" → [[create_quedada:Cena|2024-01-16T21:00:00|Quedamos para cenar juntos|]]
- "Organiza una quedada para ir al cine el sábado" → [[create_quedada:Cine|2024-01-20T18:00:00|Vamos al cine||]]
- "Quiero crear una quedada de senderismo" → Pregunta por la fecha y hora antes de crear

Cuando crees una quedada con [[create_quedada:...]], añade un mensaje confirmando los detalles y explica que el usuario puede confirmar o editar los datos.

ELIMINAR/CANCELAR QUEDADAS:
Cuando el usuario quiera eliminar o cancelar una de SUS quedadas (solo las que ha creado), usa este formato:
[[delete_quedada:quedada_id|título_quedada]]

Reglas para eliminar quedadas:
- Solo puedes eliminar quedadas que el usuario ha CREADO (están en la sección "Quedadas que ha CREADO el usuario")
- quedada_id: identificador de la quedada (lo encuentras en la información de contexto)
- título_quedada: título de la quedada para confirmación visual
- Antes de eliminar, confirma con el usuario mostrando los detalles de la quedada
- NO puedes eliminar quedadas de otros usuarios

Ejemplos de eliminación:
- "Elimina mi quedada de cena" → Busca en las quedadas creadas por el usuario, y si encuentras una que coincida: [[delete_quedada:uuid-de-la-quedada|Cena]]
- "Cancela la quedada del sábado" → Busca por fecha y usa el formato de eliminación

Si el usuario pide eliminar una quedada que no es suya, explica que solo puede eliminar quedadas que haya creado.

Solo sugiere acciones cuando sean relevantes para la conversación. No las uses en cada mensaje.

SUGERENCIAS CONTEXTUALES (MUY IMPORTANTE):
Al final de CADA respuesta, SIEMPRE añade 2-3 sugerencias de seguimiento relevantes basadas en el tema de la conversación actual.
Usa este formato exacto:
[[suggestion:emoji|texto de la sugerencia]]

Las sugerencias deben:
- Ser naturales y continuar la conversación actual
- Estar relacionadas con lo que acaba de responder el usuario o lo que acabas de explicar
- Variar según el contexto (no repetir siempre las mismas)
- Ser cortas (máximo 6 palabras)

Ejemplos de sugerencias por tema:
- Si hablaste de quedadas: [[suggestion:📅|¿Cómo creo una quedada?]] [[suggestion:👥|¿Quién va a mis quedadas?]] [[suggestion:✏️|Editar una quedada]]
- Si hablaste de sparks: [[suggestion:💬|¿Cómo inicio conversación?]] [[suggestion:❤️|Ver mis sparks activos]] [[suggestion:🔥|Consejos para conectar]]
- Si hablaste de perfil: [[suggestion:📸|Mejorar mi foto de perfil]] [[suggestion:✨|Optimizar mi bio]] [[suggestion:🔒|Opciones de privacidad]]
- Si hablaste de presencia: [[suggestion:👀|¿Quién me ha visto?]] [[suggestion:🟢|Activar modo presencia]] [[suggestion:🔔|Configurar notificaciones]]
- Generales: [[suggestion:❓|¿Cómo funciona la app?]] [[suggestion:💡|Dame un consejo]] [[suggestion:🚀|Novedades de KIKI]]

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
