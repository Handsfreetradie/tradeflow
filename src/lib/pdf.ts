import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

/** Renders a DOM element to a multi-page A4 PDF. Shared core for both the base64 (email) and blob (preview/download) outputs. */
async function renderElementToPdf(element: HTMLElement): Promise<jsPDF> {
  const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff', useCORS: true })
  const imgData = canvas.toDataURL('image/png')

  const pdf = new jsPDF('p', 'mm', 'a4')
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const imgWidth = pageWidth
  const imgHeight = (canvas.height * imgWidth) / canvas.width

  let heightLeft = imgHeight
  let position = 0
  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
  heightLeft -= pageHeight

  while (heightLeft > 0) {
    position -= pageHeight
    pdf.addPage()
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight
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
