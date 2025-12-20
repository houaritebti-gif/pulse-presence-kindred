import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, Flame, X } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useSparkChats, useChatMessages, useSendMessage, useExtinguishSpark } from "@/hooks/useSparks";
import { toast } from "sonner";

const SparkChat = () => {
  const navigate = useNavigate();
  const { chatId } = useParams<{ chatId: string }>();
  const { data: profile } = useProfile();
  const { data: chats } = useSparkChats();
  const { data: messages, isLoading } = useChatMessages(chatId);
  const sendMessage = useSendMessage();
  const extinguishSpark = useExtinguishSpark();
  
  const [newMessage, setNewMessage] = useState("");
  const [showExtinguishConfirm, setShowExtinguishConfirm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Find current chat
  const chat = chats?.find(c => c.id === chatId);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatId) return;

    try {
      await sendMessage.mutateAsync({ chatId, content: newMessage.trim() });
      setNewMessage("");
    } catch (error: any) {
      toast.error("Error al enviar: " + error.message);
    }
  };

  const handleExtinguish = async () => {
    if (!chatId) return;

    try {
      await extinguishSpark.mutateAsync(chatId);
      toast.success("Chispa apagada");
      navigate("/sparks");
    } catch (error: any) {
      toast.error("Error: " + error.message);
    }
  };

  if (isLoading || !chat) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
        <button 
          onClick={() => navigate("/sparks")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-body"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-card-foreground/10 overflow-hidden flex-shrink-0">
            {chat.other_profile?.avatar_url ? (
              <img 
                src={chat.other_profile.avatar_url} 
                alt={chat.other_profile.name || "Avatar"}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-card-foreground/40 font-display text-sm">
                {(chat.other_profile?.name?.[0] || "?").toUpperCase()}
              </div>
            )}
          </div>
          <Flame className="w-4 h-4 text-primary" />
          <span className="font-display font-semibold text-foreground">
            {chat.other_profile?.name || "Anónima"}
          </span>
        </div>

        <button
          onClick={() => setShowExtinguishConfirm(true)}
          className="text-muted-foreground hover:text-destructive transition-colors"
          title="Apagar chispa"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {messages?.length === 0 ? (
          <div className="text-center py-12">
            <Flame className="w-8 h-8 text-primary mx-auto mb-4 animate-pulse-soft" />
            <p className="font-body text-muted-foreground text-sm">
              ¡Hay chispa! Empezad a hablar.
            </p>
          </div>
        ) : (
          messages?.map((msg) => {
            const isOwn = msg.sender_profile_id === profile?.id;
            return (
              <div
                key={msg.id}
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl font-body text-sm ${
                    isOwn
                      ? "bg-card text-card-foreground rounded-br-sm"
                      : "bg-secondary text-secondary-foreground rounded-bl-sm"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="px-6 py-4 border-t border-border/30">
        <div className="flex gap-3">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Escribe algo..."
            className="flex-1 h-12 font-body bg-secondary/50 border-border/50 focus:border-primary"
          />
          <Button
            type="submit"
            variant="kiki"
            size="icon"
            className="h-12 w-12"
            disabled={!newMessage.trim() || sendMessage.isPending}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>

      {/* Extinguish confirmation modal */}
      {showExtinguishConfirm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-card rounded-2xl p-6 max-w-sm w-full animate-fade-up">
            <h3 className="font-display text-lg font-semibold text-card-foreground mb-2">
              ¿Apagar esta chispa?
            </h3>
            <p className="font-body text-sm text-card-foreground/70 mb-6">
              La conversación desaparecerá para ti. No hay vuelta atrás.
            </p>
            <div className="flex gap-3">
              <Button
                variant="kiki-soft"
                className="flex-1"
                onClick={() => setShowExtinguishConfirm(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="kiki"
                className="flex-1"
                onClick={handleExtinguish}
              >
                Apagar
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default SparkChat;
