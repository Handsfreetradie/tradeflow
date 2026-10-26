import { supabase } from '@/lib/supabase'

export interface JobDocument {
  id: string
  name: string
  uploadedByName: string | null
  createdAt: string
  storagePath: string
  source: string
}

const BUCKET = 'job-documents'

export async function listJobDocuments(jobId: string): Promise<JobDocument[]> {
  const { data, error } = await supabase
    .from('job_documents')
    .select('id, name, uploaded_by_name, created_at, storage_path, source')
    .eq('job_id', jobId)
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return data.map((d) => ({
    id: d.id,
    name: d.name,
    uploadedByName: d.uploaded_by_name,
    createdAt: d.created_at,
    storagePath: d.storage_path,
    source: d.source,
  }))
}

export async function deleteJobDocument(doc: JobDocument): Promise<void> {
  const { error } = await supabase.from('job_documents').delete().eq('id', doc.id)
  if (error) throw new Error(error.message)
  await supabase.storage.from(BUCKET).remove([doc.storagePath])
}

/** Opens a new tab straight away (so phones don't block it as a pop-up), then points it at the
 * address once the async work finishes. */
async function openInNewTab(getUrl: () => Promise<string>): Promise<void> {
  const tab = window.open('', '_blank')
  try {
    const url = await getUrl()
    if (tab) {
      tab.opener = null
      tab.location.href = url
    } else {
      window.location.href = url
    }
  } catch (e) {
    tab?.close()
    throw e
  }
}

export async function openJobDocument(doc: JobDocument): Promise<void> {
  await openInNewTab(async () => {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(doc.storagePath, 60 * 60)
    if (error || !data?.signedUrl) throw new Error("Couldn't open that file")
    return data.signedUrl
  })
}

/** Opens StandAId's rough-in tool for this job, with a one-off code so the finished plan can be
 * saved straight back onto the job. */
export async function openRoughInPlan(jobId: string): Promise<void> {
  await openInNewTab(async () => {
    const { data, error } = await supabase.functions.invoke('setout-handoff', { body: { action: 'start', jobId } })
    if (error) {
      let message = "Couldn't open the rough-in plan"
      try {
        const body = await (error as { context?: Response }).context?.json()
        if (body?.error) message = String(body.error)
      } catch {
        // keep the generic message
      }
      throw new Error(message)
    }
    if (!data?.url) throw new Error("Couldn't open the rough-in plan")
    return data.url as string
  })
}
