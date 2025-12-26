import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Send, Flame, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useGhostMessageLimit, useHasSparkWith } from "@/hooks/useSparks";
import { useSparkDetection } from "@/hooks/useSparkDetection";
import { sendPushNotification } from "@/utils/pushNotifications";
import { toast } from "sonner";

// Ghost message options
const GHOST_MESSAGES = [
  "Me gustó tu vibra.",
  "Algo me dice que conectamos.",
  "Curiosidad.",
  "Ojalá coincidamos.",
];

interface TargetProfile {
  id: string;
  name: string | null;
  vibe: string | null;
}

const Chat = () => {
  const navigate = useNavigate();
  const { profileId } = useParams<{ profileId: string }>();
  const { data: myProfile } = useProfile();
  const { data: limitData } = useGhostMessageLimit();
  const hasSpark = useHasSparkWith(profileId);
  const { sparkDetected, sparkChatId, checkForNewSpark } = useSparkDetection();
  
  const [targetProfile, setTargetProfile] = useState<TargetProfile | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [newSparkCreated, setNewSparkCreated] = useState(false);
  const [newSparkChatId, setNewSparkChatId] = useState<string | null>(null);
  const [alreadySent, setAlreadySent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Load target profile and check if already sent
  useEffect(() => {
    const loadData = async () => {
      if (!profileId || !myProfile) return;

      try {
        // Get target profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, name, vibe")
          .eq("id", profileId)
          .maybeSingle();

        setTargetProfile(profile);

        // Check if already sent message
        const { data: existingMessage } = await supabase
          .from("ghost_messages")
          .select("id")
          .eq("from_profile_id", myProfile.id)
          .eq("to_profile_id", profileId)
          .maybeSingle();

        setAlreadySent(!!existingMessage);
      } catch (error) {
        console.error("Error loading chat:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [profileId, myProfile]);

  // If there's already a spark, redirect to the spark chat
  useEffect(() => {
    if (hasSpark && profileId) {
      navigate("/sparks");
    }
  }, [hasSpark, profileId, navigate]);

  // Listen for realtime spark detection
  useEffect(() => {
    if (sparkDetected && sparkChatId && sent) {
      setNewSparkCreated(true);
      setNewSparkChatId(sparkChatId);
    }
  }, [sparkDetected, sparkChatId, sent]);

  const handleSend = async () => {
    if (!selectedMessage || !myProfile || !profileId) return;

    // Check daily limit
    if (!limitData?.canSend) {
      toast.error("Has alcanzado el límite de 5 mensajes hoy");
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase.from("ghost_messages").insert({
        from_profile_id: myProfile.id,
        to_profile_id: profileId,
        content: selectedMessage,
      });

      if (error) {
        if (error.code === "23505") {
          toast.error("Ya enviaste un mensaje a esta persona");
        } else {
          throw error;
        }
      } else {
        setSent(true);
        
        // Wait a moment for the database trigger to execute, then check for spark
        setTimeout(async () => {
          const sparkCreated = await checkForNewSpark(profileId);
          
          if (sparkCreated) {
            setNewSparkCreated(true);
            // Send push notification to the other person about the match
            sendPushNotification({
              profileId: profileId,
              title: "🔥 ¡Nueva chispa!",
              body: `${myProfile.name || "Alguien"} y tú habéis conectado`,
              url: "/sparks",
              tag: "new-spark",
            });
          }
        }, 500);
      }
    } catch (error: any) {
      toast.error("Error al enviar: " + error.message);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (!targetProfile) {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <p className="font-body text-muted-foreground mb-4">Perfil no encontrado</p>
        <Button variant="kiki-soft" onClick={() => navigate("/presence")}>
          Volver a presencia
        </Button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background flex flex-col px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={() => navigate("/presence")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-body"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Presencia</span>
        </button>
        <span className="font-display text-xl font-bold text-foreground">KIKI</span>
        <div className="w-20" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
        {alreadySent ? (
          /* Already sent message */
          <div className="text-center animate-fade-up">
            <div className="w-20 h-20 rounded-full bg-card mx-auto mb-4" />
            <h2 className="font-display text-2xl font-bold text-foreground mb-3">
              {targetProfile.name || "Anónima"}
            </h2>
            <p className="font-body text-muted-foreground mb-8 max-w-xs">
              Ya le enviaste un mensaje fantasma.
              <br />
              Si hay chispa, lo sabrás.
            </p>
            <Button 
              variant="kiki-soft" 
              size="lg"
              onClick={() => navigate("/presence")}
            >
              Volver a presencia
            </Button>
          </div>
        ) : !sent ? (
          <>
            {/* Profile preview */}
            <div className="text-center mb-10 animate-fade-up">
              <div className="w-20 h-20 rounded-full bg-card mx-auto mb-4" />
              <h2 className="font-display text-2xl font-bold text-foreground mb-1">
                {targetProfile.name || "Anónima"}
              </h2>
              <p className="font-body text-muted-foreground text-sm">
                Vibra {targetProfile.vibe?.toLowerCase() || "misteriosa"}
              </p>
            </div>

            {/* Ghost message intro */}
            <div className="text-center mb-8 animate-fade-up animate-delay-100">
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                Mensaje fantasma
              </h3>
              <p className="font-body text-sm text-muted-foreground max-w-xs">
                Elige uno. Solo puedes enviar un mensaje.
                <br />
                No hay presión. No hay respuesta obligatoria.
              </p>
            </div>

            {/* Daily limit indicator */}
            <div className="mb-6 animate-fade-up animate-delay-100">
              <span className="font-body text-xs text-muted-foreground/60">
                {limitData?.remaining || 0} mensajes restantes hoy
              </span>
            </div>

            {/* Message options */}
            <div className="w-full space-y-3 mb-10 animate-fade-up animate-delay-200">
              {GHOST_MESSAGES.map((msg) => (
                <button
                  key={msg}
                  onClick={() => setSelectedMessage(msg)}
                  disabled={!limitData?.canSend}
                  className={`w-full p-4 rounded-xl font-body text-left transition-all ${
                    selectedMessage === msg
                      ? "bg-card text-card-foreground scale-[1.02]"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
                  } ${!limitData?.canSend ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  "{msg}"
                </button>
              ))}
            </div>

            {/* Send button */}
            <Button 
              variant="kiki" 
              size="lg"
              onClick={handleSend}
              disabled={!selectedMessage || sending || !limitData?.canSend}
              className="w-full animate-fade-up animate-delay-300"
            >
              <Send className="w-4 h-4 mr-2" />
              {sending ? "Enviando..." : "Enviar mensaje fantasma"}
            </Button>

            {/* Note */}
            <p className="font-body text-xs text-muted-foreground/60 text-center mt-6 animate-fade-up animate-delay-400">
              Un mensaje por persona. Máx 5 al día. Sin notificación.
            </p>
          </>
        ) : newSparkCreated ? (
          /* SPARK CREATED - Mutual match celebration! */
          <div className="text-center animate-fade-up">
            {/* Celebration animation */}
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 bg-primary/30 blur-3xl rounded-full animate-pulse-soft" />
              <div className="absolute inset-0 bg-accent/20 blur-2xl rounded-full animate-pulse-soft animate-delay-200" />
              <div className="relative w-full h-full rounded-full bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center ring-4 ring-primary/30 ring-offset-4 ring-offset-background">
                <Flame className="w-12 h-12 text-primary animate-spark-flame" />
              </div>
              <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-primary animate-bounce" />
              <Sparkles className="absolute -bottom-1 -left-3 w-5 h-5 text-accent animate-bounce animate-delay-200" />
              <Sparkles className="absolute top-0 left-0 w-4 h-4 text-primary/60 animate-bounce animate-delay-300" />
            </div>
            
            <h2 className="font-display text-3xl font-bold text-foreground mb-3">
              ¡Chispa mutua!
            </h2>
            <p className="font-body text-muted-foreground mb-2">
              {targetProfile?.name || "Esta persona"} también te envió un mensaje.
            </p>
            <p className="font-body text-sm text-primary mb-8">
              Ahora podéis chatear.
            </p>
            
            <div className="space-y-3">
              <Button 
                variant="kiki" 
                size="lg"
                onClick={() => navigate(newSparkChatId ? `/spark/${newSparkChatId}` : "/sparks")}
                className="w-full"
              >
                <Flame className="w-4 h-4 mr-2" />
                Ir al chat
              </Button>
              <Button 
                variant="kiki-soft" 
                size="lg"
                onClick={() => navigate("/presence")}
                className="w-full"
              >
                Volver a presencia
              </Button>
            </div>
          </div>
        ) : (
          /* Sent confirmation - waiting for potential match */
          <div className="text-center animate-fade-up">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
              <Send className="w-6 h-6 text-primary" />
            </div>
            <h2 className="font-display text-2xl font-bold text-foreground mb-3">
              Enviado
            </h2>
            <p className="font-body text-muted-foreground mb-8 max-w-xs">
              Tu mensaje fantasma ha volado.
              <br />
              Si hay chispa, la verás en <Flame className="w-4 h-4 inline text-primary" />
            </p>
            <Button 
              variant="kiki-soft" 
              size="lg"
              onClick={() => navigate("/presence")}
            >
              Volver a presencia
            </Button>
          </div>
        )}
      </div>
    </main>
  );
};

export default Chat;
