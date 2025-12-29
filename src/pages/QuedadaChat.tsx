import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, Calendar, Users, MapPin, Clock, Sparkles, ImagePlus, Loader2, X, EyeOff, UserX } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useProfile } from "@/hooks/useProfile";
import { useQuedada, useQuedadaMessages, useSendQuedadaMessage, useMarkQuedadaRead, useQuedadaAttendees, useExpelAttendee } from "@/hooks/useQuedadas";
import { useChatImageUpload } from "@/hooks/useChatImageUpload";
import { compressChatImage } from "@/utils/imageCompression";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { useOfflineQueue } from "@/hooks/useOfflineQueue";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import ImageLightbox from "@/components/ImageLightbox";
import UploadProgress from "@/components/UploadProgress";
import LazyImage from "@/components/LazyImage";
import VoiceMessagePlayer from "@/components/VoiceMessagePlayer";
import VoiceRecordButton from "@/components/VoiceRecordButton";
import OfflineMessageIndicator from "@/components/OfflineMessageIndicator";
import PendingMessage from "@/components/PendingMessage";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import PremiumBadge from "@/components/PremiumBadge";
import { useUserSubscription } from "@/hooks/useUserSubscription";
import QuedadaAttendeeItem from "@/components/QuedadaAttendeeItem";
import QuedadaMessageSender from "@/components/QuedadaMessageSender";

