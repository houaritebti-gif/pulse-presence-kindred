import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, Flame, X, Sparkles } from "lucide-react";
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
        <div className="relative">
          <Flame className="w-12 h-12 text-primary animate-spark-flame" />
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Ambient glow background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
      
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-border/20 backdrop-blur-sm bg-background/80">
        <button 
          onClick={() => navigate("/sparks")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all duration-300 font-body group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        </button>
        
        <div className="flex items-center gap-3 animate-fade-up">
          {/* Avatar with glow ring */}
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-card overflow-hidden flex-shrink-0 ring-2 ring-primary/30 ring-offset-2 ring-offset-background">
              {chat.other_profile?.avatar_url ? (
                <img 
                  src={chat.other_profile.avatar_url} 
                  alt={chat.other_profile.name || "Avatar"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-card-foreground font-display text-sm bg-gradient-to-br from-primary/20 to-accent/20">
                  {(chat.other_profile?.name?.[0] || "?").toUpperCase()}
                </div>
              )}
            </div>
            {/* Spark indicator */}
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-background flex items-center justify-center">
              <Flame className="w-3 h-3 text-primary animate-spark-flame" />
            </div>
          </div>
          
          <div className="text-center">
            <span className="font-display font-semibold text-foreground block">
              {chat.other_profile?.name || "Anónima"}
            </span>
            <span className="font-body text-xs text-primary/80">
              Chispa activa
            </span>
          </div>
        </div>

        <button
          onClick={() => setShowExtinguishConfirm(true)}
          className="text-muted-foreground/50 hover:text-destructive transition-all duration-300 hover:rotate-90"
          title="Apagar chispa"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 relative z-10">
        {messages?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 animate-fade-up">
            {/* Animated spark illustration */}
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full animate-pulse-soft" />
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center">
                <Flame className="w-10 h-10 text-primary animate-spark-flame" />
              </div>
              <Sparkles className="absolute -top-2 -right-2 w-5 h-5 text-primary/60 animate-pulse-soft" />
              <Sparkles className="absolute -bottom-1 -left-3 w-4 h-4 text-accent/60 animate-pulse-soft animate-delay-200" />
            </div>
            
            <h3 className="font-display text-lg font-semibold text-foreground mb-2">
              ¡Hay chispa!
            </h3>
            <p className="font-body text-muted-foreground text-sm text-center max-w-[200px]">
              Algo especial os conecta. Empezad a hablar.
            </p>
          </div>
        ) : (
          messages?.map((msg, index) => {
            const isOwn = msg.sender_profile_id === profile?.id;
            const showAvatar = !isOwn && (index === 0 || messages[index - 1]?.sender_profile_id === profile?.id);
            
            return (
              <div
                key={msg.id}
                className={`flex items-end gap-2 ${isOwn ? "justify-end" : "justify-start"} ${
                  isOwn ? "animate-message-right" : "animate-message-left"
                }`}
                style={{ animationDelay: `${Math.min(index * 50, 300)}ms` }}
              >
                {/* Other user avatar */}
                {!isOwn && (
                  <div className={`w-6 h-6 rounded-full overflow-hidden flex-shrink-0 ${showAvatar ? "opacity-100" : "opacity-0"}`}>
                    {chat.other_profile?.avatar_url ? (
                      <img 
                        src={chat.other_profile.avatar_url} 
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-card flex items-center justify-center text-card-foreground font-display text-[10px]">
                        {(chat.other_profile?.name?.[0] || "?").toUpperCase()}
                      </div>
                    )}
                  </div>
                )}
                
                <div
                  className={`max-w-[75%] px-4 py-3 font-body text-sm leading-relaxed transition-all duration-200 ${
                    isOwn
                      ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md shadow-lg shadow-primary/20"
                      : "bg-card text-card-foreground rounded-2xl rounded-bl-md"
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
      <form onSubmit={handleSend} className="relative z-10 px-6 py-4 border-t border-border/20 backdrop-blur-sm bg-background/80">
        <div className="flex gap-3 items-center">
          <div className="flex-1 relative">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Escribe algo..."
              className="h-12 font-body bg-card/50 border-border/30 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 pr-4 pl-4 rounded-xl transition-all duration-300"
            />
            {newMessage.length > 0 && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Sparkles className="w-4 h-4 text-primary/40 animate-pulse-soft" />
              </div>
            )}
          </div>
          <Button
            type="submit"
            variant="kiki"
            size="icon"
            className="h-12 w-12 rounded-xl shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
            disabled={!newMessage.trim() || sendMessage.isPending}
          >
            <Send className={`w-4 h-4 transition-transform duration-200 ${newMessage.trim() ? "translate-x-0.5" : ""}`} />
          </Button>
        </div>
      </form>

      {/* Extinguish confirmation modal */}
      {showExtinguishConfirm && (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-md flex items-center justify-center p-6 z-50">
          <div className="bg-card rounded-3xl p-8 max-w-sm w-full animate-fade-up shadow-2xl border border-border/20">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                  <Flame className="w-8 h-8 text-destructive/60" />
                </div>
                <X className="absolute -top-1 -right-1 w-6 h-6 text-destructive bg-card rounded-full p-1" />
              </div>
            </div>
            
            <h3 className="font-display text-xl font-semibold text-card-foreground mb-3 text-center">
              ¿Apagar esta chispa?
            </h3>
            <p className="font-body text-sm text-card-foreground/60 mb-8 text-center leading-relaxed">
              La conversación desaparecerá para ti. Esta decisión es irreversible.
            </p>
            <div className="flex gap-3">
              <Button
                variant="kiki-soft"
                className="flex-1 h-12 rounded-xl"
                onClick={() => setShowExtinguishConfirm(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="kiki"
                className="flex-1 h-12 rounded-xl bg-destructive hover:bg-destructive/90"
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
