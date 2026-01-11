import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface ChatInputContextType {
  isTypingInChat: boolean;
  setTypingInChat: (value: boolean) => void;
}

const ChatInputContext = createContext<ChatInputContextType | undefined>(undefined);

export const ChatInputProvider = ({ children }: { children: ReactNode }) => {
  const [isTypingInChat, setIsTypingInChat] = useState(false);

  const setTypingInChat = useCallback((value: boolean) => {
    setIsTypingInChat(value);
  }, []);

  return (
    <ChatInputContext.Provider value={{ isTypingInChat, setTypingInChat }}>
      {children}
    </ChatInputContext.Provider>
  );
};

export const useChatInput = () => {
  const context = useContext(ChatInputContext);
  if (!context) {
    throw new Error("useChatInput must be used within a ChatInputProvider");
  }
  return context;
};
