/**
 * Driving distance between two street addresses using free OpenStreetMap services:
 * Nominatim (address -> lat/lon) and the public OSRM demo router (lat/lon -> road distance).
 * No API key. Both are fair-use services, so this is only ever called on an explicit user action
 * (button press / picking a job), never on every keystroke.
 */

const TIMEOUT_MS = 10_000
const geocodeCache = new Map<string, { lat: number; lon: number }>()

async function fetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) throw new Error(`Map service returned ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw new Error('The map service took too long — try again or type the km')
    if (e instanceof TypeError) throw new Error("Couldn't reach the map service — check your connection or type the km")
    throw e
  } finally {
    clearTimeout(timer)
  }
}

async function searchOnce(query: string): Promise<{ lat: number; lon: number } | null> {
  const results = await fetchJson<{ lat: string; lon: string }[]>(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=au&q=${encodeURIComponent(query)}`
  )
  if (!results.length) return null
  return { lat: Number(results[0].lat), lon: Number(results[0].lon) }
}

const cacheKey = (address: string) => address.trim().toLowerCase()

async function geocode(address: string): Promise<{ lat: number; lon: number }> {
  const key = cacheKey(address)
  const cached = geocodeCache.get(key)
  if (cached) return cached

  // OSM often doesn't know unit numbers ("3/12 Smith St"), so retry with just the street number.
  const withoutUnit = address.replace(/^\s*(?:unit|apt|apartment|suite|shop|lot)?\s*[\w-]+\s*\/\s*/i, '')
  const attempts = [address, ...(withoutUnit !== address ? [withoutUnit] : [])]

  for (const attempt of attempts) {
    const found = await searchOnce(attempt)
    if (found) {
      geocodeCache.set(key, found)
      return found
    }
  }
  throw new Error(`Couldn't find "${address}" on the map — check the address or type the km`)
}

/** One-way driving distance in km, rounded to 0.1. */
export async function drivingDistanceKm(from: string, to: string): Promise<number> {
  const needsSecondLookup = !geocodeCache.has(cacheKey(from)) && !geocodeCache.has(cacheKey(to))
  const a = await geocode(from)
  // Nominatim asks for no more than one request per second.
  if (needsSecondLookup) await new Promise((r) => setTimeout(r, 1100))
  const b = await geocode(to)
  const route = await fetchJson<{ code: string; routes?: { distance: number }[] }>(
    `https://router.project-osrm.org/route/v1/driving/${a.lon},${a.lat};${b.lon},${b.lat}?overview=false`
  )
  if (route.code !== 'Ok' || !route.routes?.length) throw new Error("Couldn't find a driving route between those addresses — type the km")
  return Math.round(route.routes[0].distance / 100) / 10
}
