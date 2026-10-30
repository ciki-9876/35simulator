// Pay and cost of living from data/income.json. tools/simulate.py implements the same rules
// (annual_pay / monthly_living); keep the two in step.

export interface IncomeSeries {
  values: Record<string, number | null>
}

export interface IncomeTable {
  series: Record<string, IncomeSeries>
  /** sub: pay factor by sub-state (service jobs). */
  paths: Record<string, { series: string; by: 'level' | 'experience'; sub?: Record<string, number> }>
  factors: {
    experience: { start: number; per_year: number; cap: number }
    bigtech_levels: { values: number[] }
    degree: { values: Record<string, number> }
    city: { values: Record<string, number> }
    personal: { min: number; max: number }
  }
  living: { base_2014: Record<string, number>; spend_share: number; frugal: number }
}

/** What pay and living cost depend on (a subset of Life). */
export interface Earner {
  path: string
  sub: string | null
  level: number
  age: number
  degree: number
  cityTier: number
  personal: number
  incomeScale: number
}

/** Pay changes each July, so the game year that starts at this age sets the data year. */
const dataYear = (age: number) => String(Math.min(2027, 2014 + age - 22))

export function annualPay(t: IncomeTable, e: Earner): number {
  const key = e.path === 'bigtech' && e.sub === 'outsource' ? 'bigtech_outsource' : e.path
  const rule = t.paths[key]
  if (!rule) return 0
  const base = t.series[rule.series].values[dataYear(e.age)] ?? 0
  const f = t.factors
  const step = rule.by === 'level'
    ? f.bigtech_levels.values[Math.max(1, Math.min(6, e.level)) - 1]
    : Math.min(f.experience.cap, f.experience.start + f.experience.per_year * (e.age - 22))
  const job = rule.sub?.[e.sub ?? ''] ?? 1
  return base * step * job * f.degree.values[String(e.degree)] * f.city.values[String(e.cityTier)] * e.personal * e.incomeScale
}

/**
 * What a month costs: living cost and the mortgage, plus a share of whatever pay is left above them.
 * When pay does not cover the living cost, people cut back to it, down to a floor (`frugal`).
 */
export function monthlySpending(t: IncomeTable, monthlyPay: number, living: number, mortgage: number): number {
  const core = monthlyPay >= living ? living : Math.max(t.living.frugal * living, monthlyPay)
  const fixed = core + mortgage
  return fixed + t.living.spend_share * Math.max(0, monthlyPay - fixed)
}

/** Cost of living in shared rented housing in your city this year; Life scales it by how you live. */
export function monthlyLiving(t: IncomeTable, e: Earner): number {
  const c = t.series.urban_consumption.values
  const index = (c[dataYear(e.age)] ?? 0) / (c['2014'] ?? 1)
  return t.living.base_2014[String(e.cityTier)] * index
}
