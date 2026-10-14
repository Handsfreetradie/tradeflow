import { jsPDF } from 'jspdf'
import { gstComponent, gstInclusiveTotal } from '@/lib/bas'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { BusinessSettings } from '@/lib/store/business-settings-store'
import type { Customer, GstType, Invoice, LineItem, Payment, Quote } from '@/lib/demo-data'

/**
 * Builds invoice/quote PDFs as real vector text and lines instead of a rasterised screenshot of
 * the on-screen document. A screenshot-based PDF (the previous approach) was multiple megabytes
 * per file and split onto extra pages just from the aspect-ratio mismatch between the capture
 * width and A4 — this is a few hundred KB, paginates on actual content, and the text is
 * selectable/crisp at any zoom, which is what every real invoicing tool does.
 */

// Matches the app's own CSS tokens (converted from HSL) so the PDF and the on-screen UI agree.
const COLOR = {
  foreground: [15, 23, 42] as [number, number, number],
  muted: [101, 117, 139] as [number, number, number],
  border: [226, 232, 240] as [number, number, number],
  primary: [37, 99, 235] as [number, number, number],
  success: [22, 163, 74] as [number, number, number],
}

const PAGE_WIDTH = 210
const PAGE_HEIGHT = 297
const MARGIN = 18
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2
const CONTENT_RIGHT = PAGE_WIDTH - MARGIN
const BOTTOM_LIMIT = PAGE_HEIGHT - MARGIN

interface Ctx {
  doc: jsPDF
  y: number
}

function ensureSpace(ctx: Ctx, height: number, onBreak?: (ctx: Ctx) => void) {
  if (ctx.y + height > BOTTOM_LIMIT) {
    ctx.doc.addPage()
    ctx.y = MARGIN
    onBreak?.(ctx)
  }
}

function hairline(ctx: Ctx) {
  ensureSpace(ctx, 1)
  ctx.doc.setDrawColor(...COLOR.border)
  ctx.doc.setLineWidth(0.3)
  ctx.doc.line(MARGIN, ctx.y, CONTENT_RIGHT, ctx.y)
}

/** A small-caps-style section label, e.g. "BILL TO" — letter-spaced, muted, uppercase. */
function label(ctx: Ctx, text: string, x: number, align: 'left' | 'right' = 'left') {
  ctx.doc.setFont('helvetica', 'bold')
  ctx.doc.setFontSize(7.5)
  ctx.doc.setTextColor(...COLOR.muted)
  ctx.doc.text(text.toUpperCase(), x, ctx.y, { align, charSpace: 0.4 })
}

async function fetchImageDataUrl(url: string): Promise<{ dataUrl: string; format: 'PNG' | 'JPEG' | 'WEBP' } | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const blob = await res.blob()
    const format = blob.type === 'image/png' ? 'PNG' : blob.type === 'image/webp' ? 'WEBP' : blob.type === 'image/jpeg' ? 'JPEG' : null
    if (!format) return null
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
    return { dataUrl, format }
  } catch {
    return null
  }
}

async function drawHeader(ctx: Ctx, business: BusinessSettings, heading: string, number: string, extra?: (ctx: Ctx) => void) {
  const { doc } = ctx
  let logoDrawn = false
  if (business.logoUrl) {
    const logo = await fetchImageDataUrl(business.logoUrl)
    if (logo) {
      try {
        doc.addImage(logo.dataUrl, logo.format, MARGIN, ctx.y, 28, 28)
        logoDrawn = true
      } catch {
        logoDrawn = false
      }
    }
  }
  if (logoDrawn) ctx.y += 32

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(...COLOR.foreground)
  doc.text(business.businessName || 'Your business', MARGIN, ctx.y + 6)

  const credentials = [business.abn && `ABN ${business.abn}`, business.licenceNumber && `Lic. ${business.licenceNumber}`].filter(Boolean).join('   ·   ')
  if (credentials) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...COLOR.muted)
    doc.text(credentials, MARGIN, ctx.y + 11)
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(...COLOR.foreground)
  doc.text(heading, CONTENT_RIGHT, ctx.y + 6, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...COLOR.muted)
  doc.text(number, CONTENT_RIGHT, ctx.y + 11, { align: 'right' })

  ctx.y += 14
  extra?.(ctx)
  ctx.y += 8
  hairline(ctx)
  ctx.y += 8
}

/** The big "Amount due" / "Quote total" headline, with a right-aligned date next to it. */
function drawHeadline(ctx: Ctx, headlineLabel: string, value: string, valueColor: [number, number, number], dateLine: string) {
  const { doc } = ctx
  ensureSpace(ctx, 18)
  label(ctx, headlineLabel, MARGIN)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(26)
  doc.setTextColor(...valueColor)
  doc.text(value, MARGIN, ctx.y + 11)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...COLOR.muted)
  doc.text(dateLine, CONTENT_RIGHT, ctx.y + 8, { align: 'right' })

  ctx.y += 20
  hairline(ctx)
  ctx.y += 8
}

