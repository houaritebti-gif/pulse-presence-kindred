import { useState } from "react";
import { Keyboard, X } from "lucide-react";
import { useKeyboardShortcutsHelp } from "@/hooks/useKeyboardShortcuts";

export const KeyboardShortcutsHelp = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { shortcuts } = useKeyboardShortcutsHelp();

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 z-40 p-3 bg-secondary/80 backdrop-blur-sm rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-all shadow-lg focus-ring"
        title="Atajos de teclado"
        aria-label="Mostrar atajos de teclado"
      >
        <Keyboard className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div 
        className="bg-card text-card-foreground rounded-2xl shadow-xl max-w-sm w-full p-6 animate-scale-in"
        role="dialog"
        aria-labelledby="shortcuts-title"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="shortcuts-title" className="font-display text-lg font-semibold flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-primary" />
            Atajos de teclado
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-full hover:bg-muted/50 transition-colors focus-ring"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <ul className="space-y-2">
          {shortcuts.map((shortcut) => (
            <li 
              key={shortcut.keys} 
              className="flex items-center justify-between py-2 border-b border-border/30 last:border-0"
            >
              <span className="font-body text-sm text-foreground">
                {shortcut.description}
              </span>
              <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono text-muted-foreground">
                {shortcut.keys}
              </kbd>
            </li>
          ))}
        </ul>

        <p className="mt-4 text-xs text-muted-foreground text-center font-body">
          Usa Tab para navegar entre elementos
        </p>
      </div>
    </div>
  );
};
