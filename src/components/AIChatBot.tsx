import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, X, Send, Trash2, Bot, User } from "lucide-react";
import { useAIChat } from "@/hooks/useAIChat";
import { cn } from "@/lib/utils";

const SUGGESTED_QUESTIONS = [
  "¿Cuáles son mis quedadas?",
  "¿Con quién tengo sparks?",
  "¿Cómo creo una quedada?",
  "¿Qué son los sparks?",
  "¿Cómo conecto con otros usuarios?",
];

export const AIChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const { messages, isLoading, error, sendMessage, clearChat } = useAIChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
                      {msg.content || (
                        <span className="inline-flex gap-1">
                          <span className="animate-bounce">·</span>
                          <span className="animate-bounce delay-100">·</span>
                          <span className="animate-bounce delay-200">·</span>
                        </span>
                      )}
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
