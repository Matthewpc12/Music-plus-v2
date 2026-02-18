const DB_NAME = 'MusicAppCache';
const STORE_NAME = 'images';
const VERSION = 1;

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, VERSION);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getCachedImage = async (key: string): Promise<string | null> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    // console.warn('IndexedDB read error', e);
    return null;
  }
};

export const cacheImage = async (key: string, data: string): Promise<void> => {
   try {
     const db = await openDB();
     return new Promise((resolve, reject) => {
       const transaction = db.transaction(STORE_NAME, 'readwrite');
       const store = transaction.objectStore(STORE_NAME);
       const request = store.put(data, key);
       request.onsuccess = () => resolve();
       request.onerror = () => reject(request.error);
     });
   } catch (e) {
     // console.warn('IndexedDB write error', e);
   }
};