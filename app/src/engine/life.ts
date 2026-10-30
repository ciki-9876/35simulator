// One player's state. Mirrors the Life class in tools/simulate.py; keep the two in step so the parity
// check (tools/parity.py) stays meaningful. Names, schools and other flavour live in ../profile.ts.
import { annuity, childCost, gameYear, homeValue, loanRate, purchase, type Home, type HouseholdTable } from './household'
import { annualPay, monthlyLiving, monthlySpending, type IncomeTable } from './income'
import { Rng } from './rng'
import { drawJob, type ServiceTable } from './service'
import { COMPANY_FLAGS, drawCompany, type WhitecollarTable } from './whitecollar'

export const STATS = ['health', 'mood', 'ability', 'social'] as const
export type Stat = typeof STATS[number]

export interface Roommate {
  rank: string
  path: string
  close: number
  /** Came out of the crime path (prison or case closed); release events are about this roommate. */
  released: boolean
}

export interface Modifier {
  months?: number
  [key: string]: number | undefined
}

/** One month of a life, for the life map and the reunion strips. */
export interface MonthSnapshot {
  path: string
  sub: string | null
  entity: string
  mood: number
  money: number
}

export class Life {
  age = 22
  gender: 'm' | 'f'
  schoolTier: number
  degree: number
  familyTier: number
  cityTier: number
  stats: Record<Stat, number>
  money: number
  flags = new Set<string>()
  modules = new Set<string>()
  path = 'unemployed'
  sub: string | null = null
  role: string | null = null
  level = 1
  exitReason: string | null = null
  record = 'none'
  relationship: string
  /** with_parents, shared (合租), rent (整租) or own. */
  living: string
  kids = 0
  home: Home | null = null
  /** Father's age; the parents are about the same age. */
  parentAge: number
  /** Hidden; falls each year from 55 and drives the parents' illness events. */
  parentHealth: number
  scenario = new Set<string>()
  roommates: Roommate[]
  months: Record<string, number> = {}
  history = new Set<string>()
  gapMonths = 0
  tenure = 0
  incomeScale = 1
  modifiers: Modifier[] = []
  fired: Record<string, number> = {}
  lastFired: Record<string, number> = {}
  queue: { due: number; id: string }[] = []
  pendingChanges: [string, string][] = []
  promoWait = 0
  lowPerfYears = 0
  wasLaidOff = false
  entity = ''
  /** Company on the white-collar path, workplace on the service path (generated names). */
  company = ''
  // ledger for the ending (not used by event conditions)
  track: MonthSnapshot[] = []
  switches = 0
  riskyChoices = 0
  totalIncome = 0
  bigCityMonths = 0
  familyMonths = 0
  rng: Rng
  /** Pay differences between people in the same job (data/income.json factors.personal). */
  personal: number
  private table: IncomeTable
  private house: HouseholdTable
  private wc: WhitecollarTable
  private sv: ServiceTable

  constructor(rng: Rng, table: IncomeTable, house: HouseholdTable, wc: WhitecollarTable, sv: ServiceTable) {
    this.rng = rng
    this.table = table
    this.house = house
    this.wc = wc
    this.sv = sv
    this.gender = rng.random() < 0.5 ? 'm' : 'f'
    this.schoolTier = rng.pick([1, 2, 2, 2, 3, 4])
    this.degree = this.schoolTier === 1 ? 1 : rng.pick([2, 2, 2, 3])
    this.familyTier = rng.int(1, 5)
    this.cityTier = rng.pick([1, 1, 2, 2, 3, 4, 5])
    this.stats = { health: rng.int(35, 75), mood: rng.int(35, 75), ability: rng.int(35, 75), social: rng.int(35, 75) }
    this.money = rng.pick([5000, 10000, 20000]) * this.familyTier
    this.relationship = rng.random() < 0.3 ? 'dating' : 'single'
    this.living = rng.random() < 0.35 ? 'with_parents' : 'shared'
    this.roommates = ['老二', '老三', '老四'].map(rank => ({ rank, path: 'unemployed', close: rng.int(20, 90), released: false }))
    const p = table.factors.personal
    this.personal = p.min + (p.max - p.min) * rng.random()
    const pa = house.parents
    this.parentAge = rng.int(pa.age[0], pa.age[1])
    this.parentHealth = rng.int(pa.health[0], pa.health[1])
    if (rng.random() < pa.only_child) this.flags.add('only_child')
  }

  /** Annual pay from the income table (0 on paths without wages). */
  get income(): number {
    return annualPay(this.table, this)
  }

  /** This month's spending: living cost (cut back when pay is short) and the mortgage, plus a share of the rest. */
  get spending(): number {
    return monthlySpending(this.table, this.income / 12, this.livingCost, this.mortgage)
  }

  /** Monthly cost of living: rent or upkeep by how you live, shared with a partner, plus the children. */
  get livingCost(): number {
    const h = this.house.living
    const couple = this.living !== 'with_parents' && (this.relationship === 'married' || this.flags.has('cohabiting'))
    const base = monthlyLiving(this.table, this) * (h.housing[this.living] ?? 1) * (couple ? h.couple : 1)
    return base + (this.kids * this.childCost) / 12
  }

  /** Your share of one child's yearly cost. */
  get childCost(): number {
    return childCost(this.house, this.cityTier, gameYear(this.age), this.table.series.urban_consumption.values as Record<string, number | null>)
  }

  /** This month's mortgage payment (your share). */
  get mortgage(): number {
    return this.home && this.home.balance > 0 ? this.home.payment : 0
  }

  /** Buying an ordinary home in your city (or your hometown) this year: cash needed and parents' help. */
  purchase(hometown = false) {
    const tier = hometown ? this.house.home.hometown_tier : this.cityTier
    return { tier, ...purchase(this.house, tier, gameYear(this.age), this.share, this.familyTier) }
  }

