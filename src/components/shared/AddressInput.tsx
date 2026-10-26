import { useEffect, useRef, useState } from 'react'
import { Loader2, MapPin } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { searchPlaces, type Place } from '@/lib/distance'

const MIN_CHARS = 4
const DEBOUNCE_MS = 350

/**
 * Text input that suggests Australian addresses as you type. `onChange` fires for every keystroke
 * (so the caller should treat any previously picked place as stale); `onSelect` fires when a
 * suggestion is chosen, with exact coordinates.
 */
export function AddressInput({
  value,
  onChange,
  onSelect,
  placeholder,
}: {
  value: string
  onChange: (text: string) => void
  onSelect: (place: Place) => void
  placeholder?: string
}) {
  const [suggestions, setSuggestions] = useState<Place[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  // Only search for text the user typed — not text we filled in from a selection or a job.
  const typedRef = useRef(false)

  useEffect(() => {
    if (!typedRef.current || value.trim().length < MIN_CHARS) {
      setSuggestions([])
      setLoading(false)
      return
    }
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const results = await searchPlaces(value.trim(), controller.signal)
        setSuggestions(results)
        setOpen(true)
      } catch (e) {
        if (!(e instanceof DOMException && e.name === 'AbortError')) setSuggestions([])
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, DEBOUNCE_MS)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [value])

  return (
    <div className="relative">
      <Input
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(e) => {
          typedRef.current = true
          onChange(e.target.value)
        }}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
        className="pr-9"
      />
      {loading ? <Loader2 className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" /> : null}
      {open && suggestions.length > 0 ? (
        <ul className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-auto rounded-lg border border-border bg-popover p-1 shadow-lg">
          {suggestions.map((place) => (
            <li key={`${place.label}-${place.lat}`}>
              {/* onMouseDown (not onClick) so it lands before the input's blur closes the list. */}
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  typedRef.current = false
                  setOpen(false)
                  setSuggestions([])
                  onSelect(place)
                }}
                className="flex w-full items-start gap-2 rounded-md px-2.5 py-2 text-left text-sm hover:bg-accent"
              >
                <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                <span>{place.label}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
