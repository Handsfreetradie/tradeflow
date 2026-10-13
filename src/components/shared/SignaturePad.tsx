import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'

/** A simple finger/stylus signature capture surface. Reports a PNG data URL once something has
 * been drawn, or null once cleared — there's no "save" step, the parent just reads the latest
 * value when the surrounding form is submitted. */
export function SignaturePad({ value, onChange }: { value: string | null; onChange: (dataUrl: string | null) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawingRef = useRef(false)
  const hasInkRef = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ratio = window.devicePixelRatio || 1
    const { width, height } = canvas.getBoundingClientRect()
    canvas.width = width * ratio
    canvas.height = height * ratio
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.scale(ratio, ratio)
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#111827'
  }, [])

  const pointFromEvent = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx) return
    drawingRef.current = true
    const { x, y } = pointFromEvent(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const { x, y } = pointFromEvent(e)
    ctx.lineTo(x, y)
    ctx.stroke()
    hasInkRef.current = true
  }

  const end = () => {
    if (!drawingRef.current) return
    drawingRef.current = false
    if (hasInkRef.current && canvasRef.current) onChange(canvasRef.current.toDataURL('image/png'))
  }

  const clear = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    hasInkRef.current = false
    onChange(null)
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        className="h-32 w-full touch-none rounded-lg border border-input bg-white"
        onPointerDown={start}
        onPointerMove={draw}
        onPointerUp={end}
        onPointerLeave={end}
      />
      <div className="mt-1.5 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Sign above to confirm this expense</p>
        {value && (
          <Button type="button" variant="ghost" size="sm" onClick={clear}>
            Clear
          </Button>
        )}
      </div>
    </div>
  )
}
