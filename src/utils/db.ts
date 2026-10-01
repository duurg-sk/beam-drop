// IndexedDB persistent storage for Transfer History and Received File Blobs

import { HistoryRecord } from '../types';

const DB_NAME = 'BeamDropDB';
const DB_VERSION = 1;
const STORE_HISTORY = 'transfer_history';
const STORE_BLOBS = 'received_blobs';

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_HISTORY)) {
        const historyStore = db.createObjectStore(STORE_HISTORY, { keyPath: 'id' });
        historyStore.createIndex('timestamp', 'timestamp', { unique: false });
        historyStore.createIndex('status', 'status', { unique: false });
        historyStore.createIndex('direction', 'direction', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_BLOBS)) {
        db.createObjectStore(STORE_BLOBS, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

export async function saveHistoryRecord(record: HistoryRecord, blob?: Blob): Promise<void> {
  try {
    const db = await getDB();

    // If a blob is provided (e.g. for received files under 2GB), store in blobs store
    let hasBlob = false;
    let blobKey: string | undefined = undefined;

    if (blob && blob.size > 0 && blob.size < 500 * 1024 * 1024) {
      // Store files under 500MB directly in IDB for instant re-download
      blobKey = `blob_${record.id}`;
      try {
        const blobTx = db.transaction(STORE_BLOBS, 'readwrite');
        const blobStore = blobTx.objectStore(STORE_BLOBS);
        blobStore.put({ key: blobKey, blob, name: record.fileName, type: record.mimeType });
        hasBlob = true;
      } catch (err) {
        console.warn('Could not cache file blob to IndexedDB:', err);
      }
    }

    const tx = db.transaction(STORE_HISTORY, 'readwrite');
    const store = tx.objectStore(STORE_HISTORY);
    store.put({
      ...record,
      hasBlob,
      blobKey: hasBlob ? blobKey : undefined,
    });

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('Failed to save history record:', err);
  }
}

export async function getAllHistory(): Promise<HistoryRecord[]> {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_HISTORY, 'readonly');
    const store = tx.objectStore(STORE_HISTORY);
    const index = store.index('timestamp');

    return new Promise((resolve, reject) => {
      const request = index.openCursor(null, 'prev'); // Most recent first
      const results: HistoryRecord[] = [];

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };

      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Failed to load history:', err);
    return [];
  }
}

export async function getFileBlob(blobKey: string): Promise<Blob | null> {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_BLOBS, 'readonly');
    const store = tx.objectStore(STORE_BLOBS);
    const request = store.get(blobKey);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        if (request.result && request.result.blob) {
          resolve(request.result.blob);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch {
    return null;
  }
}

export async function deleteHistoryRecord(id: string): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction([STORE_HISTORY, STORE_BLOBS], 'readwrite');
    tx.objectStore(STORE_HISTORY).delete(id);
    tx.objectStore(STORE_BLOBS).delete(`blob_${id}`);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('Failed to delete history record:', err);
  }
}

export async function clearAllHistory(): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction([STORE_HISTORY, STORE_BLOBS], 'readwrite');
    tx.objectStore(STORE_HISTORY).clear();
    tx.objectStore(STORE_BLOBS).clear();
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('Failed to clear history:', err);
  }
}
