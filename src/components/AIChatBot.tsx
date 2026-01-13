import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, X, Send, Trash2, Bot, User, Sparkles, Calendar, Users, UserCircle, Radio, Copy, Check, Plus, Pencil, Lock, Crown, Mic, Zap, ChevronDown, RotateCcw } from "lucide-react";
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
import { motion, AnimatePresence, useDragControls, PanInfo } from "framer-motion";
import { triggerHaptic } from "@/utils/haptics";

const POSITION_STORAGE_KEY = "ai-chatbot-position";

const SUGGESTED_QUESTIONS = [
  { text: "¿Cuáles son mis quedadas?", emoji: "📅" },
  { text: "¿Con quién tengo sparks?", emoji: "✨" },
  { text: "Crear quedada para mañana", emoji: "➕" },
  { text: "¿Cómo funciona la app?", emoji: "❓" },
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

interface ContextualSuggestion {
  emoji: string;
  text: string;
}

// Extract actions and quedada data from AI response
const extractActions = (text: string): { 
  cleanText: string; 
  actions: QuickAction[]; 
  quedadaData: QuedadaCreationData | null;
  quedadaDeletion: QuedadaDeletionData | null;
  suggestions: ContextualSuggestion[];
} => {
  const actions: QuickAction[] = [];
  const suggestions: ContextualSuggestion[] = [];
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

  // Extract contextual suggestions
  const suggestionRegex = /\[\[suggestion:([^|]+)\|([^\]]+)\]\]/g;
  let suggestionMatch;
  while ((suggestionMatch = suggestionRegex.exec(text)) !== null) {
    suggestions.push({
      emoji: suggestionMatch[1].trim(),
      text: suggestionMatch[2].trim(),
    });
  }
  
  // Clean the text
  let cleanText = text
    .replace(/\[\[create_quedada:[^\]]+\]\]/g, "")
    .replace(/\[\[delete_quedada:[^\]]+\]\]/g, "")
    .replace(/\[\[action:[^\]]+\]\]/g, "")
    .replace(/\[\[suggestion:[^\]]+\]\]/g, "")
    .trim();
  
  return { cleanText, actions, quedadaData, quedadaDeletion, suggestions };
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
  onSuggestionClick?: (text: string) => void;
  showCopyButton?: boolean;
  canCreateQuedadas?: boolean;
  canDeleteQuedadas?: boolean;
  isLastMessage?: boolean;
  isLoading?: boolean;
}

