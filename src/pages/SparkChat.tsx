import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, Flame, X, Sparkles, User, MoreVertical, Flag, Ban, Trash2, Pencil, Check, CheckCheck, ImagePlus, Loader2, Crop, Link2, BellOff, Bell } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useProfile } from "@/hooks/useProfile";
import { useSparkChats, useChatMessages, useSendMessage, useExtinguishSpark, useMarkSparkRead, useDeleteMessage, useEditMessage, useOtherUserReadStatus } from "@/hooks/useSparks";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";
import { useChatImageUpload } from "@/hooks/useChatImageUpload";
import { compressChatImage } from "@/utils/imageCompression";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { useOfflineQueue } from "@/hooks/useOfflineQueue";
import { triggerHaptic } from "@/utils/haptics";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import UserModerationModal from "@/components/UserModerationModal";
import ImageLightbox from "@/components/ImageLightbox";
import UploadProgress from "@/components/UploadProgress";
import LazyImage from "@/components/LazyImage";
import VoiceMessagePlayer from "@/components/VoiceMessagePlayer";
import VoiceRecordButton from "@/components/VoiceRecordButton";
import OfflineMessageIndicator from "@/components/OfflineMessageIndicator";
import PendingMessage from "@/components/PendingMessage";
import PremiumBadge from "@/components/PremiumBadge";
import ImageCropModal from "@/components/ImageCropModal";
import SharedAvatar from "@/components/SharedAvatar";
import { useAuth } from "@/contexts/AuthContext";
import { useChatInput } from "@/contexts/ChatInputContext";
import { useUserSubscription } from "@/hooks/useUserSubscription";
import { useMutedSparkChats } from "@/hooks/useMutedSparkChats";

