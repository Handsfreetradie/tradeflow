import { useEffect, useState } from 'react'
import { get, set, createStore } from 'idb-keyval'

type QueuedActionInput =
  | { kind: 'start_job'; jobId: string }
  | { kind: 'finish_job'; jobId: string; note?: string; blocked: boolean }
  | { kind: 'add_note'; jobId: string; text: string; authorName: string }
  | { kind: 'upload_photo'; jobId: string; blobKey: string; fileName: string; mimeType: string }

export type QueuedAction = QueuedActionInput & { id: string }

const store = createStore('tradeflow-offline', 'kv')
const QUEUE_KEY = 'field-action-queue'

let cache: QueuedAction[] | null = null
const listeners = new Set<(queue: QueuedAction[]) => void>()

async function loadCache(): Promise<QueuedAction[]> {
  if (cache === null) cache = (await get<QueuedAction[]>(QUEUE_KEY, store)) ?? []
  return cache
}

function notify() {
  for (const listener of listeners) listener(cache ?? [])
}

export async function getQueueSnapshot(): Promise<QueuedAction[]> {
  return loadCache()
}

export async function enqueue(action: QueuedActionInput): Promise<QueuedAction> {
  const queue = await loadCache()
  const withId: QueuedAction = { ...action, id: crypto.randomUUID() }
  cache = [...queue, withId]
  await set(QUEUE_KEY, cache, store)
  notify()
  return withId
}

export async function dequeue(id: string): Promise<void> {
  const queue = await loadCache()
  cache = queue.filter((a) => a.id !== id)
  await set(QUEUE_KEY, cache, store)
  notify()
}

export function subscribeQueue(listener: (queue: QueuedAction[]) => void): () => void {
  listeners.add(listener)
  loadCache().then((queue) => listener(queue))
  return () => listeners.delete(listener)
}

export function usePendingSyncCount(): number {
  const [count, setCount] = useState(0)
  useEffect(() => subscribeQueue((queue) => setCount(queue.length)), [])
  return count
}
