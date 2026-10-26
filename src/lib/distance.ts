/**
 * Address search and driving distance using free OpenStreetMap-based services:
 * Photon (komoot) for address search-as-you-type, and the public OSRM demo router for road distance.
 * No API key. Both are fair-use public services — searches are debounced by the caller and the
 * route is only requested on an explicit action.
 */

export interface Place {
  label: string
  lat: number
  lon: number
}

const TIMEOUT_MS = 10_000
// Australia only (lon_min, lat_min, lon_max, lat_max).
const AU_BBOX = '112,-44,154,-10'

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  signal?.addEventListener('abort', () => controller.abort())
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) throw new Error(`Map service returned ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      if (signal?.aborted) throw e
      throw new Error('The map service took too long — try again or type the km')
    }
    if (e instanceof TypeError) throw new Error("Couldn't reach the map service — check your connection or type the km")
    throw e
  } finally {
    clearTimeout(timer)
  }
}

interface PhotonFeature {
  geometry: { coordinates: [number, number] }
  properties: {
    name?: string
    osm_key?: string
    housenumber?: string
    street?: string
    city?: string
    district?: string
    locality?: string
    state?: string
    postcode?: string
  }
}

const STATE_ABBR: Record<string, string> = {
  'New South Wales': 'NSW',
  Victoria: 'VIC',
  Queensland: 'QLD',
  'Western Australia': 'WA',
  'South Australia': 'SA',
  Tasmania: 'TAS',
  'Northern Territory': 'NT',
  'Australian Capital Territory': 'ACT',
}

const STREET_TYPES: Record<string, string> = {
  st: 'street', rd: 'road', ave: 'avenue', av: 'avenue', dr: 'drive', ct: 'court', cres: 'crescent', pde: 'parade',
  hwy: 'highway', pl: 'place', ln: 'lane', cl: 'close', blvd: 'boulevard', tce: 'terrace', cct: 'circuit', esp: 'esplanade',
}
const TYPE_WORDS = new Set(Object.values(STREET_TYPES))

function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => STREET_TYPES[t] ?? t)
}

/** House (and unit) number typed at the start of the query, e.g. "19 ..." or "3/12 ...". */
function typedNumber(query: string): string | undefined {
  const m = query.match(/^\s*(?:(\w+)\s*\/\s*)?(\d+[A-Za-z]?(?:\s*-\s*\d+[A-Za-z]?)?)\s+\S/)
  return m ? `${m[1] ? `${m[1]}/` : ''}${m[2].replace(/\s+/g, '')}` : undefined
}

/**
 * OpenStreetMap doesn't know every house number — Photon then returns just the street, or the nearest
 * numbered house. When the result is on the street the user typed, keep the number they typed so the
 * saved address (and the tax log) shows what they meant.
 */
function toPlace(f: PhotonFeature, query: string): Place {
  const p = f.properties
  const streetName = p.street ?? (p.osm_key === 'highway' ? p.name : undefined)
  const suburb = p.district ?? p.locality ?? p.city
  const state = p.state ? STATE_ABBR[p.state] ?? p.state : undefined
  const tail = [suburb, [state, p.postcode].filter(Boolean).join(' ')].filter(Boolean).join(', ')

  let number = p.housenumber
  const typed = typedNumber(query)
  if (typed && streetName) {
    const distinctive = tokens(streetName).filter((t) => !TYPE_WORDS.has(t))
    const queryTokens = new Set(tokens(query))
    if (distinctive.length > 0 && distinctive.every((t) => queryTokens.has(t))) number = typed
  }

  const street = streetName ? (number ? `${number} ${streetName}` : streetName) : p.name
  // Avoid "Dalmeny, Dalmeny NSW" when the result is the suburb itself.
  const label = street && street !== suburb ? `${street}, ${tail}` : tail || street || 'Unknown place'
  const [lon, lat] = f.geometry.coordinates
  return { label, lat, lon }
}

/** Address suggestions for a partly-typed query. Throws an AbortError if `signal` aborts. */
export async function searchPlaces(query: string, signal?: AbortSignal): Promise<Place[]> {
  const data = await fetchJson<{ features: PhotonFeature[] }>(
    `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=6&lang=en&bbox=${AU_BBOX}`,
    signal
  )
  const seen = new Set<string>()
  return data.features
    .map((f) => toPlace(f, query))
    .filter((p) => (seen.has(p.label) ? false : (seen.add(p.label), true)))
}

/** Best single match for an address that wasn't picked from the suggestions. */
export async function findPlace(address: string): Promise<Place> {
  const results = await searchPlaces(address)
  if (!results.length) throw new Error(`Couldn't find "${address}" on the map — pick a suggestion or type the km`)
  return results[0]
}

export interface DistanceResult {
  km: number
  from: Place
  to: Place
}

/** One-way driving distance in km (rounded to 0.1). Pass a Place when you have one, a string to look it up. */
export async function drivingDistance(from: Place | string, to: Place | string): Promise<DistanceResult> {
  const [a, b] = await Promise.all([typeof from === 'string' ? findPlace(from) : from, typeof to === 'string' ? findPlace(to) : to])
  const route = await fetchJson<{ code: string; routes?: { distance: number }[] }>(
    `https://router.project-osrm.org/route/v1/driving/${a.lon},${a.lat};${b.lon},${b.lat}?overview=false`
  )
  if (route.code !== 'Ok' || !route.routes?.length) throw new Error("Couldn't find a driving route between those addresses — type the km")
  return { km: Math.round(route.routes[0].distance / 100) / 10, from: a, to: b }
}
