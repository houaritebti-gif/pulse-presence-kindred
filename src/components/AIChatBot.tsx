import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, X, Send, Trash2, Bot, User, Sparkles, Calendar, Users, UserCircle, Radio, Copy, Check, Plus, Pencil, Lock, Crown, RotateCcw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAIChat } from "@/hooks/useAIChat";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { TypingIndicator } from "./TypingIndicator";
import { useCreateQuedada, useDeleteQuedada } from "@/hooks/useQuedadas";
import { useProfile } from "@/hooks/useProfile";
import { useSubscription } from "@/hooks/useSubscription";
import { useChatInput } from "@/contexts/ChatInputContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion, useDragControls, PanInfo } from "framer-motion";

const POSITION_STORAGE_KEY = "ai-chatbot-position";

const SUGGESTED_QUESTIONS = [
  "¿Cuáles son mis quedadas?",
  "¿Con quién tengo sparks?",
  "Crear quedada para mañana a las 20h",
  "¿Qué son los sparks?",
  "¿Cómo conecto con otros usuarios?",
];

interface QuickAction {
  label: string;
  route: string;
  icon: "sparks" | "quedadas" | "presence" | "profile" | "create";
}

interface QuedadaCreationData {
  title: string;
  event_date: string;
  description: string;
  location_hint: string;
}

interface QuedadaDeletionData {
  id: string;
  title: string;
}

const ACTION_ICONS = {
  sparks: Sparkles,
  quedadas: Calendar,
  presence: Radio,
  profile: UserCircle,
  create: Users,
};

// Extract actions and quedada data from AI response
const extractActions = (text: string): { 
  cleanText: string; 
  actions: QuickAction[]; 
  quedadaData: QuedadaCreationData | null;
  quedadaDeletion: QuedadaDeletionData | null;
} => {
  const actions: QuickAction[] = [];
  let quedadaData: QuedadaCreationData | null = null;
  let quedadaDeletion: QuedadaDeletionData | null = null;
  
  // Extract quedada creation data
  const quedadaMatch = text.match(/\[\[create_quedada:([^|]+)\|([^|]+)\|([^|]*)\|([^\]]*)\]\]/);
  if (quedadaMatch) {
    quedadaData = {
      title: quedadaMatch[1].trim(),
      event_date: quedadaMatch[2].trim(),
      description: quedadaMatch[3].trim(),
      location_hint: quedadaMatch[4].trim(),
    };
  }

  // Extract quedada deletion data
  const deleteMatch = text.match(/\[\[delete_quedada:([^|]+)\|([^\]]+)\]\]/);
  if (deleteMatch) {
    quedadaDeletion = {
      id: deleteMatch[1].trim(),
      title: deleteMatch[2].trim(),
    };
  }
  
  // Extract action buttons
  const actionRegex = /\[\[action:([^|]+)\|([^|]+)\|([^\]]+)\]\]/g;
  let match;
  while ((match = actionRegex.exec(text)) !== null) {
    const iconType = match[3].trim() as QuickAction["icon"];
    if (ACTION_ICONS[iconType]) {
      actions.push({
        label: match[1].trim(),
        route: match[2].trim(),
        icon: iconType,
      });
    }
  }
  
  // Clean the text
  let cleanText = text
    .replace(/\[\[create_quedada:[^\]]+\]\]/g, "")
    .replace(/\[\[delete_quedada:[^\]]+\]\]/g, "")
    .replace(/\[\[action:[^\]]+\]\]/g, "")
    .trim();
  
  return { cleanText, actions, quedadaData, quedadaDeletion };
};

