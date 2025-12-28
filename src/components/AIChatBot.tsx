import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, X, Send, Trash2, Bot, User, Sparkles, Calendar, Users, UserCircle, Radio, Copy, Check, Plus, Pencil } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAIChat } from "@/hooks/useAIChat";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { TypingIndicator } from "./TypingIndicator";
import { useCreateQuedada } from "@/hooks/useQuedadas";
import { useProfile } from "@/hooks/useProfile";

const SUGGESTED_QUESTIONS = [
  "¿Cuáles son mis quedadas?",
  "¿Con quién tengo sparks?",
  "Crear quedada para mañana a las 20h",
  "¿Qué son los sparks?",
  "¿Cómo conecto con otros usuarios?",
];

// Action buttons that can be suggested by the AI
interface QuickAction {
  label: string;
  route: string;
  icon: "sparks" | "quedadas" | "presence" | "profile" | "create";
}

// Quedada creation data extracted from AI
interface QuedadaCreationData {
  title: string;
  event_date: string;
  description: string;
  location_hint: string;
}

const ACTION_ICONS = {
  sparks: Sparkles,
  quedadas: Calendar,
  presence: Radio,
  profile: UserCircle,
  create: Users,
};

// Detect action patterns and quedada creation in text
const extractActions = (text: string): { 
  cleanText: string; 
  actions: QuickAction[]; 
  quedadaCreation: QuedadaCreationData | null;
} => {
  const actions: QuickAction[] = [];
  let cleanText = text;
  let quedadaCreation: QuedadaCreationData | null = null;

  // Pattern: [[action:label|route|icon]]
  const actionPattern = /\[\[action:([^|]+)\|([^|]+)\|([^\]]+)\]\]/g;
  let match;

  while ((match = actionPattern.exec(text)) !== null) {
    actions.push({
      label: match[1].trim(),
      route: match[2].trim(),
      icon: match[3].trim() as QuickAction["icon"],
    });
  }

  // Pattern: [[create_quedada:title|date_iso|description|location]]
  const quedadaPattern = /\[\[create_quedada:([^|]*)\|([^|]*)\|([^|]*)\|([^\]]*)\]\]/;
  const quedadaMatch = text.match(quedadaPattern);
  
  if (quedadaMatch) {
    quedadaCreation = {
      title: quedadaMatch[1].trim(),
      event_date: quedadaMatch[2].trim(),
      description: quedadaMatch[3].trim(),
      location_hint: quedadaMatch[4].trim(),
    };
  }

  // Remove action patterns from text
  cleanText = text.replace(actionPattern, "").replace(quedadaPattern, "").trim();

  return { cleanText, actions, quedadaCreation };
};

