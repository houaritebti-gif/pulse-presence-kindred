// IndexedDB utilities for offline queue persistence
// This allows the Service Worker to access the queue even when the app is closed

const DB_NAME = 'OfflineQueueDB';
const DB_VERSION = 1;
const STORE_NAME = 'pending_messages';

export interface QueuedMessage {
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
    senderProfileId?: string;
  };
}

let dbPromise: Promise<IDBDatabase> | null = null;

const openDB = (): Promise<IDBDatabase> => {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Failed to open IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('chatId', 'chatId', { unique: false });
      }
    };
  });

  return dbPromise;
};

export const addMessageToDB = async (message: QueuedMessage): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(message);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const removeMessageFromDB = async (messageId: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(messageId);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const updateMessageInDB = async (messageId: string, updates: Partial<QueuedMessage>): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const getRequest = store.get(messageId);

    getRequest.onsuccess = () => {
      if (getRequest.result) {
        const updated = { ...getRequest.result, ...updates };
        const putRequest = store.put(updated);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      } else {
        resolve(); // Message not found, nothing to update
      }
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
};

export const getAllMessagesFromDB = async (): Promise<QueuedMessage[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

export const getPendingMessagesFromDB = async (): Promise<QueuedMessage[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('status');
    const request = index.getAll('pending');

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

export const clearAllMessagesFromDB = async (): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// Register for background sync
export const registerBackgroundSync = async (tag: string = 'offline-queue-sync'): Promise<boolean> => {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await (registration as any).sync.register(tag);
      console.log('Background sync registered:', tag);
      return true;
    } catch (error) {
      console.error('Failed to register background sync:', error);
      return false;
    }
  }
  return false;
};

// Migrate from localStorage to IndexedDB (one-time migration)
export const migrateFromLocalStorage = async (): Promise<void> => {
  const QUEUE_STORAGE_KEY = 'offline_message_queue';
  
  try {
    const stored = localStorage.getItem(QUEUE_STORAGE_KEY);
    if (stored) {
      const messages: QueuedMessage[] = JSON.parse(stored);
      
      for (const message of messages) {
        await addMessageToDB(message);
      }
      
      // Clear localStorage after successful migration
      localStorage.removeItem(QUEUE_STORAGE_KEY);
      console.log('Migrated', messages.length, 'messages from localStorage to IndexedDB');
    }
  } catch (error) {
    console.error('Error migrating from localStorage:', error);
  }
};

// Queue Statistics
const STATS_STORAGE_KEY = 'offline_queue_stats';
const DAILY_STATS_KEY = 'offline_queue_daily_stats';

export interface QueueStats {
  totalQueued: number;
  totalSent: number;
  totalFailed: number;
  lastSyncAt: string | null;
  firstQueuedAt: string | null;
}

export interface DailyStats {
  [date: string]: {
    queued: number;
    sent: number;
    failed: number;
  };
}

const getDefaultStats = (): QueueStats => ({
  totalQueued: 0,
  totalSent: 0,
  totalFailed: 0,
  lastSyncAt: null,
  firstQueuedAt: null,
});

export const getQueueStats = (): QueueStats => {
  try {
    const stored = localStorage.getItem(STATS_STORAGE_KEY);
    if (stored) {
      return { ...getDefaultStats(), ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Error reading queue stats:', error);
  }
  return getDefaultStats();
};

export const updateQueueStats = (updates: Partial<QueueStats>): QueueStats => {
  const current = getQueueStats();
  const updated = { ...current, ...updates };
  try {
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving queue stats:', error);
  }
  return updated;
};

export const getDailyStats = (): DailyStats => {
  try {
    const stored = localStorage.getItem(DAILY_STATS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error reading daily stats:', error);
  }
  return {};
};

export const updateDailyStats = (stats: DailyStats): void => {
  try {
    localStorage.setItem(DAILY_STATS_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error('Error saving daily stats:', error);
  }
};

const getTodayKey = (): string => {
  return new Date().toISOString().split('T')[0];
};

export const incrementDailyStat = (key: 'queued' | 'sent' | 'failed', amount: number = 1): void => {
  const today = getTodayKey();
  const daily = getDailyStats();
  
  if (!daily[today]) {
    daily[today] = { queued: 0, sent: 0, failed: 0 };
  }
  
  daily[today][key] += amount;
  updateDailyStats(daily);
};

export const incrementQueueStat = (key: 'totalQueued' | 'totalSent' | 'totalFailed', amount: number = 1): void => {
  const current = getQueueStats();
  const updates: Partial<QueueStats> = {
    [key]: current[key] + amount,
  };
  
  if (key === 'totalQueued' && !current.firstQueuedAt) {
    updates.firstQueuedAt = new Date().toISOString();
  }
  
  if (key === 'totalSent') {
    updates.lastSyncAt = new Date().toISOString();
  }
  
  updateQueueStats(updates);
  
  // Also update daily stats
  const dailyKey = key === 'totalQueued' ? 'queued' : key === 'totalSent' ? 'sent' : 'failed';
  incrementDailyStat(dailyKey, amount);
};

export const resetQueueStats = (): void => {
  localStorage.removeItem(STATS_STORAGE_KEY);
  localStorage.removeItem(DAILY_STATS_KEY);
};