/** A two-column "who/when" block with a top and bottom hairline, matching the on-screen design. */
function drawTwoColumnDetails(ctx: Ctx, leftLabel: string, leftLines: string[], rightLabel: string, rightValue: string) {
  const { doc } = ctx
  const startY = ctx.y
  label(ctx, leftLabel, MARGIN)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...COLOR.foreground)
  let ly = startY + 6
  leftLines.forEach((line, i) => {
    doc.setFont('helvetica', i === 0 ? 'bold' : 'normal')
    doc.setTextColor(...(i === 0 ? COLOR.foreground : COLOR.muted))
    doc.text(line, MARGIN, ly)
    ly += 5
  })

  label(ctx, rightLabel, CONTENT_RIGHT, 'right')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...COLOR.foreground)
  doc.text(rightValue, CONTENT_RIGHT, startY + 6, { align: 'right' })

  ctx.y = Math.max(ly, startY + 11) + 6
  hairline(ctx)
  ctx.y += 8
}

const COL = { qty: CONTENT_RIGHT - 60, price: CONTENT_RIGHT - 38, total: CONTENT_RIGHT }

/** The column-label row. Drawn once up front, then again at the top of any page the table spills
 * onto — a bare continuation of rows with no header is the "cut mid-table" look this exists to avoid. */
function drawTableHeaderRow(ctx: Ctx, continued: boolean) {
  const { doc } = ctx
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(...COLOR.muted)
  doc.text(continued ? 'DESCRIPTION (CONTINUED)' : 'DESCRIPTION', MARGIN, ctx.y, { charSpace: 0.4 })
  doc.text('QTY', COL.qty, ctx.y, { align: 'right', charSpace: 0.4 })
  doc.text('UNIT PRICE', COL.price, ctx.y, { align: 'right', charSpace: 0.4 })
  doc.text('TOTAL', COL.total, ctx.y, { align: 'right', charSpace: 0.4 })
  ctx.y += 3
  doc.setDrawColor(...COLOR.border)
  doc.setLineWidth(0.3)
  doc.line(MARGIN, ctx.y, CONTENT_RIGHT, ctx.y)
  ctx.y += 6
}

function drawLineItemsTable(ctx: Ctx, lineItems: LineItem[], gstType: GstType) {
  const { doc } = ctx
  ensureSpace(ctx, 12)
  drawTableHeaderRow(ctx, false)

  const descWidth = COL.qty - MARGIN - 45
  for (const li of lineItems) {
    const lines = doc.splitTextToSize(li.description || '—', descWidth)
    const rowHeight = Math.max(lines.length * 4.5, 5)
    ensureSpace(ctx, rowHeight + 4, (c) => drawTableHeaderRow(c, true))
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    doc.setTextColor(...COLOR.foreground)
    doc.text(lines, MARGIN, ctx.y)
    doc.setTextColor(...COLOR.muted)
    doc.text(String(li.qty), COL.qty, ctx.y, { align: 'right' })
    doc.text(formatCurrency(li.unitPrice), COL.price, ctx.y, { align: 'right' })
    doc.setTextColor(...COLOR.foreground)
    doc.text(formatCurrency(li.qty * li.unitPrice), COL.total, ctx.y, { align: 'right' })
    ctx.y += rowHeight + 4
    doc.setDrawColor(...COLOR.border)
    doc.line(MARGIN, ctx.y - 2, CONTENT_RIGHT, ctx.y - 2)
  }

  const subtotal = lineItems.reduce((sum, li) => sum + li.qty * li.unitPrice, 0)
  const gst = gstComponent(subtotal, gstType)
  const includeGst = gstType === 'gst_inclusive'

  ensureSpace(ctx, includeGst ? 24 : 18)
  ctx.y += 2
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(...COLOR.muted)
  doc.text('Subtotal', COL.price, ctx.y, { align: 'right' })
  doc.text(formatCurrency(subtotal), COL.total, ctx.y, { align: 'right' })
  ctx.y += 5.5
  if (includeGst) {
    doc.text('GST (10%)', COL.price, ctx.y, { align: 'right' })
    doc.text(formatCurrency(gst), COL.total, ctx.y, { align: 'right' })
    ctx.y += 5.5
  }
  doc.setDrawColor(...COLOR.border)
  doc.line(COL.qty - 10, ctx.y - 2, CONTENT_RIGHT, ctx.y - 2)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(...COLOR.foreground)
  doc.text('Total', COL.price, ctx.y + 4, { align: 'right' })
  doc.text(formatCurrency(subtotal + gst), COL.total, ctx.y + 4, { align: 'right' })
  ctx.y += 10
}

function drawNotesGrid(ctx: Ctx, columns: { title: string; body: string }[]) {
  const present = columns.filter((c) => c.body.trim())
  if (present.length === 0) return
  const { doc } = ctx
  hairline(ctx)
  ctx.y += 8
  const colWidth = CONTENT_WIDTH / present.length
  const startY = ctx.y
  let maxLines = 0
  const wrapped = present.map((c) => {
    const lines = doc.splitTextToSize(c.body, colWidth - 6)
    maxLines = Math.max(maxLines, lines.length)
    return lines
  })
  ensureSpace(ctx, 6 + maxLines * 4.5)
  present.forEach((c, i) => {
    const x = MARGIN + i * colWidth
    label(ctx, c.title, x)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...COLOR.muted)
    doc.text(wrapped[i], x, startY + 6)
  })
  ctx.y = startY + 6 + maxLines * 4.5 + 4
}

