import { memo, useRef, useEffect, useState, CSSProperties, ReactElement } from "react";
import { List } from "react-window";
import { X } from "lucide-react";
import SparkChatItem from "./SparkChatItem";
import SwipeableListItem from "./SwipeableListItem";
import { SparkChat } from "@/hooks/useSparks";

interface VirtualizedSparksListProps {
  chats: SparkChat[];
  exitingSparks: Set<string>;
  pendingIds: Set<string>;
  onExtinguish: (chatId: string, chatName?: string) => void;
}

interface RowData {
  chats: SparkChat[];
  exitingSparks: Set<string>;
  pendingIds: Set<string>;
  onExtinguish: (chatId: string, chatName?: string) => void;
}

const ITEM_HEIGHT = 100; // Estimated height of SparkChatItem + gap

// Virtualized row component
const Row = ({
  index,
  style,
  data,
}: {
  index: number;
  style: CSSProperties;
  data: RowData;
}): ReactElement => {
  const { chats, exitingSparks, pendingIds, onExtinguish } = data;
  const chat = chats[index];
  const isExiting = exitingSparks.has(chat.id);

  return (
    <div style={{ ...style, paddingBottom: 16 }}>
      <SwipeableListItem
        itemKey={chat.id}
        leftAction={{
          type: "delete",
          icon: <X className="w-5 h-5" />,
          color: "hsl(var(--destructive))",
        }}
        onLeftAction={() => onExtinguish(chat.id, chat.other_profile?.name)}
        disabled={isExiting || pendingIds.has(chat.id)}
        className={`transition-all duration-400 ${
          isExiting
            ? "opacity-0 scale-95 translate-x-8 pointer-events-none"
            : ""
        }`}
      >
        <SparkChatItem chat={chat} />
      </SwipeableListItem>
    </div>
  );
};

// Threshold for enabling virtualization
const VIRTUALIZATION_THRESHOLD = 15;

export const VirtualizedSparksList = memo(({
  chats,
  exitingSparks,
  pendingIds,
  onExtinguish,
}: VirtualizedSparksListProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [listHeight, setListHeight] = useState(500);

  // Calculate available height for virtualized list
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const availableHeight = window.innerHeight - rect.top - 120;
        setListHeight(Math.max(300, availableHeight));
      }
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  const rowData: RowData = {
    chats,
    exitingSparks,
    pendingIds,
    onExtinguish,
  };

  // For small lists, render normally without virtualization
  if (chats.length < VIRTUALIZATION_THRESHOLD) {
    return (
      <div
        aria-label="Lista de chispas"
        className="space-y-4 pb-6"
      >
        {chats.map((chat, index) => {
          const isExiting = exitingSparks.has(chat.id);
          return (
            <div
              key={chat.id}
              className="animate-fade-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <SwipeableListItem
                itemKey={chat.id}
                leftAction={{
                  type: "delete",
                  icon: <X className="w-5 h-5" />,
                  color: "hsl(var(--destructive))",
                }}
                onLeftAction={() => onExtinguish(chat.id, chat.other_profile?.name)}
                disabled={isExiting || pendingIds.has(chat.id)}
                className={`transition-all duration-400 ${
                  isExiting
                    ? "opacity-0 scale-95 translate-x-8 pointer-events-none"
                    : ""
                }`}
              >
                <SparkChatItem chat={chat} />
              </SwipeableListItem>
            </div>
          );
        })}
      </div>
    );
  }

  // Use virtualization for large lists
  return (
    <div ref={containerRef} aria-label="Lista de chispas">
      <List<{ data: RowData }>
        style={{ height: listHeight, width: "100%" }}
        rowCount={chats.length}
        rowHeight={ITEM_HEIGHT}
        rowProps={{ data: rowData }}
        rowComponent={Row as any}
        overscanCount={3}
        className="scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
      />
    </div>
  );
});

VirtualizedSparksList.displayName = "VirtualizedSparksList";

export default VirtualizedSparksList;
