import { useCallback, useRef, useState } from "react";

interface UseListKeyboardNavigationProps {
  itemCount: number;
  onSelect?: (index: number) => void;
}

export const useListKeyboardNavigation = ({
  itemCount,
  onSelect,
}: UseListKeyboardNavigationProps) => {
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const focusItem = useCallback((index: number) => {
    if (index < 0 || index >= itemCount) return;
    
    const container = containerRef.current;
    if (!container) return;

    const items = container.querySelectorAll('[role="listitem"]');
    const targetItem = items[index] as HTMLElement;
    
    if (targetItem) {
      // Find the focusable element within the list item
      const focusable = targetItem.querySelector('button, [tabindex="0"]') as HTMLElement;
      if (focusable) {
        focusable.focus();
        setFocusedIndex(index);
        
        // Scroll into view if needed
        focusable.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [itemCount]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    const { key } = event;
    
    switch (key) {
      case "ArrowDown":
        event.preventDefault();
        focusItem(focusedIndex === -1 ? 0 : Math.min(focusedIndex + 1, itemCount - 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        focusItem(focusedIndex === -1 ? itemCount - 1 : Math.max(focusedIndex - 1, 0));
        break;
      case "Home":
        event.preventDefault();
        focusItem(0);
        break;
      case "End":
        event.preventDefault();
        focusItem(itemCount - 1);
        break;
      case "Enter":
      case " ":
        if (focusedIndex >= 0 && onSelect) {
          event.preventDefault();
          onSelect(focusedIndex);
        }
        break;
    }
  }, [focusedIndex, itemCount, focusItem, onSelect]);

  const getContainerProps = useCallback(() => ({
    ref: containerRef,
    role: "list" as const,
    "aria-label": "Lista de elementos",
    onKeyDown: handleKeyDown,
    tabIndex: focusedIndex === -1 ? 0 : -1,
  }), [handleKeyDown, focusedIndex]);

  const getItemProps = useCallback((index: number) => ({
    role: "listitem" as const,
    "aria-posinset": index + 1,
    "aria-setsize": itemCount,
    tabIndex: focusedIndex === index ? 0 : -1,
  }), [itemCount, focusedIndex]);

  return {
    focusedIndex,
    setFocusedIndex,
    containerRef,
    handleKeyDown,
    getContainerProps,
    getItemProps,
    focusItem,
  };
};
