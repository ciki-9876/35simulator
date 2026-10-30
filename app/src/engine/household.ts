// Housing, marriage, children and parents from data/household.json. tools/simulate.py implements the
// same rules (home_price / buy_home / ...); keep the two in step.

export interface HouseholdTable {
  series: Record<'home_price' | 'lpr_5y' | 'new_loan_rate' | 'stock_rate_cap', { values: Record<string, number> }>
  home: {
    city_price: { values: Record<string, number> }
    size: { values: Record<string, number> }
    hometown_tier: number
    down_payment: { tier1: Record<string, number>; other: Record<string, number> }
    fees: number
    loan_months: number
    parent_support: { values: Record<string, number> }
  }
  living: { housing: Record<string, number>; couple: number }
  child: { annual_2023: Record<string, number>; your_share: number }
  parents: { age: [number, number]; health: [number, number]; decline_from: number; only_child: number }
}

/** A home you own (your share of it) and its loan. */
export interface Home {
  /** Full price when bought; you own `share` of it. */
  price: number
  share: number
  /** Game year it was bought. */
  year: number
  tier: number
  hometown: boolean
  /** Rate when bought, in percent; the loan floats with the 5-year rate after that. */
  baseRate: number
  rate: number
  balance: number
  months: number
  payment: number
}

export const gameYear = (age: number) => Math.min(2027, 2014 + age - 22)

const at = (values: Record<string, number>, year: number) => values[String(year)] ?? 0

/** Full price of an ordinary home in a city tier in a game year. */
export function homePrice(t: HouseholdTable, tier: number, year: number): number {
  return at(t.series.home_price.values, year) * t.home.city_price.values[String(tier)] * t.home.size.values[String(tier)]
}

export function downRatio(t: HouseholdTable, tier: number, year: number): number {
  return at(tier === 1 ? t.home.down_payment.tier1 : t.home.down_payment.other, year)
}

/** Equal monthly payment that clears `balance` in `months` at `rate` percent a year. */
export function annuity(balance: number, rate: number, months: number): number {
  if (balance <= 0 || months <= 0) return 0
  const r = rate / 100 / 12
  return r === 0 ? balance / months : (balance * r) / (1 - Math.pow(1 + r, -months))
}

/** What buying costs you in cash now, and what your parents put in. */
export function purchase(t: HouseholdTable, tier: number, year: number, share: number, familyTier: number) {
  const mine = homePrice(t, tier, year) * share
  const down = mine * downRatio(t, tier, year)
  const cash = down + mine * t.home.fees
  const support = down * (t.home.parent_support.values[String(familyTier)] ?? 0)
  return { mine, down, cash, support }
}

/** The loan's rate in a later year: it follows the 5-year rate, and from 2023 existing loans were cut. */
export function loanRate(t: HouseholdTable, h: Home, year: number): number {
  const lpr = t.series.lpr_5y.values
  let r = h.baseRate + at(lpr, year) - at(lpr, h.year)
  const cap = t.series.stock_rate_cap.values[String(year)]
  if (cap !== undefined) r = Math.min(r, cap)
  return r
}

/** Your share of the home's value now, moved with the national price series. */
export function homeValue(t: HouseholdTable, h: Home, year: number): number {
  const p = t.series.home_price.values
  return h.price * h.share * at(p, year) / at(p, h.year)
}

/** Your half of the children's yearly cost. */
export function childCost(t: HouseholdTable, tier: number, year: number, consumption: Record<string, number | null>): number {
  const index = (consumption[String(year)] ?? 0) / (consumption['2023'] ?? 1)
  return t.child.annual_2023[String(tier)] * index * t.child.your_share
}
