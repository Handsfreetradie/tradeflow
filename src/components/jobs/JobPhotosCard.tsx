import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Camera, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { listJobPhotos, uploadJobPhoto, deleteJobPhoto, type JobPhoto } from '@/lib/api/jobPhotos'

export function JobPhotosCard({ jobId, canDelete = true }: { jobId: string; canDelete?: boolean }) {
  const [photos, setPhotos] = useState<JobPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const load = () => {
    listJobPhotos(jobId).then((p) => {
      setPhotos(p)
      setLoading(false)
    })
  }

  useEffect(() => {
    load()
  }, [jobId])

  const handleFiles = async (files: FileList) => {
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue
        await uploadJobPhoto(jobId, file)
      }
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to upload photo')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (photo: JobPhoto) => {
    setPhotos((prev) => prev.filter((p) => p.id !== photo.id))
    try {
      await deleteJobPhoto(photo.id, photo.storagePath)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete photo')
      load()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Photos</CardTitle>
      </CardHeader>
      <CardContent>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          capture="environment"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) handleFiles(e.target.files)
            e.target.value = ''
          }}
        />
        {loading ? (
          <p className="py-4 text-center text-sm text-muted-foreground">Loading…</p>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {photos.map((photo) => (
              <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-lg bg-secondary">
                <img src={photo.url} alt="Job site" className="size-full object-cover" />
                {canDelete && (
                  <button
                    onClick={() => handleDelete(photo)}
                    className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>
            ))}
            <button
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-50"
            >
              <Camera className="size-5" />
              <span className="text-[10px]">{uploading ? 'Uploading…' : 'Add photo'}</span>
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
