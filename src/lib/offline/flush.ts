import { supabase } from '@/lib/supabase'
import { uploadJobPhoto } from '@/lib/api/jobPhotos'
import { getQueueSnapshot, dequeue, type QueuedAction } from './queue'
import { getPhotoBlob, deletePhotoBlob } from './db'

export const SYNCED_EVENT = 'tradeflow:offline-synced'

let flushing = false

/** Replays queued offline actions against Supabase in order, stopping at the first failure so later actions can't jump ahead of one still pending (e.g. finish_job before its start_job). */
export async function flushQueue(): Promise<void> {
  if (flushing || !navigator.onLine) return
  flushing = true
  try {
    const queue = await getQueueSnapshot()
    let synced = 0
    for (const action of queue) {
      const ok = await runAction(action)
      if (!ok) break
      await dequeue(action.id)
      synced++
    }
    if (synced > 0) window.dispatchEvent(new Event(SYNCED_EVENT))
  } finally {
    flushing = false
  }
}

async function runAction(action: QueuedAction): Promise<boolean> {
  try {
    switch (action.kind) {
      case 'start_job': {
        const { error } = await supabase.rpc('employee_start_job', { p_job_id: action.jobId })
        if (error) throw new Error(error.message)
        return true
      }
      case 'finish_job': {
        const { error } = await supabase.rpc('employee_finish_job', {
          p_job_id: action.jobId,
          p_note: action.note,
          p_blocked: action.blocked,
        })
        if (error) throw new Error(error.message)
        return true
      }
      case 'add_note': {
        const { data: sessionData } = await supabase.auth.getSession()
        const { error } = await supabase.from('job_notes').insert({
          job_id: action.jobId,
          type: 'note',
          author_id: sessionData.session?.user.id ?? '',
          author_name: action.authorName,
          text: action.text,
        })
        if (error) throw new Error(error.message)
        return true
      }
      case 'upload_photo': {
        const blob = await getPhotoBlob(action.blobKey)
        if (blob) {
          const file = new File([blob], action.fileName, { type: action.mimeType })
          await uploadJobPhoto(action.jobId, file)
        }
        await deletePhotoBlob(action.blobKey)
        return true
      }
    }
  } catch (e) {
    console.error('Failed to sync offline action', action, e)
    return false
  }
}
