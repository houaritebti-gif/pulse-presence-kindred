import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Send } from "lucide-react";

// Ghost message options
const GHOST_MESSAGES = [
  "Me gustó tu vibra.",
  "Algo me dice que conectamos.",
  "Curiosidad.",
  "Ojalá coincidamos.",
];

const Chat = () => {
  const navigate = useNavigate();
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    if (selectedMessage) {
      setSent(true);
    }
  };

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
        {!sent ? (
          <>
            {/* Profile preview */}
            <div className="text-center mb-10 animate-fade-up">
              <div className="w-20 h-20 rounded-full bg-card mx-auto mb-4" />
              <h2 className="font-display text-2xl font-bold text-foreground mb-1">
                Luna
              </h2>
              <p className="font-body text-muted-foreground text-sm">
                Vibra misteriosa
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

            {/* Message options */}
            <div className="w-full space-y-3 mb-10 animate-fade-up animate-delay-200">
              {GHOST_MESSAGES.map((msg) => (
                <button
                  key={msg}
                  onClick={() => setSelectedMessage(msg)}
                  className={`w-full p-4 rounded-xl font-body text-left transition-all ${
                    selectedMessage === msg
                      ? "bg-card text-card-foreground scale-[1.02]"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
                  }`}
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
              disabled={!selectedMessage}
              className="w-full animate-fade-up animate-delay-300"
            >
              <Send className="w-4 h-4 mr-2" />
              Enviar mensaje fantasma
            </Button>

            {/* Note */}
            <p className="font-body text-xs text-muted-foreground/60 text-center mt-6 animate-fade-up animate-delay-400">
              Un mensaje al día. Sin notificación. Sin presión.
            </p>
          </>
        ) : (
          /* Sent confirmation */
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
        )}
      </div>
    </main>
  );
};

export default Chat;
