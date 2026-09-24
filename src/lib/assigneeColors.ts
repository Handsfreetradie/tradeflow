// Deterministic colour-coding per team member, used on the calendar and anywhere else a job's
// assignee needs a consistent visual identity. Hash-based (not index-based) so it stays stable
// even if `teamMembers` in demo-data.ts is reordered, and degrades gracefully for any future
// employee name not yet in that list.

const palette = [
  { text: 'text-primary', bg: 'bg-primary/10', dot: 'bg-primary', hex: 'hsl(221 83% 53%)' },
  { text: 'text-success', bg: 'bg-success/10', dot: 'bg-success', hex: 'hsl(142 71% 38%)' },
  { text: 'text-purple', bg: 'bg-purple/10', dot: 'bg-purple', hex: 'hsl(262 83% 58%)' },
  { text: 'text-warning', bg: 'bg-warning/10', dot: 'bg-warning', hex: 'hsl(24 95% 53%)' },
  { text: 'text-destructive', bg: 'bg-destructive/10', dot: 'bg-destructive', hex: 'hsl(0 72% 51%)' },
  { text: 'text-[#0891b2]', bg: 'bg-[#0891b2]/10', dot: 'bg-[#0891b2]', hex: 'hsl(192 91% 36%)' },
]

function hashName(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  return hash
}

export function assigneeColor(name: string) {
  return palette[hashName(name) % palette.length]
}

export function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}
