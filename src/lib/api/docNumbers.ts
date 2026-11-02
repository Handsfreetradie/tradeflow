import { supabase } from "@/lib/supabase";

export type DocKind = "invoice" | "quote" | "job" | "po";

const LABEL: Record<DocKind, string> = {
  invoice: "invoice",
  quote: "quote",
  job: "job",
  po: "purchase order",
};

/** Next number for this business: one more than its highest existing one, so deleting the latest frees it up again. */
async function allocateNumber(
  kind: DocKind,
  businessId: string,
): Promise<string> {
  const { data, error } = await supabase.rpc("next_doc_number", {
    p_business: businessId,
    p_kind: kind,
  });
  if (error || !data)
    throw new Error(
      error?.message ?? `Failed to allocate ${LABEL[kind]} number`,
    );
  return data;
}

/**
 * Hands `run` a fresh number and retries with another if two people grabbed the same one at the same moment
 * (the unique rule on the table turns that into a 23505 error).
 */
export async function insertNumbered<R extends { error: { code?: string; message: string } | null }>(
  kind: DocKind,
  businessId: string | null,
  run: (number: string) => PromiseLike<R>
): Promise<R> {
  if (!businessId) throw new Error('Could not resolve your business')
  for (let attempt = 0; ; attempt++) {
    const result = await run(await allocateNumber(kind, businessId))
    if (result.error?.code === '23505' && attempt < 2) continue
    return result
  }
}
