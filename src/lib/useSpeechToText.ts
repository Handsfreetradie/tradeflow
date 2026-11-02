import { useCallback, useEffect, useRef, useState } from 'react'

// The browser's built-in speech recognition isn't in TypeScript's DOM types yet.
interface RecognitionResult {
  isFinal: boolean
  0: { transcript: string }
}
interface RecognitionEvent {
  results: ArrayLike<RecognitionResult>
}
interface Recognition {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((e: RecognitionEvent) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}
type RecognitionCtor = new () => Recognition

function getCtor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

/**
 * Dictation using the phone's/browser's own speech-to-text (nothing is sent to TradeFlow's servers).
 * `onText` gets the full transcript of this listening session each time it changes.
 */
export function useSpeechToText(onText: (transcript: string) => void) {
  const [listening, setListening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<Recognition | null>(null)
  const onTextRef = useRef(onText)
  useEffect(() => {
    onTextRef.current = onText
  }, [onText])
  const supported = getCtor() !== null

  const stop = useCallback(() => recognitionRef.current?.stop(), [])

  const start = useCallback(() => {
    const Ctor = getCtor()
    if (!Ctor) return
    setError(null)
    const recognition = new Ctor()
    recognition.lang = 'en-AU'
    recognition.continuous = true
    recognition.interimResults = true
    recognition.onresult = (e) => {
      const parts: string[] = []
      for (let i = 0; i < e.results.length; i++) parts.push(e.results[i][0].transcript)
      onTextRef.current(parts.join(' ').replace(/\s+/g, ' ').trim())
    }
    recognition.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') setError('Microphone is blocked — allow it in your browser settings, or just type.')
      else if (e.error !== 'no-speech' && e.error !== 'aborted') setError("Couldn't hear that — try again, or type it.")
    }
    recognition.onend = () => setListening(false)
    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }, [])

  useEffect(() => () => recognitionRef.current?.stop(), [])

  return { supported, listening, error, start, stop }
}
