import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, Flame, X, Sparkles, User, MoreVertical, Flag, Ban, Trash2, Pencil, Check, CheckCheck, ImagePlus, Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useProfile } from "@/hooks/useProfile";
import { useSparkChats, useChatMessages, useSendMessage, useExtinguishSpark, useMarkSparkRead, useDeleteMessage, useEditMessage, useOtherUserReadStatus } from "@/hooks/useSparks";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";
import { useChatImageUpload } from "@/hooks/useChatImageUpload";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import UserModerationModal from "@/components/UserModerationModal";
import ImageLightbox from "@/components/ImageLightbox";
import VoiceMessagePlayer from "@/components/VoiceMessagePlayer";
import VoiceRecordButton from "@/components/VoiceRecordButton";
import { useAuth } from "@/contexts/AuthContext";

const SparkChat = () => {
  const navigate = useNavigate();
  const { chatId } = useParams<{ chatId: string }>();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: chats } = useSparkChats();
  const { data: messages, isLoading } = useChatMessages(chatId);
  const sendMessage = useSendMessage();
  const extinguishSpark = useExtinguishSpark();
  const markRead = useMarkSparkRead();
  const deleteMessage = useDeleteMessage();
  const editMessage = useEditMessage();
  
  // Find current chat
  const chat = chats?.find(c => c.id === chatId);
  
  // Get the other user's read status
  const { data: otherUserLastRead } = useOtherUserReadStatus(chatId, chat?.other_profile?.id);
  
  // Typing indicator
  const { isOtherTyping, handleTyping, stopTyping } = useTypingIndicator(chatId, chat?.other_profile?.id);
  
  // Image upload
  const { uploadImage, isUploading: isUploadingImage } = useChatImageUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Voice recording
  const { 
    isRecording, 
    isUploading: isUploadingVoice, 
    formattedDuration,
    startRecording,
    stopRecording,
    cancelRecording,
    uploadAudio,
  } = useVoiceRecorder();
  
  const isUploading = isUploadingImage || isUploadingVoice;
  
  const [newMessage, setNewMessage] = useState("");
  const [showExtinguishConfirm, setShowExtinguishConfirm] = useState(false);
  const [showModerationModal, setShowModerationModal] = useState(false);
  const [moderationMode, setModerationMode] = useState<"block" | "report">("block");
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<{ id: string; content: string } | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark chat as read when entering and when new messages arrive
  useEffect(() => {
    if (chatId && chat) {
      markRead.mutate(chatId);
    }
  }, [chatId, chat, messages?.length]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedFile) || !chatId || !chat) return;

    stopTyping(); // Stop typing indicator on send
    
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
        chatId, 
        content: messageContent,
        recipientProfileId: chat.other_profile?.id,
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

  // Helper function to check if content is a voice message URL
  const isVoiceMessage = (content: string) => {
    return content.includes("chat-audio") && (
      content.includes(".webm") || 
      content.includes(".mp4") || 
      content.includes(".m4a") ||
      content.includes(".ogg")
    );
  };

  const handleStopRecording = async () => {
    const blob = await stopRecording();
    if (!blob || !user?.id || !chatId || !chat) return;
    
    const audioUrl = await uploadAudio(blob, user.id);
    if (audioUrl) {
      try {
        await sendMessage.mutateAsync({ 
          chatId, 
          content: audioUrl,
          recipientProfileId: chat.other_profile?.id,
        });
      } catch (error: any) {
        toast.error("Error al enviar: " + error.message);
      }
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

  const handleDeleteMessage = async () => {
    if (!messageToDelete || !chatId) return;

    try {
      await deleteMessage.mutateAsync({ messageId: messageToDelete, chatId });
      toast.success("Mensaje eliminado");
      setMessageToDelete(null);
    } catch (error: any) {
      toast.error("Error al eliminar: " + error.message);
    }
  };

  const handleEditMessage = async () => {
    if (!editingMessage || !chatId || !editingMessage.content.trim()) return;

    try {
      await editMessage.mutateAsync({ 
        messageId: editingMessage.id, 
        chatId, 
        content: editingMessage.content.trim() 
      });
      toast.success("Mensaje editado");
      setEditingMessage(null);
    } catch (error: any) {
      toast.error("Error al editar: " + error.message);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="relative">
          <Flame className="w-12 h-12 text-primary animate-spark-flame" />
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
        </div>
      </main>
    );
  }

  if (!chat) {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <div className="relative w-20 h-20 mb-6">
          <div className="w-full h-full rounded-full bg-card/50 flex items-center justify-center">
            <Flame className="w-8 h-8 text-muted-foreground/30" />
          </div>
        </div>
        <h2 className="font-display text-xl font-semibold text-foreground mb-2">
          Chat no encontrado
        </h2>
        <p className="font-body text-muted-foreground text-center mb-6 max-w-[240px]">
          Este chat ya no existe o no tienes acceso a él.
        </p>
        <Button variant="kiki-soft" onClick={() => navigate("/sparks")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a chispas
        </Button>
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
        
        <button 
          onClick={() => chat.other_profile?.id && navigate(`/user/${chat.other_profile.id}`)}
          className="flex items-center gap-3 animate-fade-up hover:opacity-80 transition-opacity"
        >
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
          
          <div className="text-left">
            <span className="font-display font-semibold text-foreground block">
              {chat.other_profile?.name || "Anónima"}
            </span>
            <span className="font-body text-xs text-primary/80 flex items-center gap-1">
              <User className="w-3 h-3" />
              Ver perfil
            </span>
          </div>
        </button>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-muted-foreground/50 hover:text-foreground transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
            </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={() => {
                setModerationMode("report");
                setShowModerationModal(true);
              }}
              className="gap-2 text-muted-foreground"
            >
              <Flag className="w-4 h-4" />
              Reportar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setModerationMode("block");
                setShowModerationModal(true);
              }}
              className="gap-2 text-destructive"
            >
              <Ban className="w-4 h-4" />
              Bloquear
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setShowExtinguishConfirm(true)}
              className="gap-2 text-muted-foreground"
            >
              <X className="w-4 h-4" />
              Apagar chispa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
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
            const isEditing = editingMessage?.id === msg.id;
            
            return (
              <div
                key={msg.id}
                className={`flex items-end gap-2 group ${isOwn ? "justify-end" : "justify-start"} ${
                  isOwn ? "animate-message-right" : "animate-message-left"
                }`}
                style={{ animationDelay: `${Math.min(index * 50, 300)}ms` }}
              >
                {/* Action buttons for own messages */}
                {isOwn && !isEditing && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditingMessage({ id: msg.id, content: msg.content })}
                      className="p-1.5 rounded-full hover:bg-primary/10 text-muted-foreground/50 hover:text-primary"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setMessageToDelete(msg.id)}
                      className="p-1.5 rounded-full hover:bg-destructive/10 text-muted-foreground/50 hover:text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                
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
                
                {isEditing ? (
                  <div className="flex items-center gap-2 max-w-[75%]">
                    <Input
                      value={editingMessage.content}
                      onChange={(e) => setEditingMessage({ ...editingMessage, content: e.target.value })}
                      className="h-10 font-body bg-card text-foreground border-primary/30 focus:border-primary rounded-xl"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleEditMessage();
                        }
                        if (e.key === "Escape") {
                          setEditingMessage(null);
                        }
                      }}
                    />
                    <button
                      onClick={handleEditMessage}
                      disabled={editMessage.isPending}
                      className="p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingMessage(null)}
                      className="p-2 rounded-full bg-card text-card-foreground hover:bg-card/80 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className={`flex items-end gap-1.5 ${isOwn ? "flex-row" : "flex-row-reverse"}`}>
                    {isVoiceMessage(msg.content) ? (
                      <VoiceMessagePlayer audioUrl={msg.content} isOwn={isOwn} />
                    ) : (
                      <div
                        className={`max-w-[75%] font-body text-sm leading-relaxed transition-all duration-200 ${
                          isOwn
                            ? "rounded-2xl rounded-br-md shadow-lg shadow-primary/20"
                            : "rounded-2xl rounded-bl-md"
                        } ${isImageMessage(msg.content) ? "p-1" : "px-4 py-3"} ${
                          isOwn && !isImageMessage(msg.content)
                            ? "bg-primary text-primary-foreground"
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
                          <>
                            <span>{msg.content}</span>
                            {msg.updated_at && (
                              <span className={`text-[10px] ml-2 ${isOwn ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                                (editado)
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    )}
                    {/* Read indicator for own messages */}
                    {isOwn && (
                      <div className="flex-shrink-0 mb-0.5">
                        {otherUserLastRead && new Date(msg.created_at) <= otherUserLastRead ? (
                          <CheckCheck className="w-4 h-4 text-primary/70" />
                        ) : (
                          <Check className="w-4 h-4 text-muted-foreground/50" />
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
        
        {/* Typing indicator */}
        {isOtherTyping && (
          <div className="flex items-center gap-2 animate-fade-up">
            <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
              {chat?.other_profile?.avatar_url ? (
                <img 
                  src={chat.other_profile.avatar_url} 
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-card flex items-center justify-center text-card-foreground font-display text-[10px]">
                  {(chat?.other_profile?.name?.[0] || "?").toUpperCase()}
                </div>
              )}
            </div>
            <div className="px-4 py-3 bg-card rounded-2xl rounded-bl-md">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
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
          {/* Image button - hide when recording */}
          {!isRecording && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="h-12 w-12 rounded-xl bg-card/50 border border-border/30 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-all duration-300 disabled:opacity-50"
            >
              {isUploadingImage ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ImagePlus className="w-5 h-5" />
              )}
            </button>
          )}

          {/* Voice record button */}
          <VoiceRecordButton
            isRecording={isRecording}
            isUploading={isUploadingVoice}
            formattedDuration={formattedDuration}
            onStartRecording={startRecording}
            onStopRecording={handleStopRecording}
            onCancelRecording={cancelRecording}
          />
          
          {/* Text input - hide when recording */}
          {!isRecording && (
            <>
              <div className="flex-1 relative">
                <Input
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTyping();
                  }}
                  placeholder={selectedFile ? "Añade un mensaje..." : "Escribe algo..."}
                  className="h-12 font-body bg-card/50 text-foreground border-border/30 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 pr-4 pl-4 rounded-xl transition-all duration-300 placeholder:text-muted-foreground"
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
                disabled={(!newMessage.trim() && !selectedFile) || sendMessage.isPending || isUploading}
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className={`w-4 h-4 transition-transform duration-200 ${(newMessage.trim() || selectedFile) ? "translate-x-0.5" : ""}`} />
                )}
              </Button>
            </>
          )}
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

      {/* Delete message confirmation modal */}
      {messageToDelete && (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-md flex items-center justify-center p-6 z-50">
          <div className="bg-card rounded-3xl p-8 max-w-sm w-full animate-fade-up shadow-2xl border border-border/20">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <Trash2 className="w-8 h-8 text-destructive/60" />
              </div>
            </div>
            
            <h3 className="font-display text-xl font-semibold text-card-foreground mb-3 text-center">
              ¿Eliminar mensaje?
            </h3>
            <p className="font-body text-sm text-card-foreground/60 mb-8 text-center leading-relaxed">
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <Button
                variant="kiki-soft"
                className="flex-1 h-12 rounded-xl"
                onClick={() => setMessageToDelete(null)}
              >
                Cancelar
              </Button>
              <Button
                variant="kiki"
                className="flex-1 h-12 rounded-xl bg-destructive hover:bg-destructive/90"
                onClick={handleDeleteMessage}
                disabled={deleteMessage.isPending}
              >
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Moderation Modal */}
      {showModerationModal && chat.other_profile?.id && (
        <UserModerationModal
          onClose={() => setShowModerationModal(false)}
          profileId={chat.other_profile.id}
          profileName={chat.other_profile.name || "Usuario"}
          initialMode={moderationMode}
        />
      )}

      {/* Lightbox */}
      <ImageLightbox 
        imageUrl={lightboxImage} 
        onClose={() => setLightboxImage(null)} 
      />
    </main>
  );
};

export default SparkChat;