const FormattedMessage = ({ 
  content, 
  isUser, 
  onNavigate, 
  onCreateQuedada, 
  onDeleteQuedada,
  onSuggestionClick,
  showCopyButton,
  canCreateQuedadas = true,
  canDeleteQuedadas = true,
  isLastMessage = false,
  isLoading = false,
}: FormattedMessageProps) => {
  const [copied, setCopied] = useState(false);
  const [quedadaCreated, setQuedadaCreated] = useState(false);
  const [quedadaDeleted, setQuedadaDeleted] = useState(false);
  
  const { cleanText, actions, quedadaData, quedadaDeletion, suggestions } = useMemo(() => 
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

      {/* Contextual suggestions - only show on last message and when not loading */}
      {isLastMessage && !isLoading && suggestions.length > 0 && onSuggestionClick && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="mt-4 pt-3 border-t border-border/30"
        >
          <p className="text-[10px] text-muted-foreground mb-2 flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Preguntas sugeridas
          </p>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((suggestion, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  onSuggestionClick(suggestion.text);
                  triggerHaptic("light");
                }}
                className={cn(
                  "flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-full",
                  "bg-gradient-to-r from-primary/10 to-accent/10 hover:from-primary/20 hover:to-accent/20",
                  "border border-primary/20 hover:border-primary/40",
                  "transition-all duration-200",
                  "text-foreground/80 hover:text-foreground"
                )}
              >
                <span>{suggestion.emoji}</span>
                <span>{suggestion.text}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

// Enhanced Subscription paywall component
const SubscriptionPaywall = ({ onClose }: { onClose: () => void }) => {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-5">
      {/* Animated crown icon */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="relative mb-5"
      >
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-500 flex items-center justify-center shadow-lg">
          <Crown className="h-10 w-10 text-white" />
        </div>
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
        >
          <Sparkles className="h-3 w-3 text-primary-foreground" />
        </motion.div>
      </motion.div>
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <h3 className="font-bold text-lg mb-1">Desbloquea el Asistente IA</h3>
        <p className="text-sm text-muted-foreground mb-5">
          Tu compañero inteligente para sacar el máximo de KIKI
        </p>
      </motion.div>
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="w-full space-y-3 mb-4"
      >
        {/* Features list */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            { icon: "💬", text: "Chat ilimitado" },
            { icon: "📅", text: "Crear quedadas" },
            { icon: "✨", text: "Ver tus sparks" },
            { icon: "🔥", text: "Tips personalizados" },
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
            >
              <span>{feature.icon}</span>
              <span>{feature.text}</span>
            </motion.div>
          ))}
        </div>
        
        {/* Premium CTA */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            onClick={() => {
              onClose();
              navigate("/subscription");
            }}
            className="w-full gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-lg"
          >
            <Crown className="h-4 w-4" />
            Ver planes Premium
          </Button>
        </motion.div>
      </motion.div>
      
      <p className="text-[10px] text-muted-foreground">
        Desde 4,99€/mes • Cancela cuando quieras
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
    const padding = isMobile ? 12 : 16;
    const newX = position.x + info.offset.x;
    const newY = position.y + info.offset.y;
    
    // Clamp Y to screen bounds
    const maxY = window.innerHeight - buttonSize - 8;
    const minY = 8;
    const clampedY = Math.min(Math.max(newY, minY), maxY);
    
    // Snap to nearest edge (left or right)
    const screenCenter = window.innerWidth / 2;
    const snapToLeft = newX + buttonSize / 2 < screenCenter;
    const snappedX = snapToLeft ? padding : window.innerWidth - buttonSize - padding;
    
    const snappedPosition = {
      x: snappedX,
      y: clampedY,
    };
    
    setPosition(snappedPosition);
    
    // Haptic feedback on drag end - double tap pattern
    if (navigator.vibrate) {
      navigator.vibrate([15, 30, 15]);
    }
    
    // Save to localStorage
    try {
      localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(snappedPosition));
    } catch {}
    
    // Small delay to prevent click after drag
    setTimeout(() => setIsDragging(false), 100);
  }, [position, isMobile]);

  const handleButtonClick = useCallback(() => {
    if (!isDragging) {
      setIsOpen(true);
    }
  }, [isDragging]);


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
      <AnimatePresence mode="popLayout">
        {position && !shouldHideButton && (
          <motion.button
            key="ai-chatbot-button"
            ref={buttonRef}
            drag
            dragMomentum={false}
            dragElastic={0.1}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onClick={handleButtonClick}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            whileHover={!isDragging ? { scale: 1.08 } : undefined}
            whileTap={!isDragging ? { scale: 0.92 } : undefined}
            transition={{ 
              type: "spring", 
              stiffness: 400, 
              damping: 25,
            }}
            style={{
              position: "fixed",
              left: position.x,
              top: position.y,
              width: buttonSize,
              height: buttonSize,
              zIndex: 50,
              touchAction: "none",
            }}
            className={cn(
              "flex items-center justify-center rounded-2xl cursor-grab active:cursor-grabbing",
              "bg-gradient-to-br from-primary via-primary to-accent text-primary-foreground",
              "shadow-[0_4px_20px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_30px_rgba(0,0,0,0.2)]",
              isDragging && "shadow-[0_8px_40px_rgba(0,0,0,0.25)] ring-2 ring-primary-foreground/20"
            )}
            aria-label="Abrir asistente IA"
          >
            {/* Pulsing ring effect */}
            <motion.div
              className="absolute inset-0 rounded-2xl bg-primary/30"
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
            />
            
            {canAccessChatbot ? (
              <div className="relative z-10">
                <motion.div
                  animate={unreadCount > 0 ? { rotate: [0, -10, 10, -10, 0] } : {}}
                  transition={{ repeat: unreadCount > 0 ? Infinity : 0, duration: 0.5, repeatDelay: 2 }}
                >
                  <MessageCircle className={isMobile ? "h-5 w-5" : "h-6 w-6"} />
                </motion.div>
                {/* Enhanced Unread badge */}
                <AnimatePresence mode="wait">
                  {unreadCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className={cn(
                        "absolute flex items-center justify-center rounded-full",
                        "bg-destructive text-destructive-foreground font-bold",
                        "ring-2 ring-background",
                        isMobile 
                          ? "-top-1 -right-1 h-4 w-4 text-[9px]" 
                          : "-top-1.5 -right-1.5 h-5 w-5 text-[10px]"
                      )}
                    >
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="relative z-10">
                <MessageCircle className={isMobile ? "h-5 w-5" : "h-6 w-6"} />
                <Lock className={cn("absolute -bottom-0.5 -right-0.5 bg-background rounded-full p-0.5", isMobile ? "h-3 w-3" : "h-3.5 w-3.5")} />
              </div>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className={cn(
              "fixed z-50 rounded-2xl border bg-background/95 backdrop-blur-xl",
              "shadow-[0_8px_40px_rgba(0,0,0,0.12)]",
              isMobile 
                ? "inset-x-3 bottom-20 top-auto max-h-[70vh]"
                : "bottom-20 right-4 w-[380px] max-w-[calc(100vw-2rem)]"
            )}
          >
            {/* Header with gradient */}
            <div className="relative overflow-hidden rounded-t-2xl border-b">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10" />
              <div className="relative flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <motion.div 
                    whileHover={{ rotate: [0, -5, 5, 0] }}
                    transition={{ duration: 0.3 }}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-md"
                  >
                    <Bot className="h-5 w-5" />
                  </motion.div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm">Asistente KIKI</h3>
                      {tier !== 'free' && (
                        <span className={cn(
                          "text-[9px] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wide",
                          tier === 'premium' 
                            ? "bg-gradient-to-r from-yellow-400 to-orange-400 text-white" 
                            : "bg-primary/20 text-primary"
                        )}>
                          {tier === 'premium' ? '✨ Premium' : 'Plus'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      <p className="text-[10px] text-muted-foreground">En línea • Responde al instante</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  {canAccessChatbot && messages.length > 0 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => {
                        clearChat();
                        triggerHaptic("light");
                      }}
                      title="Limpiar chat"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg"
                    onClick={() => {
                      setIsOpen(false);
                      triggerHaptic("light");
                    }}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
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
                  <div className="flex flex-col items-center justify-center h-full text-center px-2">
                    {/* Animated Bot Avatar */}
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 260, damping: 20 }}
                      className="relative mb-4"
                    >
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-accent flex items-center justify-center shadow-lg">
                        <Bot className="h-8 w-8 text-primary-foreground" />
                      </div>
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 2, repeatDelay: 1 }}
                        className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-background flex items-center justify-center"
                      >
                        <Zap className="h-2.5 w-2.5 text-white" />
                      </motion.div>
                    </motion.div>
                    
                    <motion.div
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      <p className="text-base font-semibold">¡Hola! 👋</p>
                      <p className="text-xs text-muted-foreground mt-1 mb-5">
                        Soy tu asistente personal. ¿En qué puedo ayudarte?
                      </p>
                    </motion.div>
                    
                    <motion.div 
                      initial={{ y: 15, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="grid grid-cols-2 gap-2 w-full"
                    >
                      {SUGGESTED_QUESTIONS.map((question, i) => (
                        <motion.button
                          key={i}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleSuggestionClick(question.text)}
                          disabled={isLoading}
                          className={cn(
                            "flex items-center gap-2 text-left text-xs px-3 py-2.5 rounded-xl",
                            "bg-muted/60 hover:bg-muted border border-border/50",
                            "transition-colors duration-200",
                            "disabled:opacity-50 disabled:cursor-not-allowed"
                          )}
                        >
                          <span className="text-base">{question.emoji}</span>
                          <span className="line-clamp-2">{question.text}</span>
                        </motion.button>
                      ))}
                    </motion.div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className={cn(
                          "flex gap-2",
                          msg.role === "user" ? "justify-end" : "justify-start"
                        )}
                      >
                        {msg.role === "assistant" && (
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-sm">
                            <Bot className="h-3.5 w-3.5" />
                          </div>
                        )}
                        <div
                          className={cn(
                            "rounded-2xl px-3.5 py-2.5 text-sm max-w-[80%]",
                            msg.role === "user"
                              ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-tr-md"
                              : "bg-muted/80 border border-border/30 rounded-tl-md"
                          )}
                        >
                          <FormattedMessage 
                            content={msg.content} 
                            isUser={msg.role === "user"} 
                            onNavigate={handleNavigate}
                            onCreateQuedada={handleCreateQuedada}
                            onDeleteQuedada={handleDeleteQuedada}
                            onSuggestionClick={handleSuggestionClick}
                            showCopyButton={msg.role === "assistant" && msg.content !== ""}
                            canCreateQuedadas={canCreateQuedadas}
                            canDeleteQuedadas={canDeleteQuedadas}
                            isLastMessage={i === messages.length - 1 && msg.role === "assistant"}
                            isLoading={isLoading}
                          />
                        </div>
                        {msg.role === "user" && (
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground shadow-sm">
                            <User className="h-3.5 w-3.5" />
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
                {error && (
                  <div className="mt-2 rounded-lg bg-destructive/10 p-2 text-xs text-destructive">
                    {error}
                  </div>
                )}
              </ScrollArea>

              {/* Enhanced Input */}
              <form onSubmit={handleSubmit} className="border-t p-3 bg-muted/30">
                <div className="flex gap-2 items-center">
                  <div className="relative flex-1">
                    <Input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Escribe tu mensaje..."
                      disabled={isLoading}
                      className="flex-1 text-sm rounded-xl pr-10 bg-background border-border/50 focus-visible:ring-primary/30"
                    />
                    {isLoading && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        >
                          <Zap className="h-4 w-4 text-primary" />
                        </motion.div>
                      </div>
                    )}
                  </div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      type="submit"
                      size="icon"
                      disabled={!input.trim() || isLoading}
                      className="shrink-0 rounded-xl bg-gradient-to-br from-primary to-accent hover:opacity-90 shadow-md"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </motion.div>
                </div>
              </form>
            </>
          )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
