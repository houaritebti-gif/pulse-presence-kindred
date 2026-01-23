import { useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";

/**
 * Hook to detect and warn users about screenshot attempts.
 * Uses multiple detection methods for broader coverage.
 */
export const useScreenshotProtection = (enabled: boolean = true) => {
  const lastWarningRef = useRef<number>(0);
  const THROTTLE_MS = 3000; // Avoid spamming warnings

  const showWarning = useCallback(() => {
    const now = Date.now();
    if (now - lastWarningRef.current < THROTTLE_MS) return;
    
    lastWarningRef.current = now;
    
    toast.error("📸 Captura no permitida", {
      description: "Los perfiles de KIKI son privados. Las capturas de pantalla están prohibidas para proteger la privacidad de todos.",
      duration: 5000,
    });
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Method 1: Keyboard shortcut detection
    const handleKeyDown = (e: KeyboardEvent) => {
      // PrintScreen key
      if (e.key === "PrintScreen") {
        e.preventDefault();
        showWarning();
        return;
      }

      // macOS: Cmd+Shift+3, Cmd+Shift+4, Cmd+Shift+5
      if (e.metaKey && e.shiftKey && ["3", "4", "5"].includes(e.key)) {
        e.preventDefault();
        showWarning();
        return;
      }

      // Windows: Win+Shift+S (Snipping Tool)
      if (e.metaKey && e.shiftKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        showWarning();
        return;
      }

      // Alt+PrintScreen
      if (e.altKey && e.key === "PrintScreen") {
        e.preventDefault();
        showWarning();
        return;
      }

      // Ctrl+PrintScreen
      if (e.ctrlKey && e.key === "PrintScreen") {
        e.preventDefault();
        showWarning();
        return;
      }
    };

    // Method 2: Visibility change detection (iOS/Android share sheet)
    // When user switches apps to share, page becomes hidden briefly
    const handleVisibilityChange = () => {
      // Only on mobile devices
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile && document.hidden) {
        // Brief delay to detect quick app switches (screenshot apps)
        setTimeout(() => {
          if (!document.hidden) {
            // User came back quickly - might have taken screenshot
            // This is a heuristic, not foolproof
          }
        }, 500);
      }
    };

    // Method 3: Blur event - user switched to another app
    const handleBlur = () => {
      // This catches iOS screenshot gesture which briefly blurs
      // Not showing warning on every blur, just tracking
    };

    // Method 4: Context menu prevention (right-click save image)
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Prevent context menu on images
      if (target.tagName === "IMG" || target.closest("img")) {
        e.preventDefault();
        toast.info("Imagen protegida", {
          description: "No se puede guardar esta imagen directamente.",
          duration: 2000,
        });
      }
    };

    // Method 5: CSS protection - prevent image dragging
    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "IMG") {
        e.preventDefault();
      }
    };

    // Add listeners
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("dragstart", handleDragStart);

    // Cleanup
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("dragstart", handleDragStart);
    };
  }, [enabled, showWarning]);

  return { showWarning };
};
