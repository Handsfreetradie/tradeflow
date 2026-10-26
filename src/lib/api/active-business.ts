// The business the signed-in person is currently working in, for the plain (non-React) API
// helpers in this folder. ActiveBusinessProvider keeps it in step; it is never trusted for
// security — every request is still checked against the person's memberships server-side / by RLS.
let activeBusinessId: string | null = null

export function setApiBusinessId(id: string | null) {
  activeBusinessId = id
}

export function getApiBusinessId(): string | null {
  return activeBusinessId
}

export function requireApiBusinessId(): string {
  if (!activeBusinessId) throw new Error('Could not resolve your business')
  return activeBusinessId
}
