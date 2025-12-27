import { useState, useCallback } from "react";
import { useQuedadas } from "./useQuedadas";
import { useProfile } from "./useProfile";

type Message = { role: "user" | "assistant"; content: string };

interface QuedadaContext {
  title: string;
  event_date: string;
  city: string;
  description: string | null;
  location_hint: string | null;
  attendee_count: number;
  max_attendees: number | null;
  is_creator: boolean;
  is_attending: boolean;
  creator_name: string | null;
}

interface ChatContext {
  quedadas: QuedadaContext[];
  profile: {
    name: string | null;
    city: string | null;
  } | null;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

export const useAIChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { data: quedadas } = useQuedadas();
  const { data: profile } = useProfile();

  const buildContext = useCallback((): ChatContext => {
    const quedadasContext: QuedadaContext[] = (quedadas || []).map((q) => {
      const isCreator = profile?.id === q.creator_profile_id;
      return {
        title: q.title,
        event_date: new Date(q.event_date).toLocaleString("es-ES", {
          weekday: "long",
          day: "numeric",
          month: "long",
          hour: "2-digit",
          minute: "2-digit",
        }),
        city: q.city,
        description: q.description,
        location_hint: q.location_hint,
        attendee_count: q.attendee_count || 0,
        max_attendees: q.max_attendees,
        is_creator: isCreator,
        is_attending: q.is_attending || false,
        creator_name: q.creator?.name || null,
      };
    });

    return {
      quedadas: quedadasContext,
      profile: profile ? {
        name: profile.name,
        city: profile.city,
      } : null,
    };
  }, [quedadas, profile]);

  const sendMessage = useCallback(async (input: string) => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setError(null);

    let assistantContent = "";

    try {
      const context = buildContext();
      
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ 
          messages: [...messages, userMsg],
          context,
        }),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al conectar con el asistente");
      }

      if (!resp.body) {
        throw new Error("No se recibió respuesta");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      // Add empty assistant message
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = { role: "assistant", content: assistantContent };
                return newMessages;
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (err) {
      console.error("AI Chat error:", err);
      setError(err instanceof Error ? err.message : "Error desconocido");
      // Remove the empty assistant message if error
      setMessages(prev => prev.filter((_, i) => i !== prev.length - 1 || prev[i].content !== ""));
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, buildContext]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat,
  };
};