function drawFooter(doc: jsPDF, text: string) {
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(...COLOR.muted)
  doc.text(text, PAGE_WIDTH / 2, PAGE_HEIGHT - 12, { align: 'center' })
}

export interface InvoicePdfInput {
  invoice: Invoice
  customer: Customer | undefined
  business: BusinessSettings
}

export async function buildInvoicePdf({ invoice, customer, business }: InvoicePdfInput): Promise<jsPDF> {
  const doc = new jsPDF('p', 'mm', 'a4')
  const ctx: Ctx = { doc, y: MARGIN }

  const paidSoFar = invoice.payments.reduce((sum: number, p: Payment) => sum + p.amount, 0)
  const total = gstInclusiveTotal(invoice.amount, invoice.gstType)
  const balanceDue = Math.round((total - paidSoFar) * 100) / 100
  const paidInFull = balanceDue <= 0 && paidSoFar > 0
  // ATO rule, not a style choice: GST-registered businesses must head this "Tax Invoice"; a
  // business that isn't registered must not use those words.
  const heading = business.isGstRegistered ? 'TAX INVOICE' : 'INVOICE'

  await drawHeader(ctx, business, heading, invoice.number)
  drawHeadline(
    ctx,
    paidInFull ? 'Status' : 'Amount due',
    paidInFull ? 'Paid in full' : formatCurrency(Math.max(balanceDue, 0)),
    paidInFull ? COLOR.success : COLOR.primary,
    `Due ${formatDate(invoice.dueDate, { day: 'numeric', month: 'short', year: 'numeric' })}`
  )
  drawTwoColumnDetails(
    ctx,
    'Bill to',
    [invoice.customer, customer?.contact, customer?.address].filter((v): v is string => !!v),
    'Date issued',
    formatDate(invoice.date, { day: 'numeric', month: 'short', year: 'numeric' })
  )
  drawLineItemsTable(ctx, invoice.lineItems, invoice.gstType)

  if (paidSoFar > 0) {
    ensureSpace(ctx, 10 + invoice.payments.length * 5)
    label(ctx, 'Payments received', MARGIN)
    ctx.y += 6
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    for (const p of invoice.payments) {
      doc.setTextColor(...COLOR.muted)
      doc.text(`${formatDate(p.date)} · ${p.method}`, MARGIN, ctx.y)
      doc.setTextColor(...COLOR.foreground)
      doc.text(formatCurrency(p.amount), CONTENT_RIGHT, ctx.y, { align: 'right' })
      ctx.y += 5
    }
    ctx.y += 2
  }

  const paymentDetails =
    balanceDue > 0 && business.bankAccountNumber
      ? [
          business.bankAccountName && `Acc. name: ${business.bankAccountName}`,
          business.bankBsb && `BSB: ${business.bankBsb}`,
          `Acc. number: ${business.bankAccountNumber}`,
        ]
          .filter(Boolean)
          .join('\n')
      : ''
  drawNotesGrid(ctx, [
    { title: 'Notes', body: invoice.notes },
    { title: 'Payment terms', body: invoice.paymentTerms },
    { title: 'Payment details', body: paymentDetails },
  ])

  drawFooter(doc, 'Thank you for your business.')
  return doc
}

export interface QuotePdfInput {
  quote: Quote
  customer: Customer | undefined
  business: BusinessSettings
}

export async function buildQuotePdf({ quote, customer, business }: QuotePdfInput): Promise<jsPDF> {
  const doc = new jsPDF('p', 'mm', 'a4')
  const ctx: Ctx = { doc, y: MARGIN }

  const expiryDate = new Date(quote.date)
  expiryDate.setDate(expiryDate.getDate() + quote.validityDays)
  const total = gstInclusiveTotal(quote.amount, quote.gstType)

  await drawHeader(ctx, business, 'QUOTE', quote.number, (c) => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...COLOR.muted)
    doc.text(quote.status.toUpperCase(), CONTENT_RIGHT, c.y + 5, { align: 'right', charSpace: 0.4 })
  })
  drawHeadline(
    ctx,
    'Quote total',
    formatCurrency(total),
    COLOR.primary,
    `Valid until ${formatDate(expiryDate, { day: 'numeric', month: 'short', year: 'numeric' })}`
  )
  drawTwoColumnDetails(
    ctx,
    'Quote for',
    [quote.customer, customer?.contact, customer?.address].filter((v): v is string => !!v),
    'Date issued',
    formatDate(quote.date, { day: 'numeric', month: 'short', year: 'numeric' })
  )
  drawLineItemsTable(ctx, quote.lineItems, quote.gstType)
  drawNotesGrid(ctx, [
    { title: 'Terms', body: quote.terms },
    { title: 'Exclusions', body: quote.exclusions },
    { title: 'Notes', body: quote.notes },
  ])

  drawFooter(doc, 'Thank you for the opportunity to quote on this work.')
  return doc
}
