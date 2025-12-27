import { useState, useEffect, useCallback } from 'react';
import { useOnlineStatus } from './useOnlineStatus';
import { toast } from 'sonner';
import { showBrowserNotification, getNotificationPermission } from '@/utils/browserNotifications';
import { playSyncSuccessSound } from '@/utils/notificationSound';
import {
  QueuedMessage,
  addMessageToDB,
  removeMessageFromDB,
  updateMessageInDB,
  getAllMessagesFromDB,
  registerBackgroundSync,
  migrateFromLocalStorage,
} from '@/utils/offlineQueueDB';

const MAX_RETRIES = 3;

// Store Supabase config for Service Worker
const storeSupabaseConfigForSW = async (senderProfileId: string) => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      registration.active?.postMessage({
        type: 'STORE_SUPABASE_CONFIG',
        config: {
          supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
          supabaseKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          senderProfileId,
        },
      });
    } catch (error) {
      console.error('Failed to store Supabase config for SW:', error);
    }
  }
};

// Listen for sync complete messages from Service Worker
const setupSWListener = (onSyncComplete: (count: number) => void) => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data.type === 'SYNC_COMPLETE') {
        onSyncComplete(event.data.count);
      }
    });
  }
};

export const useOfflineQueue = () => {
  const { isOnline, wasOffline } = useOnlineStatus();
  const [queue, setQueue] = useState<QueuedMessage[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load queue from IndexedDB on mount
  useEffect(() => {
    const initializeQueue = async () => {
      try {
        // First migrate any existing localStorage data
        await migrateFromLocalStorage();
        
        // Then load from IndexedDB
        const messages = await getAllMessagesFromDB();
        setQueue(messages);
        setIsInitialized(true);
      } catch (error) {
        console.error('Error loading offline queue:', error);
        setIsInitialized(true);
      }
    };

    initializeQueue();
  }, []);

  // Set up Service Worker message listener
  useEffect(() => {
    const handleSyncComplete = (count: number) => {
      // Refresh queue from IndexedDB
      getAllMessagesFromDB().then(setQueue);
      
      // Play success sound
      playSyncSuccessSound();
      
      // Show toast if app is visible
      if (document.visibilityState === 'visible') {
        toast.success(`${count} mensaje${count > 1 ? 's' : ''} enviado${count > 1 ? 's' : ''}`);
      }
    };

    setupSWListener(handleSyncComplete);
  }, []);

  // Add message to queue
  const addToQueue = useCallback(async (
    message: Omit<QueuedMessage, 'id' | 'timestamp' | 'status' | 'retryCount'>
  ) => {
    const queuedMessage: QueuedMessage = {
      ...message,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0,
    };

    // Add to IndexedDB
    await addMessageToDB(queuedMessage);
    
    // Update local state
    setQueue(prev => [...prev, queuedMessage]);
    
    // Register for background sync
    const registered = await registerBackgroundSync();
    if (registered) {
      console.log('Background sync registered for offline message');
    }
    
    return queuedMessage;
  }, []);

  // Remove message from queue
  const removeFromQueue = useCallback(async (messageId: string) => {
    await removeMessageFromDB(messageId);
    setQueue(prev => prev.filter(msg => msg.id !== messageId));
  }, []);

  // Update message status
  const updateMessageStatus = useCallback(async (messageId: string, status: QueuedMessage['status']) => {
    await updateMessageInDB(messageId, { status });
    setQueue(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, status } : msg
    ));
  }, []);

  // Mark message as failed
  const markAsFailed = useCallback(async (messageId: string) => {
    const message = queue.find(m => m.id === messageId);
    if (message) {
      const newRetryCount = message.retryCount + 1;
      await updateMessageInDB(messageId, { 
        status: 'failed' as const, 
        retryCount: newRetryCount 
      });
      setQueue(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, status: 'failed' as const, retryCount: newRetryCount } 
          : msg
      ));
    }
  }, [queue]);

  // Reset message for retry
  const resetForRetry = useCallback(async (messageId: string) => {
    await updateMessageInDB(messageId, { status: 'pending' as const });
    setQueue(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, status: 'pending' as const } : msg
    ));
    
    // Register for background sync again
    await registerBackgroundSync();
  }, []);

  // Clear all messages from queue
  const clearQueue = useCallback(async () => {
    const { clearAllMessagesFromDB } = await import('@/utils/offlineQueueDB');
    await clearAllMessagesFromDB();
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

  // Trigger manual sync via Service Worker
  const triggerBackgroundSync = useCallback(async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        registration.active?.postMessage({ type: 'TRIGGER_SYNC' });
      } catch (error) {
        console.error('Failed to trigger background sync:', error);
      }
    }
  }, []);

  return {
    isOnline,
    wasOffline,
    queue,
    pendingCount,
    isSyncing,
    setIsSyncing,
    isInitialized,
    addToQueue,
    removeFromQueue,
    updateMessageStatus,
    markAsFailed,
    resetForRetry,
    clearQueue,
    getMessagesForChat,
    canRetry,
    notifySyncSuccess,
    triggerBackgroundSync,
    storeSupabaseConfigForSW,
    MAX_RETRIES,
  };
};

export type { QueuedMessage };
