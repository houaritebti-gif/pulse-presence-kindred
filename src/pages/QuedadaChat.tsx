import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, Calendar, Users, MapPin, Clock, Sparkles, ImagePlus, Loader2, X } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useQuedada, useQuedadaMessages, useSendQuedadaMessage, useMarkQuedadaRead } from "@/hooks/useQuedadas";
import { useChatImageUpload } from "@/hooks/useChatImageUpload";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import ImageLightbox from "@/components/ImageLightbox";

const QuedadaChat = () => {
  const navigate = useNavigate();
  const { quedadaId } = useParams<{ quedadaId: string }>();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: quedada, isLoading: quedadaLoading } = useQuedada(quedadaId);
  const { data: messages, isLoading: messagesLoading } = useQuedadaMessages(quedadaId);
  const sendMessage = useSendQuedadaMessage();
  const markRead = useMarkQuedadaRead();
  
  // Image upload
  const { uploadImage, isUploading } = useChatImageUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [newMessage, setNewMessage] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mark as read when entering chat
  useEffect(() => {
    if (quedadaId && quedada) {
      markRead.mutate(quedadaId);
    }
  }, [quedadaId, quedada]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedFile) || !quedadaId || !quedada) return;

    // Get all profile IDs who should receive the notification (creator + attendees)
    const recipientIds: string[] = [];
    if (quedada.creator?.id) {
      recipientIds.push(quedada.creator.id);
    }
    if (quedada.quedada_attendees) {
      quedada.quedada_attendees.forEach((a: { profile_id: string }) => {
        if (!recipientIds.includes(a.profile_id)) {
          recipientIds.push(a.profile_id);
        }
      });
    }

    try {
      let messageContent = newMessage.trim();
      
      // If there's an image to upload
      if (selectedFile && user?.id) {
        const imageUrl = await uploadImage(selectedFile, user.id);
        if (imageUrl) {
          messageContent = imageUrl;
        } else {
          return; // Upload failed, don't send message
        }
      }
      
      if (!messageContent) return;
      
      await sendMessage.mutateAsync({ 
        quedadaId, 
        content: messageContent,
        recipientProfileIds: recipientIds,
        quedadaTitle: quedada.title,
      });
      setNewMessage("");
      setSelectedFile(null);
      setImagePreview(null);
    } catch (error: any) {
      toast.error("Error al enviar: " + error.message);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten imágenes");
      return;
    }
    
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error("La imagen es demasiado grande (máx. 5MB)");
      return;
    }
    
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const clearImagePreview = () => {
    setSelectedFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Helper function to check if content is an image URL
  const isImageMessage = (content: string) => {
    return content.includes("chat-images") && (
      content.includes(".jpg") || 
      content.includes(".jpeg") || 
      content.includes(".png") || 
      content.includes(".gif") || 
      content.includes(".webp")
    );
  };

  const formatEventDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, "EEEE d 'de' MMMM", { locale: es });
  };

  const formatEventTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, "HH:mm");
  };

  if (quedadaLoading || !quedada) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="relative">
          <Calendar className="w-12 h-12 text-accent animate-pulse-soft" />
          <div className="absolute inset-0 bg-accent/20 blur-xl rounded-full" />
        </div>
      </main>
    );
  }

  // Check if user can access this chat (is creator or attendee)
  const canAccess = quedada.is_creator || quedada.is_attending;
  
  if (!canAccess) {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <Calendar className="w-12 h-12 text-muted-foreground/30 mb-4" />
        <h2 className="font-display text-xl font-semibold text-foreground mb-2">
          No tienes acceso
        </h2>
        <p className="font-body text-muted-foreground text-center mb-6">
          Únete a esta quedada para acceder al chat grupal.
        </p>
        <Button variant="kiki" onClick={() => navigate("/quedadas")}>
          Volver a quedadas
        </Button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-accent/5 blur-[100px] rounded-full pointer-events-none" />
      
      {/* Header */}
      <div className="relative z-10 border-b border-border/20 backdrop-blur-sm bg-background/80">
        <div className="flex items-center justify-between px-6 py-4">
          <button 
            onClick={() => navigate("/quedadas")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all duration-300 font-body group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          </button>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-accent" />
            </div>
            <span className="font-display font-semibold text-foreground">
              {quedada.title}
            </span>
          </div>

          <div className="flex items-center gap-1 text-muted-foreground">
            <Users className="w-4 h-4" />
            <span className="font-body text-xs">{quedada.attendee_count}</span>
          </div>
        </div>
        
        {/* Event info bar */}
        <div className="px-6 pb-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span className="capitalize">{formatEventDate(quedada.event_date)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{formatEventTime(quedada.event_date)}h</span>
          </div>
          {quedada.location_hint && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span>{quedada.location_hint}</span>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 relative z-10">
        {messagesLoading ? (
          <div className="flex justify-center py-12">
            <Calendar className="w-8 h-8 text-accent animate-pulse-soft" />
          </div>
        ) : messages?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 animate-fade-up">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-accent/30 blur-2xl rounded-full animate-pulse-soft" />
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-accent/20 to-primary/10 flex items-center justify-center">
                <Users className="w-10 h-10 text-accent" />
              </div>
              <Sparkles className="absolute -top-2 -right-2 w-5 h-5 text-accent/60 animate-pulse-soft" />
            </div>
            
            <h3 className="font-display text-lg font-semibold text-foreground mb-2">
              Chat grupal
            </h3>
            <p className="font-body text-muted-foreground text-sm text-center max-w-[220px]">
              Coordinad los detalles de la quedada aquí.
            </p>
          </div>
        ) : (
          messages?.map((msg, index) => {
            const isOwn = msg.sender_profile_id === profile?.id;
            const showAvatar = !isOwn && (index === 0 || messages[index - 1]?.sender_profile_id !== msg.sender_profile_id);
            const showName = !isOwn && showAvatar;
            
            return (
              <div
                key={msg.id}
                className={`flex items-end gap-2 ${isOwn ? "justify-end" : "justify-start"} ${
                  isOwn ? "animate-message-right" : "animate-message-left"
                }`}
                style={{ animationDelay: `${Math.min(index * 30, 200)}ms` }}
              >
                {!isOwn && (
                  <div className={`w-6 h-6 rounded-full overflow-hidden flex-shrink-0 ${showAvatar ? "opacity-100" : "opacity-0"}`}>
                    {msg.sender?.avatar_url ? (
                      <img src={msg.sender.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-card flex items-center justify-center text-card-foreground font-display text-[10px]">
                        {(msg.sender?.name?.[0] || "?").toUpperCase()}
                      </div>
                    )}
                  </div>
                )}
                
                <div className={`max-w-[75%] ${isOwn ? "" : ""}`}>
                  {showName && (
                    <p className="font-body text-[10px] text-muted-foreground mb-1 ml-1">
                      {msg.sender?.name || "Anónima"}
                    </p>
                  )}
                  <div
                    className={`font-body text-sm leading-relaxed ${
                      isOwn
                        ? "rounded-2xl rounded-br-md shadow-lg shadow-accent/20"
                        : "rounded-2xl rounded-bl-md"
                    } ${isImageMessage(msg.content) ? "p-1" : "px-4 py-3"} ${
                      isOwn && !isImageMessage(msg.content)
                        ? "bg-accent text-accent-foreground"
                        : !isOwn && !isImageMessage(msg.content)
                        ? "bg-card text-card-foreground"
                        : ""
                    }`}
                  >
                    {isImageMessage(msg.content) ? (
                      <img 
                        src={msg.content} 
                        alt="Imagen compartida"
                        className="max-w-full max-h-64 rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setLightboxImage(msg.content)}
                      />
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Image preview */}
      {imagePreview && (
        <div className="relative z-10 px-6 py-2 border-t border-border/20 backdrop-blur-sm bg-background/80">
          <div className="relative inline-block">
            <img 
              src={imagePreview} 
              alt="Vista previa"
              className="h-20 rounded-lg object-cover"
            />
            <button
              type="button"
              onClick={clearImagePreview}
              className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/90 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSend} className="relative z-10 px-6 py-4 border-t border-border/20 backdrop-blur-sm bg-background/80">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />
        
        <div className="flex gap-3 items-center">
          {/* Image button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="h-12 w-12 rounded-xl bg-card/50 border border-border/30 flex items-center justify-center text-muted-foreground hover:text-accent hover:border-accent/50 transition-all duration-300 disabled:opacity-50"
          >
            {isUploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ImagePlus className="w-5 h-5" />
            )}
          </button>
          
          <div className="flex-1 relative">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={selectedFile ? "Añade un mensaje..." : "Escribe algo..."}
              className="h-12 font-body bg-card/50 border-border/30 focus:border-accent/50 focus:ring-2 focus:ring-accent/20 pr-4 pl-4 rounded-xl transition-all duration-300"
            />
          </div>
          <Button
            type="submit"
            size="icon"
            className="h-12 w-12 rounded-xl bg-accent hover:bg-accent/90 shadow-lg shadow-accent/30 hover:shadow-accent/50 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
            disabled={(!newMessage.trim() && !selectedFile) || sendMessage.isPending || isUploading}
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </form>

      {/* Lightbox */}
      <ImageLightbox 
        imageUrl={lightboxImage} 
        onClose={() => setLightboxImage(null)} 
      />
    </main>
  );
};

export default QuedadaChat;
