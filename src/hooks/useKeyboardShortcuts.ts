import { useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";

type ShortcutHandler = () => void;

interface Shortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  handler: ShortcutHandler;
  description: string;
}

export const useKeyboardShortcuts = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Define shortcuts
  const shortcuts: Shortcut[] = [
    {
      key: "1",
      alt: true,
      handler: () => navigate("/presence"),
      description: "Ir a Presencia",
    },
    {
      key: "2",
      alt: true,
      handler: () => navigate("/sparks"),
      description: "Ir a Sparks",
    },
    {
      key: "3",
      alt: true,
      handler: () => navigate("/quedadas"),
      description: "Ir a Quedadas",
    },
    {
      key: "4",
      alt: true,
      handler: () => navigate("/notifications"),
      description: "Ir a Notificaciones",
    },
    {
      key: "5",
      alt: true,
      handler: () => navigate("/profile"),
      description: "Ir a Perfil",
    },
    {
      key: "Escape",
      handler: () => {
        // Close any open modals or go back
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement && activeElement !== document.body) {
          activeElement.blur();
        }
      },
      description: "Cerrar modal o deseleccionar",
    },
  ];

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement;
    const isTyping = target.tagName === "INPUT" || 
                     target.tagName === "TEXTAREA" || 
                     target.isContentEditable;

    if (isTyping && event.key !== "Escape") {
      return;
    }

    for (const shortcut of shortcuts) {
      const keyMatch = event.key === shortcut.key || 
                       event.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
      const altMatch = shortcut.alt ? event.altKey : !event.altKey;
      const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;

      if (keyMatch && ctrlMatch && altMatch && shiftMatch) {
        event.preventDefault();
        shortcut.handler();
        return;
      }
    }
  }, [navigate, location]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return { shortcuts };
};

// Hook to show keyboard shortcuts help
export const useKeyboardShortcutsHelp = () => {
  const shortcuts = [
    { keys: "Alt + 1", description: "Ir a Presencia" },
    { keys: "Alt + 2", description: "Ir a Sparks" },
    { keys: "Alt + 3", description: "Ir a Quedadas" },
    { keys: "Alt + 4", description: "Ir a Notificaciones" },
    { keys: "Alt + 5", description: "Ir a Perfil" },
    { keys: "Escape", description: "Cerrar modal" },
    { keys: "Tab", description: "Navegar entre elementos" },
    { keys: "Enter/Space", description: "Activar elemento" },
  ];

  return { shortcuts };
};