// Simple markdown parser for chat messages
const parseMarkdown = (text: string): React.ReactNode[] => {
  const elements: React.ReactNode[] = [];
  const lines = text.split("\n");
  let listItems: string[] = [];
  let listType: "ul" | "ol" | null = null;

  const flushList = () => {
    if (listItems.length > 0 && listType) {
      const ListTag = listType === "ul" ? "ul" : "ol";
      elements.push(
        <ListTag key={elements.length} className={cn("my-1 ml-4", listType === "ul" ? "list-disc" : "list-decimal")}>
          {listItems.map((item, i) => (
            <li key={i} className="text-sm">{parseInline(item)}</li>
          ))}
        </ListTag>
      );
      listItems = [];
      listType = null;
    }
  };

  const parseInline = (line: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let remaining = line;
    let key = 0;

    while (remaining.length > 0) {
      const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch && linkMatch.index !== undefined) {
        if (linkMatch.index > 0) {
          parts.push(<span key={key++}>{parseTextStyles(remaining.slice(0, linkMatch.index))}</span>);
        }
        const url = linkMatch[2];
        const isInternal = url.startsWith("/");
        parts.push(
          <a
            key={key++}
            href={url}
            target={isInternal ? undefined : "_blank"}
            rel={isInternal ? undefined : "noopener noreferrer"}
            className="text-primary underline hover:text-primary/80 cursor-pointer"
            onClick={(e) => {
              if (isInternal) {
                e.preventDefault();
                window.location.href = url;
              }
            }}
          >
            {linkMatch[1]}
          </a>
        );
        remaining = remaining.slice(linkMatch.index + linkMatch[0].length);
        continue;
      }

      parts.push(<span key={key++}>{parseTextStyles(remaining)}</span>);
      break;
    }

    return parts;
  };

  const parseTextStyles = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
      const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
      if (boldMatch && boldMatch.index !== undefined) {
        if (boldMatch.index > 0) {
          parts.push(remaining.slice(0, boldMatch.index));
        }
        parts.push(<strong key={key++}>{boldMatch[1]}</strong>);
        remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
        continue;
      }

      const italicMatch = remaining.match(/\*([^*]+)\*/);
      if (italicMatch && italicMatch.index !== undefined) {
        if (italicMatch.index > 0) {
          parts.push(remaining.slice(0, italicMatch.index));
        }
        parts.push(<em key={key++}>{italicMatch[1]}</em>);
        remaining = remaining.slice(italicMatch.index + italicMatch[0].length);
        continue;
      }

      const codeMatch = remaining.match(/`([^`]+)`/);
      if (codeMatch && codeMatch.index !== undefined) {
        if (codeMatch.index > 0) {
          parts.push(remaining.slice(0, codeMatch.index));
        }
        parts.push(
          <code key={key++} className="bg-muted-foreground/20 px-1 rounded text-xs">
            {codeMatch[1]}
          </code>
        );
        remaining = remaining.slice(codeMatch.index + codeMatch[0].length);
        continue;
      }

      parts.push(remaining);
      break;
    }

    return parts.length === 1 && typeof parts[0] === "string" ? parts[0] : <>{parts}</>;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const ulMatch = line.match(/^[\s]*[-*]\s+(.+)/);
    if (ulMatch) {
      if (listType !== "ul") {
        flushList();
        listType = "ul";
      }
      listItems.push(ulMatch[1]);
      continue;
    }

    const olMatch = line.match(/^[\s]*\d+\.\s+(.+)/);
    if (olMatch) {
      if (listType !== "ol") {
        flushList();
        listType = "ol";
      }
      listItems.push(olMatch[1]);
      continue;
    }

    flushList();

    if (line.trim() === "") {
      elements.push(<br key={elements.length} />);
      continue;
    }

    const h3Match = line.match(/^###\s+(.+)/);
    if (h3Match) {
      elements.push(<h4 key={elements.length} className="font-semibold mt-2 mb-1">{parseInline(h3Match[1])}</h4>);
      continue;
    }

    const h2Match = line.match(/^##\s+(.+)/);
    if (h2Match) {
      elements.push(<h3 key={elements.length} className="font-semibold text-base mt-2 mb-1">{parseInline(h2Match[1])}</h3>);
      continue;
    }

    const h1Match = line.match(/^#\s+(.+)/);
    if (h1Match) {
      elements.push(<h2 key={elements.length} className="font-bold text-base mt-2 mb-1">{parseInline(h1Match[1])}</h2>);
      continue;
    }

    elements.push(<p key={elements.length} className="text-sm">{parseInline(line)}</p>);
  }

  flushList();

  return elements;
};

interface FormattedMessageProps {
  content: string;
  isUser: boolean;
  onNavigate: (route: string) => void;
  onCreateQuedada: (data: QuedadaCreationData) => void;
  showCopyButton?: boolean;
}

const FormattedMessage = ({ content, isUser, onNavigate, onCreateQuedada, showCopyButton = false }: FormattedMessageProps) => {
  const [copied, setCopied] = useState(false);
  const [quedadaCreated, setQuedadaCreated] = useState(false);
  
  const { cleanText, actions, quedadaCreation, parsed } = useMemo(() => {
    if (isUser || !content) return { cleanText: content, actions: [], quedadaCreation: null, parsed: null };
    const extracted = extractActions(content);
    return {
      ...extracted,
      parsed: parseMarkdown(extracted.cleanText),
    };
  }, [content, isUser]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cleanText || content);
      setCopied(true);
      toast({
        description: "Copiado al portapapeles",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        description: "No se pudo copiar",
        variant: "destructive",
      });
    }
  };

  const handleCreateQuedada = () => {
    if (quedadaCreation && !quedadaCreated) {
      onCreateQuedada(quedadaCreation);
      setQuedadaCreated(true);
    }
  };

  if (isUser) {
    return <>{content}</>;
  }

  if (!content) {
    return <TypingIndicator />;
  }

  // Format date for display
  const formatQuedadaDate = (isoDate: string) => {
    try {
      const date = new Date(isoDate);
      return date.toLocaleString("es-ES", {
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoDate;
    }
  };

  return (
    <div className="space-y-2">
      <div className="space-y-1">{parsed}</div>
      
      {/* Quedada creation card */}
      {quedadaCreation && (
        <div className="mt-3 p-3 rounded-lg bg-primary/10 border border-primary/20 space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-primary">
            <Calendar className="h-3.5 w-3.5" />
            <span>Nueva quedada</span>
          </div>
          <div className="space-y-1 text-xs">
            <p><strong>Título:</strong> {quedadaCreation.title}</p>
            <p><strong>Fecha:</strong> {formatQuedadaDate(quedadaCreation.event_date)}</p>
            {quedadaCreation.description && <p><strong>Descripción:</strong> {quedadaCreation.description}</p>}
            {quedadaCreation.location_hint && <p><strong>Lugar:</strong> {quedadaCreation.location_hint}</p>}
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleCreateQuedada}
              disabled={quedadaCreated}
              className={cn(
                "inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full",
                quedadaCreated 
                  ? "bg-green-500 text-white cursor-default"
                  : "bg-primary text-primary-foreground hover:bg-primary/90",
                "transition-colors duration-200"
              )}
            >
              {quedadaCreated ? (
                <>
                  <Check className="h-3 w-3" />
                  Creada
                </>
              ) : (
                <>
                  <Plus className="h-3 w-3" />
                  Crear quedada
                </>
              )}
            </button>
            {!quedadaCreated && (
              <button
                onClick={() => onNavigate("/quedadas")}
                className={cn(
                  "inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full",
                  "bg-muted text-muted-foreground hover:bg-muted/80",
                  "transition-colors duration-200"
                )}
              >
                <Pencil className="h-3 w-3" />
                Editar manualmente
              </button>
            )}
          </div>
        </div>
      )}
      
      {actions.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {actions.map((action, i) => {
            const Icon = ACTION_ICONS[action.icon] || Sparkles;
            return (
              <button
                key={i}
                onClick={() => onNavigate(action.route)}
                className={cn(
                  "inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full",
                  "bg-primary text-primary-foreground",
                  "hover:bg-primary/90 transition-colors duration-200"
                )}
              >
                <Icon className="h-3 w-3" />
                {action.label}
              </button>
            );
          })}
        </div>
      )}
      {showCopyButton && (
        <button
          onClick={handleCopy}
          className={cn(
            "inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground",
            "transition-colors duration-200 mt-1"
          )}
          title="Copiar respuesta"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" />
              <span>Copiado</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copiar</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};

export const AIChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const { messages, isLoading, error, sendMessage, clearChat } = useAIChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const createQuedada = useCreateQuedada();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

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

    try {
      await createQuedada.mutateAsync({
        title: data.title,
        event_date: data.event_date,
        description: data.description || undefined,
        location_hint: data.location_hint || undefined,
      });
      
      // Haptic feedback
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

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-20 right-4 z-50 h-14 w-14 rounded-full shadow-lg",
          "bg-primary hover:bg-primary/90 text-primary-foreground",
          "transition-all duration-300 hover:scale-110",
          isOpen && "hidden"
        )}
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

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
                <h3 className="font-semibold text-sm">Asistente IA</h3>
                <p className="text-xs text-muted-foreground">Siempre disponible</p>
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={clearChat}
                title="Limpiar chat"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
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
                        showCopyButton={msg.role === "assistant" && msg.content !== ""}
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
        </div>
      )}
    </>
  );
};