// Parse markdown-like formatting
const parseMarkdown = (text: string): React.ReactNode[] => {
  const parts: React.ReactNode[] = [];
  const lines = text.split("\n");
  
  lines.forEach((line, lineIndex) => {
    if (lineIndex > 0) {
      parts.push(<br key={`br-${lineIndex}`} />);
    }
    
    // Handle lists
    if (line.match(/^[-•]\s/)) {
      const listContent = line.replace(/^[-•]\s/, "");
      parts.push(
        <span key={`list-${lineIndex}`} className="flex gap-1">
          <span>•</span>
          <span>{parseInlineMarkdown(listContent)}</span>
        </span>
      );
      return;
    }
    
    // Handle numbered lists
    if (line.match(/^\d+\.\s/)) {
      const match = line.match(/^(\d+)\.\s(.*)$/);
      if (match) {
        parts.push(
          <span key={`numlist-${lineIndex}`} className="flex gap-1">
            <span>{match[1]}.</span>
            <span>{parseInlineMarkdown(match[2])}</span>
          </span>
        );
        return;
      }
    }
    
    // Handle headings
    if (line.match(/^#{1,3}\s/)) {
      const headingMatch = line.match(/^(#{1,3})\s(.*)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const fontSize = level === 1 ? "text-base font-bold" : level === 2 ? "text-sm font-semibold" : "text-sm font-medium";
        parts.push(
          <span key={`heading-${lineIndex}`} className={fontSize}>
            {parseInlineMarkdown(headingMatch[2])}
          </span>
        );
        return;
      }
    }
    
    parts.push(<span key={`text-${lineIndex}`}>{parseInlineMarkdown(line)}</span>);
  });
  
  return parts;
};

const parseInlineMarkdown = (text: string): React.ReactNode => {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyIndex = 0;
  
  while (remaining.length > 0) {
    // Links [text](url)
    const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch && linkMatch.index !== undefined) {
      if (linkMatch.index > 0) {
        parts.push(remaining.slice(0, linkMatch.index));
      }
      parts.push(
        <a
          key={`link-${keyIndex++}`}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline hover:text-primary/80"
        >
          {linkMatch[1]}
        </a>
      );
      remaining = remaining.slice(linkMatch.index + linkMatch[0].length);
      continue;
    }
    
    // Bold **text**
    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
    if (boldMatch && boldMatch.index !== undefined) {
      if (boldMatch.index > 0) {
        parts.push(remaining.slice(0, boldMatch.index));
      }
      parts.push(<strong key={`bold-${keyIndex++}`}>{boldMatch[1]}</strong>);
      remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
      continue;
    }
    
    // Italic *text*
    const italicMatch = remaining.match(/\*([^*]+)\*/);
    if (italicMatch && italicMatch.index !== undefined) {
      if (italicMatch.index > 0) {
        parts.push(remaining.slice(0, italicMatch.index));
      }
      parts.push(<em key={`italic-${keyIndex++}`}>{italicMatch[1]}</em>);
      remaining = remaining.slice(italicMatch.index + italicMatch[0].length);
      continue;
    }
    
    // Code `text`
    const codeMatch = remaining.match(/`([^`]+)`/);
    if (codeMatch && codeMatch.index !== undefined) {
      if (codeMatch.index > 0) {
        parts.push(remaining.slice(0, codeMatch.index));
      }
      parts.push(
        <code key={`code-${keyIndex++}`} className="bg-muted px-1 py-0.5 rounded text-xs">
          {codeMatch[1]}
        </code>
      );
      remaining = remaining.slice(codeMatch.index + codeMatch[0].length);
      continue;
    }
    
    parts.push(remaining);
    break;
  }
  
  return parts.length === 1 ? parts[0] : parts;
};

interface FormattedMessageProps {
  content: string;
  isUser: boolean;
  onNavigate: (route: string) => void;
  onCreateQuedada: (data: QuedadaCreationData) => void;
  onDeleteQuedada: (data: QuedadaDeletionData) => void;
  showCopyButton?: boolean;
  canCreateQuedadas?: boolean;
  canDeleteQuedadas?: boolean;
}

const FormattedMessage = ({ 
  content, 
  isUser, 
  onNavigate, 
  onCreateQuedada, 
  onDeleteQuedada,
  showCopyButton,
  canCreateQuedadas = true,
  canDeleteQuedadas = true,
}: FormattedMessageProps) => {
  const [copied, setCopied] = useState(false);
  const [quedadaCreated, setQuedadaCreated] = useState(false);
  const [quedadaDeleted, setQuedadaDeleted] = useState(false);
  
  const { cleanText, actions, quedadaData, quedadaDeletion } = useMemo(() => 
    extractActions(content), [content]
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cleanText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleCreateQuedada = () => {
    if (quedadaData && !quedadaCreated && canCreateQuedadas) {
      setQuedadaCreated(true);
      onCreateQuedada(quedadaData);
    }
  };

  const handleDeleteQuedada = () => {
    if (quedadaDeletion && !quedadaDeleted && canDeleteQuedadas) {
      setQuedadaDeleted(true);
      onDeleteQuedada(quedadaDeletion);
    }
  };
  
  if (isUser) {
    return <span>{content}</span>;
  }

  // Show typing indicator for empty assistant messages
  if (!content) {
    return <TypingIndicator />;
  }
  
  return (
    <div className="space-y-2">
      <div className="relative group">
        <div className="whitespace-pre-wrap">{parseMarkdown(cleanText)}</div>
        {showCopyButton && cleanText && (
          <button
            onClick={handleCopy}
            className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded bg-background/80 hover:bg-muted"
            title="Copiar mensaje"
          >
            {copied ? (
              <Check className="h-3 w-3 text-green-500" />
            ) : (
              <Copy className="h-3 w-3 text-muted-foreground" />
            )}
          </button>
        )}
      </div>
      
      {/* Quedada creation card */}
      {quedadaData && (
        <div className="mt-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">Crear quedada</span>
          </div>
          <div className="text-xs space-y-1 mb-3">
            <p><strong>Título:</strong> {quedadaData.title}</p>
            <p><strong>Fecha:</strong> {new Date(quedadaData.event_date).toLocaleString("es-ES", {
              weekday: "long",
              day: "numeric",
              month: "long",
              hour: "2-digit",
              minute: "2-digit",
            })}</p>
            {quedadaData.description && <p><strong>Descripción:</strong> {quedadaData.description}</p>}
            {quedadaData.location_hint && <p><strong>Lugar:</strong> {quedadaData.location_hint}</p>}
          </div>
          {canCreateQuedadas ? (
            <Button
              size="sm"
              onClick={handleCreateQuedada}
              disabled={quedadaCreated}
              className="w-full gap-2"
            >
              {quedadaCreated ? (
                <>
                  <Check className="h-3 w-3" />
                  ¡Quedada creada!
                </>
              ) : (
                <>
                  <Plus className="h-3 w-3" />
                  Confirmar y crear
                </>
              )}
            </Button>
          ) : (
            <div className="flex items-center gap-2 p-2 rounded bg-muted/50 text-xs text-muted-foreground">
              <Crown className="h-4 w-4 text-yellow-500" />
              <span>Necesitas Premium para crear quedadas desde el chat</span>
            </div>
          )}
        </div>
      )}

      {/* Quedada deletion card */}
      {quedadaDeletion && (
        <div className="mt-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <div className="flex items-center gap-2 mb-2">
            <Trash2 className="h-4 w-4 text-destructive" />
            <span className="font-medium text-sm">Eliminar quedada</span>
          </div>
          <div className="text-xs space-y-1 mb-3">
            <p><strong>Título:</strong> {quedadaDeletion.title}</p>
          </div>
          {canDeleteQuedadas ? (
            <Button
              size="sm"
              variant="destructive"
              onClick={handleDeleteQuedada}
              disabled={quedadaDeleted}
              className="w-full gap-2"
            >
              {quedadaDeleted ? (
                <>
                  <Check className="h-3 w-3" />
                  ¡Quedada eliminada!
                </>
              ) : (
                <>
                  <Trash2 className="h-3 w-3" />
                  Confirmar eliminación
                </>
              )}
            </Button>
          ) : (
            <div className="flex items-center gap-2 p-2 rounded bg-muted/50 text-xs text-muted-foreground">
              <Crown className="h-4 w-4 text-yellow-500" />
              <span>Necesitas Premium para eliminar quedadas desde el chat</span>
            </div>
          )}
        </div>
      )}
      
      {/* Action buttons */}
      {actions.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {actions.map((action, index) => {
            const Icon = ACTION_ICONS[action.icon];
            return (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => onNavigate(action.route)}
                className="gap-1.5 text-xs h-7"
              >
                <Icon className="h-3 w-3" />
                {action.label}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Subscription paywall component
const SubscriptionPaywall = ({ onClose }: { onClose: () => void }) => {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-6">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mb-4">
        <Crown className="h-8 w-8 text-white" />
      </div>
      <h3 className="font-bold text-lg mb-2">Desbloquea el Asistente IA</h3>
      <p className="text-sm text-muted-foreground mb-6">
        El chatbot inteligente está disponible para usuarios con suscripción.
      </p>
      
      <div className="w-full space-y-3 mb-4">
        <div className="p-4 rounded-lg border-2 border-primary bg-primary/5">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold">Básico</span>
            <span className="text-lg font-bold">4,99€<span className="text-xs font-normal text-muted-foreground">/mes</span></span>
          </div>
          <ul className="text-xs text-left space-y-1 text-muted-foreground">
            <li className="flex items-center gap-2">
              <Check className="h-3 w-3 text-green-500" />
              Acceso al chatbot IA
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-3 w-3 text-green-500" />
              Consultas ilimitadas
            </li>
          </ul>
        </div>
        
        <div className="p-4 rounded-lg border-2 border-yellow-500 bg-yellow-500/5 relative">
          <div className="absolute -top-2 right-2 bg-yellow-500 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
            POPULAR
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold">Premium</span>
            <span className="text-lg font-bold">9,99€<span className="text-xs font-normal text-muted-foreground">/mes</span></span>
          </div>
          <ul className="text-xs text-left space-y-1 text-muted-foreground">
            <li className="flex items-center gap-2">
              <Check className="h-3 w-3 text-green-500" />
              Todo lo del plan Básico
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-3 w-3 text-green-500" />
              Crear quedadas desde el chat
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-3 w-3 text-green-500" />
              Eliminar quedadas desde el chat
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-3 w-3 text-green-500" />
              Próximamente: más funciones
            </li>
          </ul>
        </div>
      </div>
      
      <p className="text-xs text-muted-foreground">
        Próximamente podrás suscribirte directamente
      </p>
    </div>
  );
};

export const AIChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(() => {
    try {
      const stored = localStorage.getItem(POSITION_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  
  const { messages, isLoading, error, sendMessage, clearChat, unreadCount, markAsRead, incrementUnread } = useAIChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const createQuedada = useCreateQuedada();
  const deleteQuedada = useDeleteQuedada();
  const { canAccessChatbot, canCreateQuedadas, canDeleteQuedadas, tier } = useSubscription();
  const { isTypingInChat } = useChatInput();
  const isMobile = useIsMobile();
  const prevMessagesLength = useRef(messages.length);
  const dragControls = useDragControls();

  // Get default position based on device
  const getDefaultPosition = useCallback(() => {
    const buttonSize = isMobile ? 44 : 56;
    return {
      x: window.innerWidth - buttonSize - (isMobile ? 12 : 16),
      y: window.innerHeight - buttonSize - (isMobile ? 72 : 80),
    };
  }, [isMobile]);

  // Initialize position on mount
  useEffect(() => {
    if (!position) {
      setPosition(getDefaultPosition());
    }
  }, [position, getDefaultPosition]);

  // Handle window resize - keep button in bounds
  useEffect(() => {
    const handleResize = () => {
      if (position) {
        const buttonSize = isMobile ? 44 : 56;
        const maxX = window.innerWidth - buttonSize - 8;
        const maxY = window.innerHeight - buttonSize - 8;
        const minX = 8;
        const minY = 8;
        
        setPosition({
          x: Math.min(Math.max(position.x, minX), maxX),
          y: Math.min(Math.max(position.y, minY), maxY),
        });
      }
    };
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [position, isMobile]);

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
    // Haptic feedback on drag start - short vibration
    if (navigator.vibrate) {
      navigator.vibrate(20);
    }
  }, []);

  const handleDragEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!position) return;
    
    const buttonSize = isMobile ? 44 : 56;
    const newX = position.x + info.offset.x;
    const newY = position.y + info.offset.y;
    
    // Clamp to screen bounds
    const maxX = window.innerWidth - buttonSize - 8;
    const maxY = window.innerHeight - buttonSize - 8;
    const minX = 8;
    const minY = 8;
    
    const clampedPosition = {
      x: Math.min(Math.max(newX, minX), maxX),
      y: Math.min(Math.max(newY, minY), maxY),
    };
    
    setPosition(clampedPosition);
    
    // Haptic feedback on drag end - double tap pattern
    if (navigator.vibrate) {
      navigator.vibrate([15, 30, 15]);
    }
    
    // Save to localStorage
    try {
      localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(clampedPosition));
    } catch {}
    
    // Small delay to prevent click after drag
    setTimeout(() => setIsDragging(false), 100);
  }, [position, isMobile]);

  const handleButtonClick = useCallback(() => {
    if (!isDragging) {
      setIsOpen(true);
    }
  }, [isDragging]);

  // Check if position has been moved from default
  const isPositionCustomized = useCallback(() => {
    if (!position) return false;
    const defaultPos = getDefaultPosition();
    const threshold = 20; // pixels tolerance
    return Math.abs(position.x - defaultPos.x) > threshold || 
           Math.abs(position.y - defaultPos.y) > threshold;
  }, [position, getDefaultPosition]);

  // Reset position to default
  const resetPosition = useCallback(() => {
    const defaultPos = getDefaultPosition();
    setPosition(defaultPos);
    localStorage.removeItem(POSITION_STORAGE_KEY);
    
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate([30, 20, 30]);
    }
  }, [getDefaultPosition]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Track new assistant messages when chat is closed
  useEffect(() => {
    if (!isOpen && messages.length > prevMessagesLength.current) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage?.role === "assistant" && lastMessage.content) {
        incrementUnread();
      }
    }
    prevMessagesLength.current = messages.length;
  }, [messages, isOpen, incrementUnread]);

  // Mark as read when opening chat
  useEffect(() => {
    if (isOpen && unreadCount > 0) {
      markAsRead();
    }
  }, [isOpen, unreadCount, markAsRead]);

  useEffect(() => {
    if (isOpen && inputRef.current && canAccessChatbot) {
      inputRef.current.focus();
    }
  }, [isOpen, canAccessChatbot]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      sendMessage(input);
      setInput("");
    }
  };

  const handleSuggestionClick = (question: string) => {
    if (!isLoading) {
      sendMessage(question);
    }
  };

  const handleNavigate = (route: string) => {
    setIsOpen(false);
    navigate(route);
  };

  const handleCreateQuedada = async (data: QuedadaCreationData) => {
    if (!profile) {
      toast({
        title: "Error",
        description: "Necesitas iniciar sesión para crear quedadas",
        variant: "destructive",
      });
      return;
    }

    if (!canCreateQuedadas) {
      toast({
        title: "Función Premium",
        description: "Necesitas Premium para crear quedadas desde el chat",
        variant: "destructive",
      });
      return;
    }

    try {
      await createQuedada.mutateAsync({
        title: data.title,
        event_date: data.event_date,
        description: data.description || undefined,
        location_hint: data.location_hint || undefined,
      });
      
      if (navigator.vibrate) {
        navigator.vibrate([50, 30, 50]);
      }
      
      toast({
        title: "¡Quedada creada! 🎉",
        description: `"${data.title}" ha sido creada correctamente`,
      });
    } catch (err) {
      console.error("Error creating quedada:", err);
      toast({
        title: "Error",
        description: "No se pudo crear la quedada",
        variant: "destructive",
      });
    }
  };

  const handleDeleteQuedada = async (data: QuedadaDeletionData) => {
    if (!profile) {
      toast({
        title: "Error",
        description: "Necesitas iniciar sesión para eliminar quedadas",
        variant: "destructive",
      });
      return;
    }

    if (!canDeleteQuedadas) {
      toast({
        title: "Función Premium",
        description: "Necesitas Premium para eliminar quedadas desde el chat",
        variant: "destructive",
      });
      return;
    }

    try {
      await deleteQuedada.mutateAsync(data.id);
      
      if (navigator.vibrate) {
        navigator.vibrate([50, 30, 50]);
      }
      
      toast({
        title: "Quedada eliminada",
        description: `"${data.title}" ha sido eliminada correctamente`,
      });
    } catch (err) {
      console.error("Error deleting quedada:", err);
      toast({
        title: "Error",
        description: "No se pudo eliminar la quedada. Asegúrate de que eres el creador.",
        variant: "destructive",
      });
    }
  };

  const shouldHideButton = isOpen || isTypingInChat;
  const buttonSize = isMobile ? 44 : 56;

  return (
    <>
      {/* Floating Draggable Button */}
      {position && (
        <motion.button
          ref={buttonRef}
          drag
          dragMomentum={false}
          dragElastic={0.1}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onClick={handleButtonClick}
          initial={false}
          animate={{
            x: 0,
            y: 0,
            opacity: shouldHideButton ? 0 : 1,
            scale: shouldHideButton ? 0.75 : (isDragging ? 1.1 : 1),
          }}
          whileHover={!isDragging ? { scale: 1.1 } : undefined}
          whileTap={!isDragging ? { scale: 0.95 } : undefined}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 25,
            opacity: { duration: 0.2 }
          }}
          style={{
            position: "fixed",
            left: position.x,
            top: position.y,
            width: buttonSize,
            height: buttonSize,
            zIndex: 50,
            pointerEvents: shouldHideButton ? "none" : "auto",
            touchAction: "none",
          }}
          className={cn(
            "flex items-center justify-center rounded-full shadow-lg cursor-grab active:cursor-grabbing",
            "bg-primary hover:bg-primary/90 text-primary-foreground",
            "border-2 border-transparent",
            isDragging && "border-primary-foreground/30 shadow-2xl"
          )}
          aria-hidden={shouldHideButton}
          tabIndex={shouldHideButton ? -1 : 0}
          aria-label="Abrir asistente IA"
        >
          {canAccessChatbot ? (
            <div className="relative">
              <MessageCircle className={isMobile ? "h-5 w-5" : "h-6 w-6"} />
              {/* Unread badge */}
              {unreadCount > 0 && (
                <span className={cn(
                  "absolute flex items-center justify-center rounded-full bg-destructive text-destructive-foreground font-bold animate-in zoom-in-50 duration-200",
                  isMobile 
                    ? "-top-1.5 -right-1.5 h-4 w-4 text-[9px]" 
                    : "-top-2 -right-2 h-5 w-5 text-[10px]"
                )}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </div>
          ) : (
            <div className="relative">
              <MessageCircle className={isMobile ? "h-5 w-5" : "h-6 w-6"} />
              <Lock className={cn("absolute -bottom-1 -right-1", isMobile ? "h-2.5 w-2.5" : "h-3 w-3")} />
            </div>
          )}
        </motion.button>
      )}

      {/* Reset position button - appears when widget has been moved */}
      {position && isPositionCustomized() && !isOpen && !shouldHideButton && (
        <motion.button
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          onClick={resetPosition}
          style={{
            position: "fixed",
            left: position.x + buttonSize + 4,
            top: position.y + buttonSize / 2 - 12,
            zIndex: 49,
          }}
          className={cn(
            "flex items-center justify-center h-6 w-6 rounded-full",
            "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground",
            "shadow-md border border-border/50",
            "transition-colors duration-200"
          )}
          title="Restaurar posición"
          aria-label="Restaurar posición del asistente"
        >
          <RotateCcw className="h-3 w-3" />
        </motion.button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 w-[350px] max-w-[calc(100vw-2rem)] rounded-xl border bg-background shadow-2xl animate-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="flex items-center justify-between border-b p-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-semibold text-sm">Asistente IA</h3>
                  {tier !== 'free' && (
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                      tier === 'premium' ? "bg-yellow-500/20 text-yellow-600" : "bg-primary/20 text-primary"
                    )}>
                      {tier === 'premium' ? 'PREMIUM' : 'BÁSICO'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Siempre disponible</p>
              </div>
            </div>
            <div className="flex gap-1">
              {canAccessChatbot && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={clearChat}
                  title="Limpiar chat"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content - Paywall or Chat */}
          {!canAccessChatbot ? (
            <div className="h-[400px]">
              <SubscriptionPaywall onClose={() => setIsOpen(false)} />
            </div>
          ) : (
            <>
              {/* Messages */}
              <ScrollArea className="h-[350px] p-3" ref={scrollRef}>
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Bot className="h-10 w-10 mb-2 text-muted-foreground opacity-50" />
                    <p className="text-sm font-medium">¡Hola! 👋</p>
                    <p className="text-xs text-muted-foreground mt-1 mb-4">¿En qué puedo ayudarte?</p>
                    <div className="flex flex-wrap gap-2 justify-center px-2">
                      {SUGGESTED_QUESTIONS.map((question, i) => (
                        <button
                          key={i}
                          onClick={() => handleSuggestionClick(question)}
                          disabled={isLoading}
                          className={cn(
                            "text-xs px-3 py-1.5 rounded-full border",
                            "bg-muted/50 hover:bg-muted text-foreground",
                            "transition-colors duration-200",
                            "disabled:opacity-50 disabled:cursor-not-allowed"
                          )}
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg, i) => (
                      <div
                        key={i}
                        className={cn(
                          "flex gap-2",
                          msg.role === "user" ? "justify-end" : "justify-start"
                        )}
                      >
                        {msg.role === "assistant" && (
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <Bot className="h-3 w-3" />
                          </div>
                        )}
                        <div
                          className={cn(
                            "rounded-lg px-3 py-2 text-sm max-w-[80%]",
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          )}
                        >
                          <FormattedMessage 
                            content={msg.content} 
                            isUser={msg.role === "user"} 
                            onNavigate={handleNavigate}
                            onCreateQuedada={handleCreateQuedada}
                            onDeleteQuedada={handleDeleteQuedada}
                            showCopyButton={msg.role === "assistant" && msg.content !== ""}
                            canCreateQuedadas={canCreateQuedadas}
                            canDeleteQuedadas={canDeleteQuedadas}
                          />
                        </div>
                        {msg.role === "user" && (
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                            <User className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {error && (
                  <div className="mt-2 rounded-lg bg-destructive/10 p-2 text-xs text-destructive">
                    {error}
                  </div>
                )}
              </ScrollArea>

              {/* Input */}
              <form onSubmit={handleSubmit} className="border-t p-3">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Escribe tu mensaje..."
                    disabled={isLoading}
                    className="flex-1 text-sm"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!input.trim() || isLoading}
                    className="shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
};
