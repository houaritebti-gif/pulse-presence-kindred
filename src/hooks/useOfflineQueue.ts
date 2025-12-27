import { useState, useEffect, useCallback } from 'react';
import { useOnlineStatus } from './useOnlineStatus';
import { toast } from 'sonner';
import { showBrowserNotification, getNotificationPermission } from '@/utils/browserNotifications';
import { playSyncSuccessSound } from '@/utils/notificationSound';

interface QueuedMessage {
  id: string;
  type: 'spark' | 'quedada';
  chatId: string;
  content: string;
  timestamp: number;
  status: 'pending' | 'sending' | 'failed';
  retryCount: number;
  metadata?: {
    recipientProfileId?: string;
    recipientProfileIds?: string[];
    quedadaTitle?: string;
  };
}

const QUEUE_STORAGE_KEY = 'offline_message_queue';
const MAX_RETRIES = 3;

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
  const addToQueue = useCallback((message: Omit<QueuedMessage, 'id' | 'timestamp' | 'status' | 'retryCount'>) => {
    const queuedMessage: QueuedMessage = {
      ...message,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0,
    };

    setQueue(prev => [...prev, queuedMessage]);
    
    return queuedMessage;
  }, []);

  // Remove message from queue
  const removeFromQueue = useCallback((messageId: string) => {
    setQueue(prev => prev.filter(msg => msg.id !== messageId));
  }, []);

  // Update message status
  const updateMessageStatus = useCallback((messageId: string, status: QueuedMessage['status']) => {
    setQueue(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, status } : msg
    ));
  }, []);

  // Mark message as failed
  const markAsFailed = useCallback((messageId: string) => {
    setQueue(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, status: 'failed' as const, retryCount: msg.retryCount + 1 } 
        : msg
    ));
  }, []);

  // Reset message for retry
  const resetForRetry = useCallback((messageId: string) => {
    setQueue(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, status: 'pending' as const } : msg
    ));
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

  // Check if message can be retried
  const canRetry = useCallback((messageId: string) => {
    const msg = queue.find(m => m.id === messageId);
    return msg && msg.retryCount < MAX_RETRIES;
  }, [queue]);

  // Send browser notification and play sound for synced messages
  const notifySyncSuccess = useCallback((count: number, isBackground: boolean = false) => {
    // Play sync success sound
    playSyncSuccessSound();
    
    // Only show browser notification if app is in background
    if (isBackground && getNotificationPermission() === 'granted') {
      showBrowserNotification(
        '✓ Mensajes enviados',
        {
          body: `${count} mensaje${count > 1 ? 's' : ''} pendiente${count > 1 ? 's' : ''} enviado${count > 1 ? 's' : ''} correctamente`,
          icon: '/pwa-192x192.png',
          tag: 'offline-sync',
        }
      );
    }
  }, []);

  return {
    isOnline,
    wasOffline,
    queue,
    pendingCount,
    isSyncing,
    setIsSyncing,
    addToQueue,
    removeFromQueue,
    updateMessageStatus,
    markAsFailed,
    resetForRetry,
    clearQueue,
    getMessagesForChat,
    canRetry,
    notifySyncSuccess,
    MAX_RETRIES,
  };
};
