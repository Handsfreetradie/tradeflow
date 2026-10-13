import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

/** Content a page break must never land inside of — a table row, or a section marked
 * `data-pdf-section` (the bordered boxes in an invoice/quote document). */
const SAFE_BREAK_SELECTOR = '[data-pdf-section], tr'

/** Bottom-edge offsets (CSS px, relative to `element`'s own top) of blocks that are safe to end a
 * page on — i.e. never split one of these in half across a page break. */
function collectSafeBreakOffsets(element: HTMLElement): number[] {
  const top = element.getBoundingClientRect().top
  const offsets = new Set<number>()
  element.querySelectorAll(SAFE_BREAK_SELECTOR).forEach((el) => {
    offsets.add(el.getBoundingClientRect().bottom - top)
  })
  return Array.from(offsets).sort((a, b) => a - b)
}

/** Crops the horizontal slice [startPx, endPx) out of `source` into a new canvas. */
function sliceCanvas(source: HTMLCanvasElement, startPx: number, endPx: number): HTMLCanvasElement {
  const sliced = document.createElement('canvas')
  sliced.width = source.width
  sliced.height = Math.max(1, Math.round(endPx - startPx))
  const ctx = sliced.getContext('2d')
  if (ctx) ctx.drawImage(source, 0, -startPx)
  return sliced
}

/**
 * Renders a DOM element to a multi-page A4 PDF. Pages break only at safe points (a table row's or
 * marked section's bottom edge) when one is available near the natural page boundary, instead of
 * always cutting exactly one page-height down — which used to slice line-item rows and address
 * blocks in half whenever a document ran past one page. Shared core for both the base64 (email)
 * and blob (preview/download) outputs.
 */
async function renderElementToPdf(element: HTMLElement): Promise<jsPDF> {
  const elementHeightPx = element.getBoundingClientRect().height
  const safeBreaksCss = collectSafeBreakOffsets(element)

  const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff', useCORS: true })
  const pxPerCssPx = canvas.height / elementHeightPx
  const safeBreaksPx = safeBreaksCss.map((p) => p * pxPerCssPx)

  const pdf = new jsPDF('p', 'mm', 'a4')
  const pageWidthMm = pdf.internal.pageSize.getWidth()
  const pageHeightMm = pdf.internal.pageSize.getHeight()
  const pxPerMm = canvas.width / pageWidthMm
  const pageHeightPx = pageHeightMm * pxPerMm

  let startPx = 0
  let firstPage = true
  while (startPx < canvas.height - 0.5) {
    const naiveEndPx = startPx + pageHeightPx
    let endPx = Math.min(naiveEndPx, canvas.height)
    if (endPx < canvas.height) {
      const safe = safeBreaksPx.filter((p) => p > startPx + 0.5 && p <= naiveEndPx)
      if (safe.length > 0) endPx = safe[safe.length - 1]
    }

    const sliceHeightMm = (endPx - startPx) / pxPerMm
    const slice = sliceCanvas(canvas, startPx, endPx)
    if (!firstPage) pdf.addPage()
    pdf.addImage(slice.toDataURL('image/png'), 'PNG', 0, 0, pageWidthMm, sliceHeightMm)

    startPx = endPx
    firstPage = false
  }

  return pdf
}

/** Renders a DOM element to a multi-page A4 PDF and returns it as plain base64 (no data-URI prefix) — used for email attachments. */
export async function elementToPdfBase64(element: HTMLElement): Promise<string> {
  const pdf = await renderElementToPdf(element)
  return pdf.output('datauristring').split(',')[1]
}

/** Renders a DOM element to a multi-page A4 PDF and returns it as a Blob — used for preview (open in a tab) and download. */
export async function elementToPdfBlob(element: HTMLElement): Promise<Blob> {
  const pdf = await renderElementToPdf(element)
  return pdf.output('blob')
}

/** Opens a PDF blob in a new browser tab using the browser's own PDF viewer. */
export function openPdfBlobInNewTab(blob: Blob): void {
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank', 'noopener,noreferrer')
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

/** Triggers a browser download of a PDF blob with the given filename. */
export function downloadPdfBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
