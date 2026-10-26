import { get, set, del, clear, createStore } from 'idb-keyval'
import type { FieldJob } from '@/lib/store/field-jobs-store'

const store = createStore('tradeflow-offline', 'kv')

const JOBS_CACHE_KEY = 'field-jobs-cache'

// Cached per business — one login can work for several, and each has its own job list.
export async function getCachedJobs(businessId: string): Promise<FieldJob[] | undefined> {
  return get<FieldJob[]>(`${JOBS_CACHE_KEY}:${businessId}`, store)
}

export async function setCachedJobs(businessId: string, jobs: FieldJob[]): Promise<void> {
  await set(`${JOBS_CACHE_KEY}:${businessId}`, jobs, store)
}

function photoBlobKey(key: string) {
  return `photo-blob:${key}`
}

export async function storePhotoBlob(key: string, blob: Blob): Promise<void> {
  await set(photoBlobKey(key), blob, store)
}

export async function getPhotoBlob(key: string): Promise<Blob | undefined> {
  return get<Blob>(photoBlobKey(key), store)
}

export async function deletePhotoBlob(key: string): Promise<void> {
  await del(photoBlobKey(key), store)
}

export async function clearOfflineCache(): Promise<void> {
  await clear(store)
}