const SparkChat = () => {
  const navigate = useNavigate();
  const { chatId } = useParams<{ chatId: string }>();
  const { user } = useAuth();
  const { setTypingInChat } = useChatInput();
  const { data: profile } = useProfile();
  const { data: chats } = useSparkChats();
  const { data: messages, isLoading } = useChatMessages(chatId);
  const sendMessage = useSendMessage();
  const extinguishSpark = useExtinguishSpark();
  const markRead = useMarkSparkRead();
  const deleteMessage = useDeleteMessage();
  const editMessage = useEditMessage();
  
  // Reset typing state when leaving the chat
  useEffect(() => {
    return () => {
      setTypingInChat(false);
    };
  }, [setTypingInChat]);
  
  // Find current chat
  const chat = chats?.find(c => c.id === chatId);
  
  // Get other user's subscription tier
  const { data: otherUserTier } = useUserSubscription(chat?.other_profile?.id);
  
  // Get current user's subscription tier (for typing indicator visibility)
  const { data: currentUserTier } = useUserSubscription(profile?.id);
  const isPaidUser = currentUserTier === 'plus' || currentUserTier === 'premium';
  
  // Get the other user's read status
  const { data: otherUserLastRead } = useOtherUserReadStatus(chatId, chat?.other_profile?.id);
  
  // Typing indicator
  const { isOtherTyping, handleTyping, stopTyping } = useTypingIndicator(chatId, chat?.other_profile?.id);
  
  // Muted chats
  const { isChatMuted, toggleMute } = useMutedSparkChats();
  const isMuted = chatId ? isChatMuted(chatId) : false;
  
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
  const [showExtinguishConfirm, setShowExtinguishConfirm] = useState(false);
  const [showModerationModal, setShowModerationModal] = useState(false);
  const [moderationMode, setModerationMode] = useState<"block" | "report">("block");
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<{ id: string; content: string } | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isCompressingPreview, setIsCompressingPreview] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  
  // Crop modal state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [pendingCropFile, setPendingCropFile] = useState<File | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Get pending messages for this chat
  const pendingMessages = chatId ? getMessagesForChat(chatId, 'spark') : [];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pendingMessages]);

  // Mark chat as read when entering and when new messages arrive
  useEffect(() => {
    if (chatId && chat) {
      markRead.mutate(chatId);
    }
  }, [chatId, chat, messages?.length]);

  // Sync pending messages when coming back online
  const syncPendingMessages = useCallback(async () => {
    if (!chatId || !chat) return;
    
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
          chatId: queuedMsg.chatId, 
          content: queuedMsg.content,
          recipientProfileId: queuedMsg.metadata?.recipientProfileId,
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
  }, [chatId, chat, pendingMessages, sendMessage, removeFromQueue, updateMessageStatus, markAsFailed, setIsSyncing, notifySyncSuccess]);

  // Retry a single message
  const handleRetryMessage = useCallback(async (queuedMsg: typeof pendingMessages[0]) => {
    if (!chatId || !chat) return;
    
    await updateMessageStatus(queuedMsg.id, 'sending');
    
    try {
      await sendMessage.mutateAsync({ 
        chatId: queuedMsg.chatId, 
        content: queuedMsg.content,
        recipientProfileId: queuedMsg.metadata?.recipientProfileId,
      });
      await removeFromQueue(queuedMsg.id);
      toast.success("Mensaje enviado");
    } catch (error) {
      console.error('Failed to retry message:', error);
      await markAsFailed(queuedMsg.id);
      toast.error("Error al enviar el mensaje");
    }
  }, [chatId, chat, sendMessage, removeFromQueue, updateMessageStatus, markAsFailed]);

  // Sync when coming back online
  useEffect(() => {
    const pendingOnly = pendingMessages.filter(m => m.status === 'pending');
    if (isOnline && pendingOnly.length > 0 && !isSyncing) {
      syncPendingMessages();
    }
  }, [isOnline, pendingMessages, isSyncing, syncPendingMessages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedFile) || !chatId || !chat) return;

    triggerHaptic('light');
    stopTyping(); // Stop typing indicator on send
    
    const messageContent = newMessage.trim();
    
    // If offline and no image, queue the message
    if (!isOnline && !selectedFile && messageContent) {
      await addToQueue({
        type: 'spark',
        chatId,
        content: messageContent,
        metadata: {
          recipientProfileId: chat.other_profile?.id,
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
        chatId, 
        content: finalContent,
        recipientProfileId: chat.other_profile?.id,
      });
      setNewMessage("");
      setSelectedFile(null);
      setImagePreview(null);
    } catch (error: any) {
      // If send fails and it's a text message, queue it
      if (!selectedFile && messageContent) {
        addToQueue({
          type: 'spark',
          chatId,
          content: messageContent,
          metadata: {
            recipientProfileId: chat.other_profile?.id,
          },
        });
        setNewMessage("");
        toast.info("Mensaje guardado. Se enviará al reconectar.");
      } else {
        toast.error("Error al enviar: " + error.message);
      }
    }
  };

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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
    
    // Store file and open crop modal
    setPendingCropFile(file);
    const imageUrl = URL.createObjectURL(file);
    setImageToCrop(imageUrl);
    setCropModalOpen(true);
    
    // Reset input for future selections
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleCropComplete = useCallback(async (croppedBlob: Blob) => {
    // Clean up object URL
    if (imageToCrop) {
      URL.revokeObjectURL(imageToCrop);
    }
    setImageToCrop(null);
    setPendingCropFile(null);
    setCropModalOpen(false);
    
    setIsCompressingPreview(true);
    
    try {
      // Create file from blob
      const croppedFile = new File([croppedBlob], "chat-image.jpg", {
        type: "image/jpeg",
      });
      
      // Compress image for upload
      const compressedFile = await compressChatImage(croppedFile);
      setSelectedFile(compressedFile);
      
      // Create preview from compressed file
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setIsCompressingPreview(false);
      };
      reader.readAsDataURL(compressedFile);
      
      // Haptic feedback
      if (navigator.vibrate) navigator.vibrate(15);
    } catch (error) {
      console.error("Error processing cropped image:", error);
      toast.error("Error al procesar la imagen");
      setIsCompressingPreview(false);
    }
  }, [imageToCrop]);

  const handleCropClose = useCallback(() => {
    if (imageToCrop) {
      URL.revokeObjectURL(imageToCrop);
    }
    setImageToCrop(null);
    setPendingCropFile(null);
    setCropModalOpen(false);
  }, [imageToCrop]);

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
    triggerHaptic('medium');
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
      // Navigate with state so Sparks page can show exit animation
      navigate("/sparks", { state: { extinguishedSparkId: chatId } });
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
        <h2 className="text-xl font-semibold text-foreground mb-2" style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>
          Chat no encontrado
        </h2>
        <p className="text-muted-foreground text-center mb-6 max-w-[240px]" style={{ fontFamily: 'Arial, sans-serif' }}>
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
      
      {/* Header - Grid layout for perfect centering */}
      <header className="relative z-10 grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-6 py-4 border-b border-border/20 backdrop-blur-sm bg-background/80">
        {/* Left section - back button */}
        <motion.div 
          className="flex items-center justify-start"
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <button 
            onClick={() => navigate("/sparks")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all duration-300 font-body group rounded-lg p-1 -ml-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label="Volver a Sparks"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          </button>
        </motion.div>
        
        {/* Center section - user info (always centered) */}
        <motion.button 
          onClick={() => chat.other_profile?.id && navigate(`/user/${chat.other_profile.id}`)}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          aria-label={`Ver perfil de ${chat.other_profile?.name || "usuario"}`}
          initial={{ opacity: 0, scale: 0.9, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ 
            duration: 0.4, 
            ease: [0.175, 0.885, 0.32, 1.1],
            delay: 0.05
          }}
        >
          {/* Avatar with glow ring - shared element transition */}
          <div className="relative">
            <SharedAvatar
              profileId={chat.other_profile?.id || chatId || ""}
              avatarUrl={chat.other_profile?.avatar_url}
              name={chat.other_profile?.name}
              size="md"
              ringClassName="ring-2 ring-primary/30 ring-offset-2 ring-offset-background"
            />
            {/* Spark indicator */}
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-background flex items-center justify-center">
              <Flame className="w-3 h-3 text-primary animate-spark-flame" />
            </div>
          </div>
          
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="font-display font-semibold text-foreground">
                {chat.other_profile?.name || "Anónima"}
              </span>
              {otherUserTier === 'premium' && <PremiumBadge size="sm" />}
            </div>
            <span className="font-body text-xs text-primary/80 flex items-center gap-1">
              <User className="w-3 h-3" />
              Ver perfil
            </span>
          </div>
        </motion.button>

        {/* Right section - actions */}
        <motion.div 
          className="flex items-center justify-end gap-2"
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                className="text-muted-foreground hover:text-foreground transition-colors rounded-lg p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-label="Más opciones"
                title="Más opciones"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => chatId && toggleMute(chatId)}
                className="gap-2"
              >
                {isMuted ? (
                  <>
                    <Bell className="w-4 h-4" />
                    Activar notificaciones
                  </>
                ) : (
                  <>
                    <BellOff className="w-4 h-4" />
                    Silenciar
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  const url = `${window.location.origin}/spark/${chatId}`;
                  navigator.clipboard.writeText(url);
                  triggerHaptic('light');
                  toast.success("Enlace copiado");
                }}
                className="gap-2"
              >
                <Link2 className="w-4 h-4" />
                Copiar enlace
              </DropdownMenuItem>
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
        </motion.div>
      </header>

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
                          <LazyImage 
                            src={msg.content} 
                            alt="Imagen compartida"
                            className="max-w-full max-h-64 rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            placeholderClassName="min-w-[200px] min-h-[150px] rounded-xl"
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
                          <Check className="w-4 h-4 text-muted-foreground/70" />
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
        
        {/* Typing indicator - only for Plus/Premium users */}
        {isPaidUser && isOtherTyping && (
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
                <span className="w-2 h-2 bg-muted-foreground/70 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-muted-foreground/70 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-muted-foreground/70 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
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

      {/* Input - extra right padding to avoid floating widgets (AI assistant, shortcuts) */}
      <form onSubmit={handleSend} className="relative z-10 px-6 py-4 border-t border-border/20 backdrop-blur-sm bg-background/80 pr-24">
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
              className="h-12 w-12 rounded-xl bg-card/50 border border-border/30 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-all duration-300 disabled:opacity-50"
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
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTyping();
                  }}
                  onFocus={() => setTypingInChat(true)}
                  onBlur={() => setTypingInChat(false)}
                  placeholder={selectedFile ? "Añade un mensaje..." : "Escribe algo..."}
                  className="h-12 font-body bg-card/50 text-card-foreground border-border/30 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 pr-4 pl-4 rounded-xl transition-all duration-300 placeholder:text-muted-foreground"
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

      {/* Image Crop Modal */}
      <ImageCropModal
        isOpen={cropModalOpen && !!imageToCrop}
        onClose={handleCropClose}
        imageSrc={imageToCrop || ""}
        onCropComplete={handleCropComplete}
        aspectRatio={4 / 5}
      />

      {/* Footer */}
      <div className="py-4 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/30 border border-border/20">
          <Flame className="w-3.5 h-3.5 text-primary/60" />
          <p className="text-xs text-muted-foreground" style={{ fontFamily: 'Arial, sans-serif' }}>
            Conexión real · Sin filtros
          </p>
        </div>
      </div>
    </main>
  );
};

export default SparkChat;