const QuedadaChat = () => {
  const navigate = useNavigate();
  const { quedadaId } = useParams<{ quedadaId: string }>();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: quedada, isLoading: quedadaLoading } = useQuedada(quedadaId);
  const { data: messages, isLoading: messagesLoading } = useQuedadaMessages(quedadaId);
  const { data: attendees } = useQuedadaAttendees(quedadaId);
  const sendMessage = useSendQuedadaMessage();
  const markRead = useMarkQuedadaRead();
  const expelAttendee = useExpelAttendee();
  
  // Subscription check for creator
  const { data: creatorTier } = useUserSubscription(quedada?.creator?.id);
  
  // Image upload
  const { uploadImage, isUploading: isUploadingImage, uploadPhase, uploadProgress } = useChatImageUpload();
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
  
  // Offline queue
  const { 
    isOnline, 
    queue, 
    pendingCount, 
    isSyncing, 
    setIsSyncing,
    addToQueue, 
    removeFromQueue,
    updateMessageStatus,
    markAsFailed,
    resetForRetry,
    getMessagesForChat,
    notifySyncSuccess,
    storeSupabaseConfigForSW,
    MAX_RETRIES,
  } = useOfflineQueue();
  
  // Store Supabase config for Service Worker background sync
  useEffect(() => {
    if (profile?.id) {
      storeSupabaseConfigForSW(profile.id);
    }
  }, [profile?.id, storeSupabaseConfigForSW]);
  
  const isUploading = isUploadingImage || isUploadingVoice;
  
  const [newMessage, setNewMessage] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isCompressingPreview, setIsCompressingPreview] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [showAttendees, setShowAttendees] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Get pending messages for this chat
  const pendingMessages = quedadaId ? getMessagesForChat(quedadaId, 'quedada') : [];

  // Mark as read when entering chat
  useEffect(() => {
    if (quedadaId && quedada) {
      markRead.mutate(quedadaId);
    }
  }, [quedadaId, quedada]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pendingMessages]);

  // Get recipient IDs for notifications
  const getRecipientIds = useCallback(() => {
    const recipientIds: string[] = [];
    if (quedada?.creator?.id) {
      recipientIds.push(quedada.creator.id);
    }
    if (quedada?.quedada_attendees) {
      quedada.quedada_attendees.forEach((a: { profile_id: string }) => {
        if (!recipientIds.includes(a.profile_id)) {
          recipientIds.push(a.profile_id);
        }
      });
    }
    return recipientIds;
  }, [quedada]);

  // Sync pending messages when coming back online
  const syncPendingMessages = useCallback(async () => {
    if (!quedadaId || !quedada) return;
    
    const pendingOnly = pendingMessages.filter(m => m.status === 'pending');
    if (pendingOnly.length === 0) return;
    
    // Check if app is in background for notification
    const isBackground = document.visibilityState === 'hidden';
    
    setIsSyncing(true);
    let successCount = 0;
    
    for (const queuedMsg of pendingOnly) {
      await updateMessageStatus(queuedMsg.id, 'sending');
      try {
        await sendMessage.mutateAsync({ 
          quedadaId: queuedMsg.chatId, 
          content: queuedMsg.content,
          recipientProfileIds: queuedMsg.metadata?.recipientProfileIds || [],
          quedadaTitle: queuedMsg.metadata?.quedadaTitle || '',
        });
        await removeFromQueue(queuedMsg.id);
        successCount++;
      } catch (error) {
        console.error('Failed to sync message:', error);
        await markAsFailed(queuedMsg.id);
      }
    }
    
    setIsSyncing(false);
    
    if (successCount > 0) {
      // Show toast if in foreground, browser notification if in background
      if (!isBackground) {
        toast.success(`${successCount} mensaje${successCount > 1 ? 's' : ''} enviado${successCount > 1 ? 's' : ''}`);
      }
      notifySyncSuccess(successCount, isBackground);
    }
  }, [quedadaId, quedada, pendingMessages, sendMessage, removeFromQueue, updateMessageStatus, markAsFailed, setIsSyncing, notifySyncSuccess]);

  // Retry a single message
  const handleRetryMessage = useCallback(async (queuedMsg: typeof pendingMessages[0]) => {
    if (!quedadaId || !quedada) return;
    
    await updateMessageStatus(queuedMsg.id, 'sending');
    
    try {
      await sendMessage.mutateAsync({ 
        quedadaId: queuedMsg.chatId, 
        content: queuedMsg.content,
        recipientProfileIds: queuedMsg.metadata?.recipientProfileIds || [],
        quedadaTitle: queuedMsg.metadata?.quedadaTitle || '',
      });
      await removeFromQueue(queuedMsg.id);
      toast.success("Mensaje enviado");
    } catch (error) {
      console.error('Failed to retry message:', error);
      await markAsFailed(queuedMsg.id);
      toast.error("Error al enviar el mensaje");
    }
  }, [quedadaId, quedada, sendMessage, removeFromQueue, updateMessageStatus, markAsFailed]);

  // Sync when coming back online
  useEffect(() => {
    const pendingOnly = pendingMessages.filter(m => m.status === 'pending');
    if (isOnline && pendingOnly.length > 0 && !isSyncing) {
      syncPendingMessages();
    }
  }, [isOnline, pendingMessages, isSyncing, syncPendingMessages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedFile) || !quedadaId || !quedada) return;

    const recipientIds = getRecipientIds();
    const messageContent = newMessage.trim();

    // If offline and no image, queue the message
    if (!isOnline && !selectedFile && messageContent) {
      await addToQueue({
        type: 'quedada',
        chatId: quedadaId,
        content: messageContent,
        metadata: {
          recipientProfileIds: recipientIds,
          quedadaTitle: quedada.title,
          senderProfileId: profile?.id,
        },
      });
      setNewMessage("");
      toast.info("Mensaje guardado. Se enviará al reconectar.");
      return;
    }

    try {
      let finalContent = messageContent;
      
      // If there's an image to upload
      if (selectedFile && user?.id) {
        const imageUrl = await uploadImage(selectedFile, user.id);
        if (imageUrl) {
          finalContent = imageUrl;
        } else {
          return; // Upload failed, don't send message
        }
      }
      
      if (!finalContent) return;
      
      await sendMessage.mutateAsync({ 
        quedadaId, 
        content: finalContent,
        recipientProfileIds: recipientIds,
        quedadaTitle: quedada.title,
      });
      setNewMessage("");
      setSelectedFile(null);
      setImagePreview(null);
    } catch (error: any) {
      // If send fails and it's a text message, queue it
      if (!selectedFile && messageContent) {
        addToQueue({
          type: 'quedada',
          chatId: quedadaId,
          content: messageContent,
          metadata: {
            recipientProfileIds: recipientIds,
            quedadaTitle: quedada.title,
          },
        });
        setNewMessage("");
        toast.info("Mensaje guardado. Se enviará al reconectar.");
      } else {
        toast.error("Error al enviar: " + error.message);
      }
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten imágenes");
      return;
    }
    
    const maxSize = 10 * 1024 * 1024; // 10MB before compression
    if (file.size > maxSize) {
      toast.error("La imagen es demasiado grande (máx. 10MB)");
      return;
    }
    
    setIsCompressingPreview(true);
    
    try {
      // Compress image before preview
      const compressedFile = await compressChatImage(file);
      setSelectedFile(compressedFile);
      
      // Create preview from compressed file
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setIsCompressingPreview(false);
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error("Error compressing image:", error);
      toast.error("Error al procesar la imagen");
      setIsCompressingPreview(false);
    }
  };

  const clearImagePreview = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setIsCompressingPreview(false);
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
    if (!blob || !user?.id || !quedadaId || !quedada) return;
    
    const audioUrl = await uploadAudio(blob, user.id);
    if (audioUrl) {
      const recipientIds = getRecipientIds();
      try {
        await sendMessage.mutateAsync({ 
          quedadaId, 
          content: audioUrl,
          recipientProfileIds: recipientIds,
          quedadaTitle: quedada.title,
        });
      } catch (error: any) {
        toast.error("Error al enviar: " + error.message);
      }
    }
  };

  const formatEventDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, "EEEE d 'de' MMMM", { locale: es });
  };

  const formatEventTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, "HH:mm");
  };

  if (quedadaLoading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="relative">
          <Calendar className="w-12 h-12 text-accent animate-pulse-soft" />
          <div className="absolute inset-0 bg-accent/20 blur-xl rounded-full" />
        </div>
      </main>
    );
  }

  if (!quedada) {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <div className="relative w-20 h-20 mb-6">
          <div className="w-full h-full rounded-full bg-card/50 flex items-center justify-center">
            <Calendar className="w-8 h-8 text-muted-foreground/30" />
          </div>
        </div>
        <h2 className="font-display text-xl font-semibold text-foreground mb-2">
          Quedada no encontrada
        </h2>
        <p className="font-body text-muted-foreground text-center mb-6 max-w-[240px]">
          Esta quedada ya no existe o ha expirado.
        </p>
        <Button variant="kiki-soft" onClick={() => navigate("/quedadas")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a quedadas
        </Button>
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

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button 
              onClick={() => setShowAttendees(true)}
              className="flex items-center gap-1 text-muted-foreground hover:text-accent transition-colors"
            >
              {quedada.private_attendees && !quedada.is_creator && !quedada.is_attending ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Users className="w-4 h-4" />
            )}
            <span className="font-body text-xs">{quedada.attendee_count}</span>
          </button>
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
                  <button 
                    onClick={() => msg.sender?.id && navigate(`/user/${msg.sender.id}`)}
                    className={`w-6 h-6 rounded-full overflow-hidden flex-shrink-0 hover:ring-2 hover:ring-accent/50 transition-all ${showAvatar ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                  >
                    {msg.sender?.avatar_url ? (
                      <img src={msg.sender.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-card flex items-center justify-center text-card-foreground font-display text-[10px]">
                        {(msg.sender?.name?.[0] || "?").toUpperCase()}
                      </div>
                    )}
                  </button>
                )}
                
                <div className={`max-w-[75%] ${isOwn ? "" : ""}`}>
                  {showName && (
                    <QuedadaMessageSender
                      sender={msg.sender}
                      onNavigate={() => msg.sender?.id && navigate(`/user/${msg.sender.id}`)}
                    />
                  )}
                  {isVoiceMessage(msg.content) ? (
                    <VoiceMessagePlayer audioUrl={msg.content} isOwn={isOwn} />
                  ) : (
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
                        <LazyImage 
                          src={msg.content} 
                          alt="Imagen compartida"
                          className="max-w-full max-h-64 rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          placeholderClassName="min-w-[200px] min-h-[150px] rounded-xl"
                          onClick={() => setLightboxImage(msg.content)}
                        />
                      ) : (
                        msg.content
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        
        {/* Pending messages (offline queue) */}
        {pendingMessages.map((queuedMsg) => (
          <PendingMessage
            key={queuedMsg.id}
            content={queuedMsg.content}
            status={queuedMsg.status}
            retryCount={queuedMsg.retryCount}
            maxRetries={MAX_RETRIES}
            onRetry={() => handleRetryMessage(queuedMsg)}
            onDelete={() => removeFromQueue(queuedMsg.id)}
          />
        ))}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Offline indicator */}
      {(!isOnline || pendingMessages.length > 0) && (
        <div className="relative z-10 flex justify-center py-2 border-t border-border/20">
          <OfflineMessageIndicator
            pendingCount={pendingMessages.length}
            isOnline={isOnline}
            isSyncing={isSyncing}
          />
        </div>
      )}

      {/* Image preview with upload progress */}
      {(imagePreview || isUploadingImage) && (
        <div className="relative z-10 px-6 py-2 border-t border-border/20 backdrop-blur-sm bg-background/80">
          <div className="relative inline-block">
            {imagePreview && (
              <img 
                src={imagePreview} 
                alt="Vista previa"
                className={`h-20 rounded-lg object-cover transition-opacity ${isUploadingImage ? "opacity-50" : "opacity-100"}`}
              />
            )}
            
            {/* Upload progress overlay */}
            {isUploadingImage && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm rounded-lg">
                <UploadProgress
                  isVisible={true}
                  phase={uploadPhase}
                  progress={uploadProgress}
                  className="scale-75"
                />
              </div>
            )}
            
            {/* Close button - only show when not uploading */}
            {!isUploadingImage && (
              <button
                type="button"
                onClick={clearImagePreview}
                className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/90 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
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
              disabled={isUploading || isCompressingPreview}
              className="h-12 w-12 rounded-xl bg-card/50 border border-border/30 flex items-center justify-center text-muted-foreground hover:text-accent hover:border-accent/50 transition-all duration-300 disabled:opacity-50"
            >
              {isUploadingImage || isCompressingPreview ? (
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
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={selectedFile ? "Añade un mensaje..." : "Escribe algo..."}
                  className="h-12 font-body bg-card/50 text-foreground border-border/30 focus:border-accent/50 focus:ring-2 focus:ring-accent/20 pr-4 pl-4 rounded-xl transition-all duration-300 placeholder:text-muted-foreground"
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
            </>
          )}
        </div>
      </form>

      {/* Lightbox */}
      <ImageLightbox 
        imageUrl={lightboxImage} 
        onClose={() => setLightboxImage(null)} 
      />

      {/* Attendees Modal */}
      {showAttendees && (
        <div 
          className="fixed inset-0 bg-background/90 backdrop-blur-md flex items-center justify-center p-6 z-50"
          onClick={() => setShowAttendees(false)}
        >
          <div 
            className="bg-card rounded-3xl p-6 max-w-sm w-full animate-fade-up shadow-2xl border border-border/20 max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-semibold text-card-foreground">
                Asistentes ({quedada?.attendee_count || 0})
              </h3>
              <button
                onClick={() => setShowAttendees(false)}
                className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Check if user can see the attendee list */}
            {quedada?.private_attendees && !quedada.is_creator && !quedada.is_attending ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                  <EyeOff className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <h4 className="font-display text-base font-semibold text-card-foreground mb-2">
                  Lista privada
                </h4>
                <p className="font-body text-sm text-muted-foreground max-w-[200px]">
                  Únete a la quedada para ver quién asiste.
                </p>
              </div>
            ) : (
              <div className="overflow-y-auto space-y-2 flex-1">
                {/* Creator */}
                {quedada?.creator && (
                  <button
                    onClick={() => {
                      setShowAttendees(false);
                      navigate(`/user/${quedada.creator.id}`);
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors text-left"
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={quedada.creator.avatar_url || undefined} />
                      <AvatarFallback className="bg-accent/20 text-accent font-display">
                        {(quedada.creator.name?.[0] || "?").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-body text-sm text-card-foreground truncate">
                          {quedada.creator.name || "Anónima"}
                        </p>
                        {creatorTier === 'premium' && <PremiumBadge size="sm" />}
                      </div>
                      <p className="font-body text-xs text-accent">Organizadora</p>
                    </div>
                    <Sparkles className="w-4 h-4 text-accent" />
                  </button>
                )}
                
                {/* Attendees */}
                {attendees?.map((attendee) => (
                  <QuedadaAttendeeItem
                    key={attendee.id}
                    profile={attendee.profile}
                    onNavigate={() => {
                      setShowAttendees(false);
                      navigate(`/user/${attendee.profile?.id}`);
                    }}
                    expelButton={
                      quedada?.is_creator && attendee.profile?.id ? (
                        <button
                          onClick={async () => {
                            if (!confirm(`¿Seguro que quieres expulsar a ${attendee.profile?.name || "esta persona"} de la quedada?`)) return;
                            try {
                              await expelAttendee.mutateAsync({
                                quedadaId: quedadaId!,
                                attendeeProfileId: attendee.profile!.id,
                                quedadaTitle: quedada.title,
                              });
                              toast.success("Asistente expulsado");
                            } catch (error: any) {
                              toast.error("Error: " + error.message);
                            }
                          }}
                          disabled={expelAttendee.isPending}
                          className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all disabled:opacity-50"
                          title="Expulsar asistente"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      ) : undefined
                    }
                  />
                ))}
                
                {!attendees?.length && !quedada?.creator && (
                  <p className="text-center text-muted-foreground font-body text-sm py-4">
                    No hay asistentes todavía
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
};

export default QuedadaChat;
