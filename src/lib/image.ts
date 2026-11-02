const MAX_DIMENSION = 1000
const KEEP_AS_IS_BYTES = 300_000

/**
 * Shrinks a big logo/photo before it goes into a PDF. A phone-camera or print-size logo can be several
 * MB, and the PDF gets base64'd and uploaded to send an email — 1000px is already sharp across a full
 * A4 width, so anything bigger is wasted upload time. Small files are returned untouched, and the
 * original is returned if re-encoding somehow made it bigger.
 */
export async function downscaleForPdf(blob: Blob): Promise<Blob> {
  if (blob.type !== 'image/png' && blob.type !== 'image/jpeg' && blob.type !== 'image/webp') return blob
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(blob)
  } catch {
    return blob
  }
  try {
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
    if (scale === 1 && blob.size <= KEEP_AS_IS_BYTES) return blob

    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    const ctx = canvas.getContext('2d')
    if (!ctx) return blob

    // JPEG has no transparency, so it needs a white backdrop; PNG/WebP logos keep theirs (re-saved as PNG).
    const asJpeg = blob.type === 'image/jpeg'
    if (asJpeg) {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

    const out = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, asJpeg ? 'image/jpeg' : 'image/png', 0.85))
    return out && out.size < blob.size ? out : blob
  } finally {
    bitmap.close()
  }
}
