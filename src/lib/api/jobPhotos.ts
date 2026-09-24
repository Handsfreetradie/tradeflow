import { supabase } from '@/lib/supabase'

export interface JobPhoto {
  id: string
  url: string
  storagePath: string
}

/** Signed URLs expire — always list fresh rather than caching across sessions. */
export async function listJobPhotos(jobId: string): Promise<JobPhoto[]> {
  const { data: rows, error } = await supabase.from('job_photos').select('id, storage_path').eq('job_id', jobId).order('created_at')
  if (error || !rows || rows.length === 0) return []
  const paths = rows.map((r) => r.storage_path)
  const { data: signed } = await supabase.storage.from('job-photos').createSignedUrls(paths, 60 * 60)
  const urlByPath = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]))
  return rows.map((r) => ({ id: r.id, storagePath: r.storage_path, url: urlByPath.get(r.storage_path) ?? '' }))
}

export async function uploadJobPhoto(jobId: string, file: File): Promise<void> {
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${jobId}/${crypto.randomUUID()}.${ext}`
  const { error: uploadError } = await supabase.storage.from('job-photos').upload(path, file)
  if (uploadError) throw new Error(uploadError.message)
  const { data: session } = await supabase.auth.getSession()
  const { error } = await supabase
    .from('job_photos')
    .insert({ job_id: jobId, storage_path: path, uploaded_by: session.session?.user.id ?? null })
  if (error) throw new Error(error.message)
}

export async function deleteJobPhoto(photoId: string, storagePath: string): Promise<void> {
  const { error: dbError } = await supabase.from('job_photos').delete().eq('id', photoId)
  if (dbError) throw new Error(dbError.message)
  await supabase.storage.from('job-photos').remove([storagePath])
}
