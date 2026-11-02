import { supabase } from '@/lib/supabase'
import { getApiBusinessId, requireApiBusinessId } from '@/lib/api/active-business'
import type { ExpenseCategory } from '@/lib/demo-data'
import type { StatementLine } from '@/lib/bankStatement'

export type BankFlagKind = 'missing_expense' | 'unsure' | 'missing_receipt' | 'possible_duplicate'

export interface BankFlag {
  id: string
  date: string
  description: string
  amount: number
  kind: BankFlagKind
  reason: string
  suggestedCategory: ExpenseCategory | null
  suggestedSupplier: string | null
}

export interface ReviewSummary {
  total: number
  matched: number
  personal: number
  flagged: number
  newFlags: number
}

type FlagRow = {
  id: string
  txn_date: string
  description: string
  amount: number
  kind: string
  reason: string
  suggested_category: string | null
  suggested_supplier: string | null
}

function fromRow(row: FlagRow): BankFlag {
  return {
    id: row.id,
    date: row.txn_date,
    description: row.description,
    amount: Number(row.amount),
    kind: row.kind as BankFlagKind,
    reason: row.reason,
    suggestedCategory: row.suggested_category as ExpenseCategory | null,
    suggestedSupplier: row.suggested_supplier,
  }
}

async function invokeBank<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('bank-statement', { body: { ...body, businessId: requireApiBusinessId() } })
  if (error) {
    let message = error.message
    try {
      const response = (error as { context?: Response }).context
      const parsed = response ? await response.json() : null
      if (parsed?.error) message = parsed.error
    } catch {
      // keep the generic message
    }
    throw new Error(message)
  }
  return data as T
}

/** Reads a PDF/photo (or CSV text the app couldn't map itself) into debit lines. Nothing is stored. */
export async function extractStatementLines(input: { fileBase64?: string; mimeType?: string; text?: string }): Promise<StatementLine[]> {
  const result = await invokeBank<{ lines: StatementLine[] }>({ action: 'extract', ...input })
  return result.lines
}

/** Matches lines against recorded expenses and saves only the ones that need the owner's attention. */
export async function reviewStatementLines(lines: StatementLine[]): Promise<ReviewSummary> {
  return invokeBank<ReviewSummary>({ action: 'review', lines })
}

const FLAG_COLUMNS = 'id, txn_date, description, amount, kind, reason, suggested_category, suggested_supplier'

export async function listBankFlags(): Promise<BankFlag[]> {
  const businessId = getApiBusinessId()
  if (!businessId) return []
  const { data, error } = await supabase
    .from('bank_statement_flags')
    .select(FLAG_COLUMNS)
    .eq('business_id', businessId)
    .eq('status', 'pending')
    .order('txn_date', { ascending: false })
  if (error) throw new Error(error.message)
  return (data as FlagRow[]).map(fromRow)
}

export async function getBankFlag(id: string): Promise<BankFlag | null> {
  const { data, error } = await supabase.from('bank_statement_flags').select(FLAG_COLUMNS).eq('id', id).maybeSingle()
  if (error) throw new Error(error.message)
  return data ? fromRow(data as FlagRow) : null
}

export async function dismissBankFlag(id: string): Promise<void> {
  const { error } = await supabase.from('bank_statement_flags').update({ status: 'dismissed' }).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function markBankFlagAdded(id: string, expenseId: string): Promise<void> {
  const { error } = await supabase.from('bank_statement_flags').update({ status: 'added', created_expense_id: expenseId }).eq('id', id)
  if (error) throw new Error(error.message)
}
