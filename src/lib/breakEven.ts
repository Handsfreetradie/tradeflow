// Break-even hourly rate for a sole trader: what the year costs (your wage, super and every
// running cost) divided by the hours you can actually bill.

export interface BreakEvenInputs {
  wage: number
  superPercent: number
  vehicle: number
  insurance: number
  tools: number
  licensing: number
  phoneSoftware: number
  accountant: number
  ppe: number
  otherCosts: number
  leaveWeeks: number
  sickDays: number
  publicHolidays: number
  hoursPerDay: number
  unbillablePercent: number
  bufferPercent: number
  targetGpPercent: number
  currentRate: number
}

export interface BreakEvenResult {
  workingDays: number
  billableHours: number
  wageAndSuper: number
  overheads: number
  totalCost: number
  breakEvenRate: number
  rateWithBuffer: number
  rateAtTargetGp: number
  /** Dollars a year you're short (positive) or ahead (negative) charging `currentRate` instead of break-even. */
  yearlyGap: number
  /** The wage (before super) left over after running costs when charging `currentRate`. */
  effectiveWage: number
}

export function calcBreakEven(i: BreakEvenInputs): BreakEvenResult | null {
  const workingDays = 52 * 5 - i.leaveWeeks * 5 - i.sickDays - i.publicHolidays
  const billableHours = workingDays * i.hoursPerDay * (1 - i.unbillablePercent / 100)
  if (!(billableHours > 0) || i.targetGpPercent >= 100) return null

  const wageAndSuper = i.wage * (1 + i.superPercent / 100)
  const overheads =
    i.vehicle + i.insurance + i.tools + i.licensing + i.phoneSoftware + i.accountant + i.ppe + i.otherCosts
  const totalCost = wageAndSuper + overheads
  const breakEvenRate = totalCost / billableHours
  const rateWithBuffer = (totalCost * (1 + i.bufferPercent / 100)) / billableHours

  return {
    workingDays,
    billableHours,
    wageAndSuper,
    overheads,
    totalCost,
    breakEvenRate,
    rateWithBuffer,
    rateAtTargetGp: rateWithBuffer / (1 - i.targetGpPercent / 100),
    yearlyGap: (breakEvenRate - i.currentRate) * billableHours,
    effectiveWage: (i.currentRate * billableHours - overheads) / (1 + i.superPercent / 100),
  }
}
