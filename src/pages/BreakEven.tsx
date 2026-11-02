import { useEffect, useMemo, useState } from 'react'
import { Calculator } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { calcBreakEven, type BreakEvenInputs } from '@/lib/breakEven'
import { formatCurrency, formatMoney } from '@/lib/utils'

const STORAGE_KEY = 'tradeflow.breakEven.v1'

type Field = keyof BreakEvenInputs

// Generic starting point — everything is yours to overwrite, and it's remembered on this device.
const DEFAULTS: Record<Field, string> = {
  wage: '120000',
  superPercent: '12',
  vehicle: '',
  insurance: '',
  tools: '',
  licensing: '',
  phoneSoftware: '',
  accountant: '',
  ppe: '',
  otherCosts: '',
  leaveWeeks: '4',
  sickDays: '5',
  publicHolidays: '10',
  hoursPerDay: '8',
  unbillablePercent: '10',
  bufferPercent: '5',
  targetGpPercent: '10',
  currentRate: '',
}

function load(): Record<Field, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch {
    /* private window or blocked storage — just start from the defaults */
  }
  return DEFAULTS
}

function NumberField({
  label,
  hint,
  value,
  onChange,
  prefix,
  suffix,
}: {
  label: string
  hint?: string
  value: string
  onChange: (v: string) => void
  prefix?: string
  suffix?: string
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="mt-1 flex items-center gap-1.5">
        {prefix && <span className="text-sm text-muted-foreground">{prefix}</span>}
        <Input type="number" inputMode="decimal" min="0" step="any" value={value} onChange={(e) => onChange(e.target.value)} />
        {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
      </div>
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  )
}

export default function BreakEven() {
  const [form, setForm] = useState<Record<Field, string>>(load)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(form))
    } catch {
      /* not saved — the calculator still works */
    }
  }, [form])

  const set = (f: Field) => (v: string) => setForm((prev) => ({ ...prev, [f]: v }))
  const field = (f: Field, label: string, extra?: { hint?: string; prefix?: string; suffix?: string }) => (
    <NumberField label={label} value={form[f]} onChange={set(f)} {...extra} />
  )

  const result = useMemo(() => {
    const n = (f: Field) => {
      const v = Number(form[f])
      return Number.isFinite(v) && v > 0 ? v : 0
    }
    const inputs = Object.fromEntries((Object.keys(DEFAULTS) as Field[]).map((f) => [f, n(f)])) as unknown as BreakEvenInputs
    return calcBreakEven(inputs)
  }, [form])

  const currentRate = Number(form.currentRate)
  const hasCurrent = form.currentRate.trim() !== '' && Number.isFinite(currentRate) && currentRate > 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Break-even rate</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          What you need to charge per hour to cover your wage, super and every running cost. All figures are per year and exclude GST.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Your pay</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {field('wage', 'Wage you want (before tax)', { prefix: '$', hint: 'What you would earn as an employee.' })}
              {field('superPercent', 'Super', { suffix: '%', hint: 'Nobody pays this for a sole trader — pay it to yourself.' })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Running costs</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {field('vehicle', 'Vehicle', { prefix: '$', hint: 'Fuel, rego, insurance, servicing, tyres, repairs and depreciation.' })}
              {field('insurance', 'Insurance', { prefix: '$', hint: 'Public liability, tools, income protection.' })}
              {field('tools', 'Tools and test gear', { prefix: '$' })}
              {field('licensing', 'Licence and training', { prefix: '$' })}
              {field('phoneSoftware', 'Phone and software', { prefix: '$' })}
              {field('accountant', 'Accountant and BAS', { prefix: '$' })}
              {field('ppe', 'PPE and uniforms', { prefix: '$' })}
              {field('otherCosts', 'Anything else', { prefix: '$' })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Hours you can bill</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {field('leaveWeeks', 'Annual leave', { suffix: 'weeks' })}
              {field('sickDays', 'Sick days', { suffix: 'days' })}
              {field('publicHolidays', 'Public holidays', { suffix: 'days', hint: 'Weekday public holidays — about 10 in NSW.' })}
              {field('hoursPerDay', 'Hours per day', { suffix: 'hrs' })}
              {field('unbillablePercent', 'Unbillable time', { suffix: '%', hint: 'Merchant runs, quoting, admin, unpaid driving. 0% only if you are on site paid all day.' })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Pricing</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              {field('bufferPercent', 'Safety buffer', { suffix: '%', hint: 'For slow patches and late payers.' })}
              {field('targetGpPercent', 'Target GP on labour', { suffix: '%' })}
              {field('currentRate', 'Rate you charge now', { prefix: '$', hint: 'Per hour, ex GST.' })}
            </CardContent>
          </Card>
        </div>

        <div className="lg:sticky lg:top-6 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="size-4 text-muted-foreground" />
                Your rate
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!result ? (
                <p className="text-sm text-muted-foreground">
                  Check your hours — there are no billable hours left, or the GP is 100% or more.
                </p>
              ) : (
                <>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Break-even</p>
                    <p className="text-3xl font-semibold tracking-tight">{formatMoney(result.breakEvenRate)}<span className="text-base font-normal text-muted-foreground"> /hr + GST</span></p>
                    <p className="mt-1 text-xs text-muted-foreground">Cover everything, take your wage, make nothing extra.</p>
                  </div>
                  <div className="space-y-2 border-t pt-3 text-sm">
                    <Row label="With safety buffer" value={`${formatMoney(result.rateWithBuffer)} /hr`} />
                    <Row label={`Charge-out at ${Number(form.targetGpPercent) || 0}% GP`} value={`${formatMoney(result.rateAtTargetGp)} /hr`} strong />
                  </div>
                  <div className="space-y-2 border-t pt-3 text-sm">
                    <Row label="Working days" value={String(result.workingDays)} />
                    <Row label="Billable hours" value={Math.round(result.billableHours).toLocaleString('en-AU')} />
                    <Row label="Wage + super" value={formatCurrency(result.wageAndSuper)} />
                    <Row label="Running costs" value={formatCurrency(result.overheads)} />
                    <Row label="Total to cover" value={formatCurrency(result.totalCost)} strong />
                  </div>
                  {hasCurrent && (
                    <div className="space-y-2 border-t pt-3 text-sm">
                      <p className="text-xs font-medium text-muted-foreground">At {formatMoney(currentRate)} /hr you are</p>
                      <p className={result.yearlyGap > 0 ? 'font-medium text-warning' : 'font-medium text-success'}>
                        {formatCurrency(Math.abs(result.yearlyGap))} a year {result.yearlyGap > 0 ? 'short of break-even' : 'ahead of break-even'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        That works out to a wage of about {formatCurrency(result.effectiveWage)} before tax, if you bill every hour.
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className={strong ? 'font-semibold' : 'font-medium'}>{value}</span>
    </div>
  )
}
