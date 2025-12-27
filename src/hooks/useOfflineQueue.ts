import { useState, useEffect, useCallback } from 'react';
import { useOnlineStatus } from './useOnlineStatus';
import { toast } from 'sonner';

interface QueuedMessage {
  id: string;
  type: 'spark' | 'quedada';
  chatId: string;
  content: string;
  timestamp: number;
  metadata?: {
    recipientProfileId?: string;
    recipientProfileIds?: string[];
    quedadaTitle?: string;
  };
}

const QUEUE_STORAGE_KEY = 'offline_message_queue';

export const useOfflineQueue = () => {
  const { isOnline, wasOffline } = useOnlineStatus();
  const [queue, setQueue] = useState<QueuedMessage[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load queue from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(QUEUE_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setQueue(parsed);
      }
    } catch (error) {
      console.error('Error loading offline queue:', error);
    }
  }, []);

  // Save queue to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('Error saving offline queue:', error);
    }
  }, [queue]);

  // Add message to queue
  const addToQueue = useCallback((message: Omit<QueuedMessage, 'id' | 'timestamp'>) => {
    const queuedMessage: QueuedMessage = {
      ...message,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    setQueue(prev => [...prev, queuedMessage]);
    
    return queuedMessage;
  }, []);

  // Remove message from queue
  const removeFromQueue = useCallback((messageId: string) => {
    setQueue(prev => prev.filter(msg => msg.id !== messageId));
  }, []);

  // Clear all messages from queue
  const clearQueue = useCallback(() => {
    setQueue([]);
  }, []);

  // Get pending messages count
  const pendingCount = queue.length;

  // Get messages for a specific chat
  const getMessagesForChat = useCallback((chatId: string, type: 'spark' | 'quedada') => {
    return queue.filter(msg => msg.chatId === chatId && msg.type === type);
  }, [queue]);

  return {
    isOnline,
    wasOffline,
    queue,
    pendingCount,
    isSyncing,
    setIsSyncing,
    addToQueue,
    removeFromQueue,
    clearQueue,
    getMessagesForChat,
  };
};
