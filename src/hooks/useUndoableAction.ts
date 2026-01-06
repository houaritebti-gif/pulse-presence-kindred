import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { Undo2 } from "lucide-react";
import { createElement } from "react";

interface UndoableActionOptions {
  /** Duration in ms before action is executed (default: 5000) */
  timeout?: number;
  /** Toast message shown during undo window */
  message: string;
  /** Action description for undo button */
  undoLabel?: string;
  /** Called when action is confirmed (timeout elapsed) */
  onConfirm: () => Promise<void>;
  /** Called when action is undone */
  onUndo?: () => void;
  /** Called on error */
  onError?: (error: Error) => void;
}

interface PendingAction {
  id: string;
  timeoutId: ReturnType<typeof setTimeout>;
  toastId: string | number;
}

export const useUndoableAction = () => {
  const pendingActions = useRef<Map<string, PendingAction>>(new Map());
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const execute = useCallback(async (
    actionId: string,
    options: UndoableActionOptions
  ) => {
    const { 
      timeout = 5000, 
      message, 
      undoLabel = "Deshacer",
      onConfirm, 
      onUndo,
      onError 
    } = options;

    // Cancel any existing pending action with same ID
    const existing = pendingActions.current.get(actionId);
    if (existing) {
      clearTimeout(existing.timeoutId);
      toast.dismiss(existing.toastId);
    }

    // Mark as pending
    setPendingIds(prev => new Set(prev).add(actionId));

    // Create the confirm timeout
    const timeoutId = setTimeout(async () => {
      try {
        await onConfirm();
        pendingActions.current.delete(actionId);
        setPendingIds(prev => {
          const next = new Set(prev);
          next.delete(actionId);
          return next;
        });
      } catch (error) {
        onError?.(error as Error);
        toast.error("Error: " + (error as Error).message);
      }
    }, timeout);

    // Show undo toast
    const toastId = toast(message, {
      duration: timeout,
      icon: createElement(Undo2, { className: "w-4 h-4" }),
      action: {
        label: undoLabel,
        onClick: () => {
          // Cancel the action
          clearTimeout(timeoutId);
          pendingActions.current.delete(actionId);
          setPendingIds(prev => {
            const next = new Set(prev);
            next.delete(actionId);
            return next;
          });
          onUndo?.();
          toast.success("Acción deshecha");
        },
      },
      onDismiss: () => {
        // If dismissed without undo, the timeout will still execute
      },
    });

    // Store pending action
    pendingActions.current.set(actionId, {
      id: actionId,
      timeoutId,
      toastId,
    });
  }, []);

  const cancel = useCallback((actionId: string) => {
    const pending = pendingActions.current.get(actionId);
    if (pending) {
      clearTimeout(pending.timeoutId);
      toast.dismiss(pending.toastId);
      pendingActions.current.delete(actionId);
      setPendingIds(prev => {
        const next = new Set(prev);
        next.delete(actionId);
        return next;
      });
    }
  }, []);

  const cancelAll = useCallback(() => {
    pendingActions.current.forEach((pending) => {
      clearTimeout(pending.timeoutId);
      toast.dismiss(pending.toastId);
    });
    pendingActions.current.clear();
    setPendingIds(new Set());
  }, []);

  const isPending = useCallback((actionId: string) => {
    return pendingIds.has(actionId);
  }, [pendingIds]);

  return {
    execute,
    cancel,
    cancelAll,
    isPending,
    pendingIds,
  };
};
