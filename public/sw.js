// Service Worker for Push Notifications and Background Sync

const DB_NAME = 'OfflineQueueDB';
const DB_VERSION = 1;
const STORE_NAME = 'pending_messages';

// IndexedDB helpers for Service Worker
const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('chatId', 'chatId', { unique: false });
      }
    };
  });
};

const getPendingMessages = async () => {
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

const updateMessage = async (messageId, updates) => {
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
        resolve();
      }
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
};

const removeMessage = async (messageId) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(messageId);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// Get Supabase config from stored data
const getSupabaseConfig = async () => {
  // Try to get from cache or use environment defaults
  try {
    const cache = await caches.open('supabase-config');
    const response = await cache.match('config');
    if (response) {
      return response.json();
    }
  } catch (e) {
    console.log('No cached Supabase config');
  }
  return null;
};

// Send message to Supabase
const sendMessageToSupabase = async (message, config) => {
  if (!config) {
    throw new Error('No Supabase config available');
  }

  const { supabaseUrl, supabaseKey, senderProfileId } = config;
  
  const tableName = message.type === 'spark' ? 'chat_messages' : 'quedada_messages';
  const idField = message.type === 'spark' ? 'chat_id' : 'quedada_id';
  
  const payload = {
    [idField]: message.chatId,
    content: message.content,
    sender_profile_id: message.metadata?.senderProfileId || senderProfileId,
  };

  const response = await fetch(`${supabaseUrl}/rest/v1/${tableName}`, {
    method: 'POST',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Failed to send message: ${response.status}`);
  }

  return true;
};

// Background Sync handler
self.addEventListener('sync', (event) => {
  console.log('Background sync event:', event.tag);
  
  if (event.tag === 'offline-queue-sync') {
    event.waitUntil(syncOfflineMessages());
  }
});

const syncOfflineMessages = async () => {
  console.log('Starting background sync of offline messages...');
  
  try {
    const config = await getSupabaseConfig();
    if (!config) {
      console.log('No Supabase config, skipping sync');
      return;
    }

    const pendingMessages = await getPendingMessages();
    console.log('Found', pendingMessages.length, 'pending messages');

    let successCount = 0;
    
    for (const message of pendingMessages) {
      try {
        await updateMessage(message.id, { status: 'sending' });
        await sendMessageToSupabase(message, config);
        await removeMessage(message.id);
        successCount++;
        console.log('Synced message:', message.id);
      } catch (error) {
        console.error('Failed to sync message:', message.id, error);
        const newRetryCount = (message.retryCount || 0) + 1;
        await updateMessage(message.id, { 
          status: newRetryCount >= 3 ? 'failed' : 'pending',
          retryCount: newRetryCount 
        });
      }
    }

    // Show notification if messages were synced
    if (successCount > 0) {
      await self.registration.showNotification('✓ Mensajes enviados', {
        body: `${successCount} mensaje${successCount > 1 ? 's' : ''} pendiente${successCount > 1 ? 's' : ''} enviado${successCount > 1 ? 's' : ''} correctamente`,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: 'offline-sync-success',
        vibrate: [50, 30, 80],
      });
      
      // Notify the app if it's open
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach(client => {
        client.postMessage({
          type: 'SYNC_COMPLETE',
          count: successCount,
        });
      });
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
};

// Push notification handler
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  
  let data = { title: 'Nueva notificación', body: '' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }
  
  const options = {
    body: data.body || '',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      dateOfArrival: Date.now(),
    },
    actions: data.actions || [],
    tag: data.tag || 'default',
    renotify: true,
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('Notification click:', event);
  
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            client.navigate(urlToOpen);
            return;
          }
        }
        // Open new window if none exists
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('Push subscription changed:', event);
  // Handle subscription change - re-subscribe if needed
});

// Message handler for receiving config from the app
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);
  
  if (event.data.type === 'STORE_SUPABASE_CONFIG') {
    event.waitUntil(
      caches.open('supabase-config').then(cache => {
        const response = new Response(JSON.stringify(event.data.config));
        return cache.put('config', response);
      })
    );
  }
  
  if (event.data.type === 'TRIGGER_SYNC') {
    event.waitUntil(syncOfflineMessages());
  }
});

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installed');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
  event.waitUntil((async () => {
    // If a previous SW (e.g. Workbox/PWA) left stale caches behind, wipe them.
    // This prevents “old UI” desync on mobile where the app shell gets stuck.
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    } catch (e) {
      // Ignore
    }

    await self.clients.claim();

    // Force open clients to reload under the new SW.
    try {
      const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      await Promise.all(
        clientList
          .filter((c) => 'navigate' in c)
          .map((c) => {
            try {
              return c.navigate(c.url);
            } catch {
              return undefined;
            }
          })
      );
    } catch {
      // Ignore
    }
  })());
});