  /** How much of a home you pay for: half when married. */
  get share(): number {
    return this.relationship === 'married' ? 0.5 : 1
  }

  /** Buys an ordinary home: pays the down payment and fees (parents put in what they can), takes the loan. */
  buyHome(hometown: boolean): void {
    if (this.home) return
    const p = this.purchase(hometown), year = gameYear(this.age), H = this.house
    this.money += p.support - p.cash
    if (p.support > 0) this.flags.add('parents_helped')
    const rate = H.series.new_loan_rate.values[String(year)]
    const balance = p.mine - p.down, months = H.home.loan_months
    this.home = {
      price: p.mine / this.share, share: this.share, year, tier: p.tier, hometown,
      baseRate: rate, rate, balance, months, payment: annuity(balance, rate, months),
    }
    this.flags.add('owns_home')
    if (hometown) this.flags.add('hometown_home')
    this.modules.add('mortgage')
  }

  /** Sells the home: you get your share of its value now, less what is left of the loan. */
  sellHome(): void {
    if (!this.home) return
    this.money += this.homeValue - this.home.balance
    this.home = null
    this.flags.delete('owns_home')
    this.flags.delete('hometown_home')
    this.modules.delete('mortgage')
    if (this.living === 'own') this.living = 'rent'
  }

  /** Pays part of your savings off the loan; the payment drops, the term stays. */
  prepay(share: number): void {
    const h = this.home
    if (!h || h.balance <= 0 || this.money <= 0) return
    const amount = Math.min(h.balance, this.money * share)
    this.money -= amount
    h.balance -= amount
    h.payment = annuity(h.balance, h.rate, h.months)
    if (h.balance <= 1) this.payOff()
  }

  /** Each July the loan's rate follows the 5-year rate (and the cuts to existing loans). */
  repriceLoan(): void {
    const h = this.home
    if (!h || h.balance <= 0) return
    h.rate = loanRate(this.house, h, gameYear(this.age))
    h.payment = annuity(h.balance, h.rate, h.months)
  }

  /** One month of the loan: interest accrues, the rest of the payment goes to the principal. */
  amortize(): void {
    const h = this.home
    if (!h || h.balance <= 0) return
    h.balance -= h.payment - (h.balance * h.rate) / 100 / 12
    h.months--
    if (h.balance <= 1 || h.months <= 0) this.payOff()
  }

  private payOff(): void {
    if (!this.home) return
    this.home.balance = 0
    this.home.payment = 0
    this.modules.delete('mortgage')
  }

  /** Your share of your home's value now (0 without one). */
  get homeValue(): number {
    return this.home ? homeValue(this.house, this.home, gameYear(this.age)) : 0
  }

  /** Starts at a new white-collar company: type flag, role and name (a job hop keeps the path). */
  joinCompany(type?: string): void {
    const c = drawCompany(this.wc, this.rng, type)
    for (const f of COMPANY_FLAGS) this.flags.delete(f)
    this.flags.add(`wc_${c.kind}`)
    this.role = c.role
    this.company = c.name
  }

  /** Starts a service job (given, or drawn) at a new workplace, at the bottom. Platform work has no probation. */
  joinJob(job?: string): void {
    const j = drawJob(this.sv, this.rng, this.flags.has('has_car') && this.record === 'none', job)
    this.sub = j.kind
    this.company = j.place
    this.level = 1
    if (this.sv.jobs[j.kind].platform) this.flags.delete('on_probation')
  }

  modifier(key: string): number {
    let v = 1
    for (const m of this.modifiers) if (key in m && key !== 'months') v *= m[key] as number
    return v
  }

  stat(key: string): number {
    if (key === 'savings_months') return this.money / this.livingCost
    if (key === 'debt_months') return Math.max(0, -this.money) / this.livingCost
    if (key === 'home_afford' || key === 'hometown_afford') {
      const p = this.purchase(key === 'hometown_afford')
      return (this.money + p.support) / p.cash
    }
    if (key === 'mortgage_burden') return this.mortgage / Math.max(1, this.income / 12)
    return this.stats[key as Stat]
  }

  switchPath(next: string, sub?: string | null): void {
    const old = this.path
    if (next === old && !sub) return
    this.path = next
    this.sub = sub ?? null
    this.history.add(next)
    if (next === 'unemployed') {
      this.gapMonths = 0
      if (this.tenure < 1) this.flags.add('ui_under_one_year')
    } else {
      this.tenure = 0
      this.flags.delete('ui_under_one_year')
      this.flags.add('on_probation')
      this.incomeScale = 1
    }
    if (next === 'bigtech') {
      this.sub = sub ?? (this.rng.random() < 0.3 ? 'outsource' : 'fulltime')
      this.role = this.rng.pick(['dev', 'dev', 'dev', 'product', 'ops', 'data', 'buyer'])
      for (const f of [...this.flags]) if (f.startsWith('entity_')) this.flags.delete(f)
      const entity = this.rng.pick(['entity_cat_factory', 'entity_goose_factory', 'entity_other'])
      this.flags.add(entity)
      this.entity = entity === 'entity_cat_factory' ? '猫厂' : entity === 'entity_goose_factory' ? '鹅厂'
        : this.rng.pick(['猪厂', '开水厂', '宇宙厂', '狼厂'])
    }
    if (next === 'whitecollar') {
      this.joinCompany()
      const tr = this.wc.trainee
      if (this.age === 22 && this.schoolTier >= tr.school_tier && this.rng.random() < tr.share) this.sub = 'trainee'
    }
    if (next === 'service') this.joinJob(sub ?? undefined)
    if (old !== next) {
      this.pendingChanges.push([old, next])
      this.switches++
    }
  }
}
