import { get, set, del, createStore } from 'idb-keyval'
import type { FieldJob } from '@/lib/store/field-jobs-store'

const store = createStore('tradeflow-offline', 'kv')

const JOBS_CACHE_KEY = 'field-jobs-cache'

export async function getCachedJobs(): Promise<FieldJob[] | undefined> {
  return get<FieldJob[]>(JOBS_CACHE_KEY, store)
}

export async function setCachedJobs(jobs: FieldJob[]): Promise<void> {
  await set(JOBS_CACHE_KEY, jobs, store)
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
