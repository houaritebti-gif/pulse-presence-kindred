// IndexedDB utilities for offline profile cache
// Stores visited profiles locally for instant loading and offline access

import { Profile } from "@/hooks/useProfile";

const DB_NAME = 'ProfileCacheDB';
const DB_VERSION = 1;
const STORE_NAME = 'cached_profiles';

// Cache expiration time: 24 hours
const CACHE_EXPIRATION_MS = 24 * 60 * 60 * 1000;

export interface CachedProfile {
  profileId: string;
  profile: Profile;
  tribes: string[];
  musicStyles: string[];
  interests: string[];
  cachedAt: number;
  expiresAt: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

const openDB = (): Promise<IDBDatabase> => {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Failed to open ProfileCacheDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'profileId' });
        store.createIndex('cachedAt', 'cachedAt', { unique: false });
        store.createIndex('expiresAt', 'expiresAt', { unique: false });
      }
    };
  });

  return dbPromise;
};

/**
 * Save a profile to the cache with 24-hour expiration
 */
export const cacheProfile = async (
  profileId: string,
  profile: Profile,
  tribes: string[],
  musicStyles: string[],
  interests: string[]
): Promise<void> => {
  try {
    const db = await openDB();
    const now = Date.now();
    
    const cachedProfile: CachedProfile = {
      profileId,
      profile,
      tribes,
      musicStyles,
      interests,
      cachedAt: now,
      expiresAt: now + CACHE_EXPIRATION_MS,
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(cachedProfile);

      request.onsuccess = () => {
        console.log('[ProfileCache] Cached profile:', profileId);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[ProfileCache] Error caching profile:', error);
  }
};

/**
 * Get a cached profile if it exists and hasn't expired
 */
export const getCachedProfile = async (profileId: string): Promise<CachedProfile | null> => {
  try {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(profileId);

      request.onsuccess = () => {
        const cached = request.result as CachedProfile | undefined;
        
        if (!cached) {
          resolve(null);
          return;
        }

        // Check if expired
        if (Date.now() > cached.expiresAt) {
          console.log('[ProfileCache] Cache expired for:', profileId);
          // Remove expired entry asynchronously
          removeCachedProfile(profileId);
          resolve(null);
          return;
        }

        console.log('[ProfileCache] Cache hit for:', profileId);
        resolve(cached);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[ProfileCache] Error reading cache:', error);
    return null;
  }
};

/**
 * Remove a specific profile from the cache
 */
export const removeCachedProfile = async (profileId: string): Promise<void> => {
  try {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(profileId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[ProfileCache] Error removing profile:', error);
  }
};

/**
 * Clear all expired profiles from the cache
 */
export const clearExpiredProfiles = async (): Promise<number> => {
  try {
    const db = await openDB();
    const now = Date.now();
    let clearedCount = 0;
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.openCursor();

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        
        if (cursor) {
          const cached = cursor.value as CachedProfile;
          if (now > cached.expiresAt) {
            cursor.delete();
            clearedCount++;
          }
          cursor.continue();
        } else {
          if (clearedCount > 0) {
            console.log('[ProfileCache] Cleared', clearedCount, 'expired profiles');
          }
          resolve(clearedCount);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[ProfileCache] Error clearing expired profiles:', error);
    return 0;
  }
};

/**
 * Clear all cached profiles
 */
export const clearAllCachedProfiles = async (): Promise<void> => {
  try {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        console.log('[ProfileCache] Cleared all cached profiles');
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[ProfileCache] Error clearing cache:', error);
  }
};

/**
 * Get cache statistics
 */
export const getCacheStats = async (): Promise<{
  totalCached: number;
  expiredCount: number;
  validCount: number;
  oldestCacheAge: number | null;
}> => {
  try {
    const db = await openDB();
    const now = Date.now();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const profiles = request.result as CachedProfile[];
        const expired = profiles.filter(p => now > p.expiresAt);
        const valid = profiles.filter(p => now <= p.expiresAt);
        
        let oldestCacheAge: number | null = null;
        if (valid.length > 0) {
          const oldest = Math.min(...valid.map(p => p.cachedAt));
          oldestCacheAge = now - oldest;
        }

        resolve({
          totalCached: profiles.length,
          expiredCount: expired.length,
          validCount: valid.length,
          oldestCacheAge,
        });
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[ProfileCache] Error getting stats:', error);
    return {
      totalCached: 0,
      expiredCount: 0,
      validCount: 0,
      oldestCacheAge: null,
    };
  }
};

/**
 * Update only the profile data while keeping other cached data
 */
export const updateCachedProfileData = async (
  profileId: string,
  updates: Partial<{
    profile: Profile;
    tribes: string[];
    musicStyles: string[];
    interests: string[];
  }>
): Promise<void> => {
  try {
    const cached = await getCachedProfile(profileId);
    if (!cached) return;

    await cacheProfile(
      profileId,
      updates.profile || cached.profile,
      updates.tribes || cached.tribes,
      updates.musicStyles || cached.musicStyles,
      updates.interests || cached.interests
    );
  } catch (error) {
    console.error('[ProfileCache] Error updating cached profile:', error);
  }
};
