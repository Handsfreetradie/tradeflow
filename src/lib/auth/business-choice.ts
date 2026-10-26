// Which business the person picked for this browser session. Session-scoped on purpose: a fresh
// sign-in asks again. Only a UI convenience — what someone can actually access is enforced by RLS.
export const CHOSEN_KEY = 'tf-active-business'
export const LAST_USED_KEY = 'tf-last-business'

export function readChoice(store: 'session' | 'local', key: string): string | null {
  try {
    return (store === 'session' ? sessionStorage : localStorage).getItem(key)
  } catch {
    return null
  }
}

export function writeChoice(store: 'session' | 'local', key: string, value: string | null) {
  try {
    const s = store === 'session' ? sessionStorage : localStorage
    if (value === null) s.removeItem(key)
    else s.setItem(key, value)
  } catch {
    // Storage can be unavailable (private windows etc.) — the chooser just asks again.
  }
}

/** Forget this session's business choice, so the next sign-in asks again. */
export function clearBusinessChoice() {
  writeChoice('session', CHOSEN_KEY, null)
}
