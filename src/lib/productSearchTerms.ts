// Turns what an electrician types ("2g gpo wht", "10 amp socket") into the words a supplier
// price list actually uses. Each inner list is one idea: a product matches the idea if it
// contains ANY of those words, and it has to match every idea the person typed.
// Keep the alternatives 3+ characters (or written like d/l) — a 2-letter word matches half the catalogue.

const FAMILIES: string[][] = [
  ['gpo', 'socket', 'outlet', 'power point', 'powerpoint'],
  ['double', 'dbl', '2g', '2 gang', '2gang'],
  ['single', 'sgl', '1g', '1 gang', '1gang'],
  ['triple', '3g', '3 gang', '3gang'],
  ['quad', '4g', '4 gang', '4gang'],
  ['white', 'wht'],
  ['black', 'blk'],
  ['grey', 'gray', 'gry'],
  ['brown', 'brn'],
  ['downlight', 'down light', 'd/l', 'led d/l'],
  ['switch', 'swtch'],
  ['light', 'lamp', 'luminaire', 'lumin'],
  ['cable', 'cbl', 'wire'],
  ['conduit', 'cndt'],
  ['junction box', 'j/box', 'jbox', 'j box'],
  ['circuit breaker', 'breaker', 'mcb'],
  ['safety switch', 'rcd'],
  ['switchboard', 'meter box', 'metre box', 'enclosure'],
  ['heatshrink', 'heat shrink', 'shrink'],
  ['cable tie', 'zip tie', 'cable ties'],
  ['exhaust fan', 'extraction fan'],
  ['screw', 'scr'],
  ['flexible', 'flex'],
  ['galvanised', 'galv'],
  ['stainless', 's/s'],
  ['weatherproof', 'w/p'],
  ['surface', 'surf'],
  ['flush'],
  ['metre', 'mtr'],
]

const STOP_WORDS = new Set(['a', 'an', 'and', 'for', 'the', 'with', 'of', 'to', 'in', 'on'])

// "10 amp" -> 10a, "2 gang" -> 2g — how catalogues write them.
function normaliseUnits(q: string) {
  return q
    .replace(/(\d+(?:\.\d+)?)\s*(?:amps?|a\b)/g, '$1a')
    .replace(/(\d+)\s*gang\b/g, '$1g')
    .replace(/(\d+(?:\.\d+)?)\s*(?:volts?|v\b)/g, '$1v')
}

function alternativesFor(word: string, phrase?: string[]): string[] {
  const alts = new Set<string>(phrase ?? [word])
  if (!phrase) {
    // "sockets" also finds "socket"
    if (word.length > 3 && word.endsWith('s')) alts.add(word.slice(0, -1))
    for (const family of FAMILIES) {
      if (family.includes(word) || (word.length > 3 && family.includes(word.slice(0, -1)))) family.forEach((f) => alts.add(f))
    }
  }
  return [...alts].slice(0, 12)
}

/** Groups for the search function. An empty list means "no search — just browse". */
export function buildSearchGroups(raw: string): string[][] {
  let q = normaliseUnits(raw.toLowerCase().trim().replace(/\s+/g, ' '))
  if (!q) return []

  const groups: string[][] = []

  // Multi-word ideas first ("power point", "junction box") so they aren't split into single words.
  for (const family of FAMILIES) {
    const phrase = family.find((f) => f.includes(' ') && q.includes(f))
    if (phrase) {
      groups.push(family)
      q = q.replace(phrase, ' ')
    }
  }

  for (const word of q.split(' ')) {
    if (!word || STOP_WORDS.has(word)) continue
    groups.push(alternativesFor(word))
  }
  return groups.slice(0, 8)
}
