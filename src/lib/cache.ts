import { get, set, del, clear } from 'idb-keyval';
import { IndonesianCardCandidate } from '../types';

const MEMORY_CACHE = new Map<string, any>();

export async function getCachedItem<T>(key: string): Promise<T | null> {
  // Check memory cache first
  if (MEMORY_CACHE.has(key)) {
    return MEMORY_CACHE.get(key) as T;
  }

  // Check IndexedDB
  try {
    if (typeof window !== 'undefined' && 'indexedDB' in window) {
      const val = await get<T>(key);
      if (val !== undefined && val !== null) {
        MEMORY_CACHE.set(key, val);
        return val;
      }
    }
  } catch (err) {
    console.warn(`IndexedDB read failed for key ${key}:`, err);
  }

  return null;
}

export async function setCachedItem<T>(key: string, value: T): Promise<void> {
  MEMORY_CACHE.set(key, value);
  try {
    if (typeof window !== 'undefined' && 'indexedDB' in window) {
      await set(key, value);
    }
  } catch (err) {
    console.warn(`IndexedDB write failed for key ${key}:`, err);
  }
}

export async function getCachedCandidates(cardKey: string): Promise<IndonesianCardCandidate[] | null> {
  return getCachedItem<IndonesianCardCandidate[]>(`candidates_${cardKey}`);
}

export async function setCachedCandidates(cardKey: string, candidates: IndonesianCardCandidate[]): Promise<void> {
  return setCachedItem(`candidates_${cardKey}`, candidates);
}

export async function clearAllCache(): Promise<void> {
  MEMORY_CACHE.clear();
  try {
    if (typeof window !== 'undefined' && 'indexedDB' in window) {
      await clear();
    }
  } catch (err) {
    console.warn('Failed to clear IndexedDB:', err);
  }
}
