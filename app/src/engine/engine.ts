// Runs a life month by month against the event library. Game rules mirror tools/simulate.py (the
// reference simulator); keep the two in step so tools/parity.py stays meaningful.
import { evaluate } from './formula'
import type { HouseholdTable } from './household'
import type { IncomeTable } from './income'
import type { ServiceTable } from './service'
import type { WhitecollarTable } from './whitecollar'
import { Life, STATS, type Roommate, type Stat } from './life'
import { Rng } from './rng'
import type { Effects, Followup, GameEvent, Option, ScenarioYear, Timeline, When } from './types'

const CMP = /^(<=|>=|==|<|>)(-?\d+(?:\.\d+)?)$/
export const RISKY = /违法|无法核实|风险很大|陷进去|背调可能/
export const WRITTEN_PATHS = new Set(['bigtech', 'unemployed', 'crime', 'whitecollar', 'service'])
const DAILY_PER_YEAR = 5
/** 13 years from July 2014 (ages 22–34); the life ends on the 35th birthday, July 2027. */
const LAST_AGE = 34
export const BIRTHDAY = 35
/** 暂停片刻: the game stops at the start of these years so the player can look around (UI only). */
export const MOMENT_AGES = [23, 28, 33]
const CLOSENESS_DECAY = 3
/** Yearly mood while dating or married. */
const RELATIONSHIP_MOOD = 1
/** Roommates' first destinations (always three different ones), with design weights. */
const ROOMMATE_STARTS: [string, number][] = [['bigtech', 0.2], ['whitecollar', 0.35], ['exam', 0.2], ['unemployed', 0.25]]
/** Bump whenever the order of random draws changes: older saves would replay into a different life. */
export const ENGINE_VERSION = 6

export interface LogEntry {
  age: number
  /** Calendar year and month (1–12). */
  year: number
  month: number
  text: string
  fact?: string
  eventId: string
  /** The event's type; 'picked' is the option the player took, 'chain' an option's outcome. */
  type: GameEvent['type'] | 'picked' | 'system'
  help?: string[]
}

export interface PendingChoice {
  event: GameEvent
  text: string
  fact?: string
  options: { label: string; hint: string; enabled: boolean }[]
}

export interface YearCounters {
  events: number
  choices: number
}

interface Slot {
  month: number
  kind: 'follow' | 'chance' | 'daily'
  id: string
}

/** Everything a life is simulated against. */
export interface EngineData {
  events: GameEvent[]
  timeline: Timeline
  income: IncomeTable
  household: HouseholdTable
  whitecollar: WhitecollarTable
  service: ServiceTable
}

export interface EngineOptions {
  seed: number
  /** Resolve choices automatically (simulation, or the player's "自动抉择"). */
  auto?: boolean
  /** A roommate's life: always auto, no roommates of its own, no log. */
  npc?: boolean
  startPath?: string
  /** Dorm ranks of the three roommates (display only; {name} in event text). */
  ranks?: string[]
}

function cmp(value: number, expr: string): boolean {
  const m = CMP.exec(expr)
  if (!m) return false
  const n = parseFloat(m[2])
  switch (m[1]) {
    case '<': return value < n
    case '<=': return value <= n
    case '>': return value > n
    case '>=': return value >= n
    default: return value === n
  }
}

const asList = (v: string | string[]) => (Array.isArray(v) ? v : [v])

export function scenarioStates(year: ScenarioYear): Set<string> {
  const s = new Set<string>()
  if (year.internet === 1) s.add('expansion')
  if (year.internet === -1) s.add('contraction')
  if (year.ai) s.add('ai_wave')
  if (year.property === 1) s.add('property_boom')
  if (year.property === -1) s.add('property_slump')
  return s
}

export class Engine {
  readonly events: Map<string, GameEvent>
  private byTrigger: Record<string, GameEvent[]> = { chance: [], weight: [], follow: [], path_change: [] }
  readonly rng: Rng
  /** Auto-choice draws use their own stream, so a save (seed + choices) replays the same either way. */
  private policyRng: Rng
  /** Every option index taken, in order; with the seed this is the whole save. */
  choicesMade: number[] = []
  readonly life: Life
  /** The three roommates' lives, run by the same engine one year behind the player (index = roommates). */
  readonly mates: Engine[] = []
  readonly npc: boolean
  /** Where this life started (path, company) and the roommates' closeness then: the opening night. */
  readonly start: { path: string; entity: string; close: number[] }
  log: LogEntry[] = []
  pending: PendingChoice | null = null
  /** Stop at 暂停片刻 (the game sets this; simulations leave it off). */
  moments = false
  /** The age of the 暂停片刻 now showing; the clock waits until dismissMoment(). Changes no state. */
  moment: number | null = null
  momentsDone = new Set<number>()
  ended = false
  month = 0
  auto: boolean
  counters: YearCounters = { events: 0, choices: 0 }
  /** Called after each finished year; the simulator uses it for statistics. */
  onYearEnd?: (counters: YearCounters, startedOnWrittenPath: boolean) => void
  private schedule: Slot[] = []
  private roommate: Roommate | null = null
  private dailyPicked = new Set<string>()
  private yearStartedOnWrittenPath = false
  private yearPlanned = false
  private monthDone = false
  private timeline: Timeline
  private household: HouseholdTable
  private whitecollar: WhitecollarTable

  constructor(data: EngineData, opts: EngineOptions) {
    this.timeline = data.timeline
    this.household = data.household
    this.whitecollar = data.whitecollar
    this.events = new Map(data.events.map(e => [e.id, e]))
    for (const ev of data.events) {
      const kind = ev.trigger ?? (ev.chance !== undefined ? 'chance' : 'weight')
      this.byTrigger[kind].push(ev)
    }
    this.rng = new Rng(opts.seed)
    this.policyRng = new Rng((opts.seed ^ 0x9e3779b9) >>> 0)
    this.npc = opts.npc ?? false
    this.auto = this.npc || (opts.auto ?? false)
    this.life = new Life(this.rng, data.income, data.household, data.whitecollar, data.service)
    const r = this.rng.random()
    const start = opts.startPath ?? (r < 0.15 ? 'bigtech' : r < 0.55 ? 'unemployed' : 'whitecollar')
    this.life.switchPath(start)
    this.life.pendingChanges = []
    this.life.flags.delete('on_probation')
    this.life.history.add(start)
    this.life.switches = 0
    this.start = { path: start, entity: this.life.entity, close: this.life.roommates.map(r => r.close) }
    if (this.npc) return
    opts.ranks?.forEach((rank, i) => { this.life.roommates[i].rank = rank })
    const starts = [...ROOMMATE_STARTS]
    for (const rm of this.life.roommates) {
      const pick = this.rng.weighted(starts, starts.map(s => s[1]))
      starts.splice(starts.indexOf(pick), 1)
      const mate = new Engine(data, { seed: this.rng.int(0, 0x7fffffff), npc: true, startPath: pick[0] })
      this.mates.push(mate)
      rm.path = mate.life.path
    }
  }

  /** Calendar months (1–12) of one or more seasons from data/timeline.json. */
  seasonMonths(v: string | string[]): number[] {
    return asList(v).flatMap(s => this.timeline.seasons[s]?.months ?? [])
  }

  /** Calendar year: the game year starts in July (month 0), the month of graduation. */
  get calendarYear(): number {
    return 2014 + this.life.age - 22 + (this.month >= 6 ? 1 : 0)
  }

  get calendarMonth(): number {
    return ((this.month + 6) % 12) + 1
  }

  // ---- conditions ---------------------------------------------------------
  check(w?: When): boolean {
    if (!w) return true
    const l = this.life
    for (const [k, v] of Object.entries(w) as [keyof When, any][]) {
      switch (k) {
        case 'path': if (!asList(v).includes(l.path)) return false; break
        case 'not_path': if (asList(v).includes(l.path)) return false; break
        case 'sub': if (!asList(v).includes(l.sub ?? '')) return false; break
        case 'tenure': if (!cmp(l.tenure, v)) return false; break
        case 'role': if (!asList(v).includes(l.role ?? '')) return false; break
        case 'level': if (!cmp(l.level, v)) return false; break
        case 'stat':
          for (const [s, c] of Object.entries(v as Record<string, string>)) if (!cmp(l.stat(s), c)) return false
          break
        case 'flags': if (!(v as string[]).every(f => l.flags.has(f))) return false; break
        case 'not_flags': if ((v as string[]).some(f => l.flags.has(f))) return false; break
        case 'module': if (!l.modules.has(v)) return false; break
        case 'not_module': if (l.modules.has(v)) return false; break
        case 'history_any': if (!(v as string[]).some(p => l.history.has(p))) return false; break
        case 'history_months':
          for (const [p, c] of Object.entries(v as Record<string, string>)) if (!cmp(l.months[p] ?? 0, c)) return false
          break
        case 'gap_months': if (!cmp(l.gapMonths, v)) return false; break
        case 'exit_reason': if (l.exitReason !== v) return false; break
        case 'record': if (l.record !== v) return false; break
        case 'degree': if (!cmp(l.degree, v)) return false; break
        case 'school_tier': if (!cmp(l.schoolTier, v)) return false; break
        case 'family_tier': if (!cmp(l.familyTier, v)) return false; break
        case 'city_tier': if (!cmp(l.cityTier, v)) return false; break
        case 'year': if (!cmp(this.calendarYear, v)) return false; break
        case 'scenario': if (!l.scenario.has(v)) return false; break
        case 'roommate':
          if (!l.roommates.some(r => (!v.close || cmp(r.close, v.close)) && (!v.path || r.path === v.path))) return false
          break
        case 'living': if (!asList(v).includes(l.living)) return false; break
        case 'kids': if (!cmp(l.kids, v)) return false; break
        case 'parent_age': if (!cmp(l.parentAge, v)) return false; break
        case 'relationship': if (!asList(v).includes(l.relationship)) return false; break
        case 'season': if (!this.seasonMonths(v).includes(this.calendarMonth)) return false; break
        case 'age': if (!cmp(l.age, v)) return false; break
      }
    }
    return true
  }

  eligible(ev: GameEvent): boolean {
    const l = this.life
    if (l.age < ev.age[0] || l.age > ev.age[1]) return false
    const n = l.fired[ev.id] ?? 0
    if (ev.once && n) return false
    if (ev.cooldown !== undefined && ev.id in l.lastFired && l.age - l.lastFired[ev.id] < ev.cooldown) return false
    return this.check(ev.when)
  }

  evaluate(expr: number | string): number {
    const l = this.life
    const values: Record<string, number> = {
      age: l.age, level: l.level, tenure: l.tenure, gap_months: l.gapMonths,
      income: l.income, monthly: l.income / 12, living: l.livingCost, ...l.stats,
      city_tier: l.cityTier, savings: l.money, kids: l.kids, parent_age: l.parentAge, parent_health: l.parentHealth,
      mortgage: l.mortgage, home_value: l.homeValue, down_payment: l.purchase().cash,
    }
    return evaluate(expr, {
      values,
      flag: f => (l.flags.has(f) ? 1 : 0),
      module: m => (l.modules.has(m) ? 1 : 0),
      mod: k => l.modifier(k),
    })
  }

  // ---- text ---------------------------------------------------------------
  /**
   * The roommate an event is about: one matching its roommate condition (and, for a release event, one
   * who has come out), so {name} in its text, options and outcome all mean the same person.
   */
  private eventRoommate(ev: GameEvent): Roommate {
    const l = this.life, w = ev.when?.roommate
    let c = l.roommates.filter(r => !w || ((!w.close || cmp(r.close, w.close)) && (!w.path || r.path === w.path)))
    if (ev.when?.flags?.includes('roommate_released')) c = c.filter(r => r.released)
    return this.rng.pick(c.length ? c : l.roommates)
  }

  fill(text: string): string {
    const l = this.life
    const rm = this.roommate ?? l.roommates[0]
    const vars: Record<string, string> = {
      'last_job.entity': l.entity || '上一家公司',
      'last_job.years': String(Math.max(1, Math.round(l.tenure))),
      'last_job.level': `L${l.level}`,
      gap_months: String(l.gapMonths),
      severance: `${Math.round(((l.tenure + 1) * l.income) / 12 / 10000 * 10) / 10} 万元`,
      'record.type': l.record === 'criminal' ? '留下了案底' : '受过治安处罚',
      name: rm.rank,
      ta: l.gender === 'm' ? '他' : '她',
      entity: l.entity || '鹅厂',
      company: l.company || '公司',
      city: '这座城市',
      n: '3',
      next_path: '',
      place: '',
      school: '',
      amount: '',
      p: '',
    }
    return text.replace(/\{([^}]+)\}/g, (_, k: string) => vars[k] ?? '')
  }

  pickText(ev: GameEvent): string {
    const ok = ev.text.filter(t => this.check(t.when))
    return this.fill(this.rng.pick(ok.length ? ok : ev.text).t)
  }

  /** The event's data anchor, unless it describes a year the game has not reached yet. */
  factFor(ev: GameEvent): string | undefined {
    const f = ev.fact
    return f && !(f.year && this.calendarYear < f.year) ? f.text : undefined
  }

  private record(ev: GameEvent, text: string): void {
    this.note(text, ev.id, ev.type, this.factFor(ev), ev.help)
  }

  private note(text: string, eventId: string, type: LogEntry['type'], fact?: string, help?: string[]): void {
    if (this.npc) return
    this.log.push({ age: this.life.age, year: this.calendarYear, month: this.calendarMonth, text, fact, eventId, type, help })
  }

  // ---- effects --------------------------------------------------------------
  apply(eff?: Effects): void {
    if (!eff) return
    const l = this.life
    for (const k of STATS) if (eff[k] !== undefined) l.stats[k as Stat] = Math.max(0, Math.min(100, l.stats[k] + (eff[k] as number)))
    if (eff.money !== undefined) l.money += this.evaluate(eff.money)
    for (const f of eff.flags_add ?? []) l.flags.add(f)
    for (const f of eff.flags_remove ?? []) l.flags.delete(f)
    if (eff.module_start) l.modules.add(eff.module_start)
    if (eff.module_end) {
      if (l.modules.has(eff.module_end) && ['gambling', 'drugs'].includes(eff.module_end)) l.flags.add('module_quit')
      l.modules.delete(eff.module_end)
    }
    if (eff.exit_reason) {
      l.exitReason = eff.exit_reason
      if (eff.exit_reason === 'laid_off') l.wasLaidOff = true
    }
    if (eff.record && !(l.record === 'criminal' && eff.record === 'sealed')) l.record = eff.record
    if (eff.path) l.switchPath(eff.path, eff.sub)
    else if (eff.sub && l.path === 'service') l.joinJob(eff.sub)
    else if (eff.sub) l.sub = eff.sub
    if (eff.level !== undefined) l.level = Math.max(1, Math.min(6, l.level + eff.level))
    if (eff.income_mult !== undefined) l.incomeScale *= eff.income_mult
    if (eff.roommate_close !== undefined) {
      const r = this.rng.pick(l.roommates)
      r.close = Math.max(0, Math.min(100, r.close + eff.roommate_close))
    }
    if (eff.modifier) l.modifiers.push({ ...eff.modifier })
    if (eff.relationship) {
      l.relationship = eff.relationship
      if (eff.relationship !== 'dating') l.flags.delete('cohabiting')
      // a couple moves into a flat of their own
      if (eff.relationship === 'married' && ['with_parents', 'shared'].includes(l.living)) l.living = 'rent'
    }
    if (eff.living) l.living = eff.living
    if (eff.kids !== undefined) l.kids = Math.max(0, l.kids + eff.kids)
    if (eff.buy_home) l.buyHome(eff.buy_home === 'hometown')
    if (eff.sell_home) l.sellHome()
    if (eff.prepay !== undefined) l.prepay(eff.prepay)
    if (eff.company && l.path === 'whitecollar') {
      l.joinCompany(eff.company === 'new' ? undefined : eff.company)
      l.tenure = 0
      l.flags.add('on_probation')
    }
    if (eff.parent_health !== undefined) l.parentHealth = Math.max(0, Math.min(100, l.parentHealth + eff.parent_health))
  }

  private queueFollowups(fus?: Followup[]): void {
    for (const fu of fus ?? []) {
      if (this.rng.random() >= (fu.chance ?? 1)) continue
      const wait = (fu.delay ?? 0) * 12 + (fu.delay_months ?? 0)
      if (wait === 0) this.schedule.unshift({ month: this.month, kind: 'follow', id: fu.id })
      else if (this.month + wait < 12) this.scheduleFollow(this.month + wait, fu.id)
      else this.life.queue.push({ due: this.elapsed + wait, id: fu.id })
    }
  }

  /** A follow-up in a later month of this year, after the slots already planned for that month. */
  private scheduleFollow(month: number, id: string): void {
    const i = this.schedule.findIndex(s => s.month > month)
    this.schedule.splice(i < 0 ? this.schedule.length : i, 0, { month, kind: 'follow', id })
  }

  // ---- firing ---------------------------------------------------------------
  fire(ev: GameEvent): void {
    const l = this.life
    l.fired[ev.id] = (l.fired[ev.id] ?? 0) + 1
    l.lastFired[ev.id] = l.age
    this.counters.events++
    if (ev.id === 'bigtech.growth.promo_result') {
      // decide promotion before the text is chosen, as the reference simulator does
      if (this.rng.random() < 0.5 * l.modifier('promo')) {
        l.flags.add('promo_passed')
        l.level = Math.min(6, l.level + 1)
      } else {
        l.flags.delete('promo_passed')
      }
    }
    this.roommate = this.eventRoommate(ev)
    const text = this.pickText(ev)
    this.apply(ev.effects)
    if (ev.options?.length) {
      this.counters.choices++
      const options = ev.options.map(o => ({ label: this.fill(o.label), hint: this.fill(o.hint ?? ''), enabled: this.check(o.unlock) }))
      this.queueFollowups(ev.followups)
      if (this.auto) {
        this.record(ev, text)
        this.choose(ev, this.autoPick(ev))
      } else {
        this.pending = { event: ev, text, fact: this.factFor(ev), options }
      }
      return
    }
    this.record(ev, text)
    this.queueFollowups(ev.followups)
    this.flushChanges()
  }

  autoPick(ev: GameEvent): number {
    const opts = ev.options ?? []
    let idx = opts.map((o, i) => [o, i] as [Option, number]).filter(([o]) => this.check(o.unlock))
    if (!idx.length) idx = opts.map((o, i) => [o, i] as [Option, number])
    const weights = idx.map(([o]) => (RISKY.test(o.hint ?? '') ? 0.3 : 1) * (o.auto ?? 1))
    return this.policyRng.weighted(idx, weights)[1]
  }

  private choose(ev: GameEvent, index: number): void {
    this.choicesMade.push(index)
    const o = (ev.options ?? [])[index]
    if (RISKY.test(o.hint ?? '')) this.life.riskyChoices++
    this.apply(o.effects)
    if (o.p !== undefined) {
      const p = Math.min(1, Math.max(0, this.evaluate(o.p)))
      const outcome = this.rng.random() < p ? o.success : o.fail
      this.apply(outcome)
      if (outcome?.text) this.note(this.fill(outcome.text), ev.id, 'chain')
    }
    this.note(`→ ${this.fill(o.label)}`, ev.id, 'picked')
    this.queueFollowups(o.followups)
    this.flushChanges()
  }

  /** The player's answer to a pending choice. */
  resolve(index: number): void {
    const p = this.pending
    if (!p) return
    this.pending = null
    this.record(p.event, p.text)
    this.choose(p.event, index)
  }

  private flushChanges(): void {
    const l = this.life
    while (l.pendingChanges.length) {
      const [old, next] = l.pendingChanges.shift()!
      for (const ev of this.byTrigger.path_change) {
        const tr = ev.transition ?? {}
        if ((tr.from ?? old) === old && (tr.to ?? next) === next && this.eligible(ev)) this.fire(ev)
      }
    }
  }

  // ---- engine-maintained state (mirrors year_start / month_tick / year_end) -----
  private scenarioFor(year: number): ScenarioYear {
    return this.timeline.scenario[String(year)] ?? this.timeline.scenario['2027']
  }

  private yearStart(): void {
    const l = this.life, rng = this.rng, f = l.flags
    l.scenario = scenarioStates(this.scenarioFor(2014 + l.age - 22))
    for (const k of ['interviewing', 'job_seeking', 'multiple_offers']) f.delete(k)
    if (f.has('low_perf')) {
      l.lowPerfYears++
      if (l.lowPerfYears > 1) { f.delete('low_perf'); l.lowPerfYears = 0 }
    }
    if (l.age < 24) f.add('fresh_grad'); else f.delete('fresh_grad')
    if (l.sub === 'trainee' && l.age >= this.whitecollar.trainee.until_age) l.sub = null
    if (l.path === 'unemployed') {
      f.add('job_seeking')
      if (rng.random() < 0.6) f.add('interviewing')
    }
    if (l.age === 22 && l.schoolTier >= 3) {
      f.add('seeking_bigtech')
      if (rng.random() < 0.3) f.add('multiple_offers')
      if (rng.random() < 0.2) f.add('signed_intent')
    } else if (l.age > 22) {
      f.delete('seeking_bigtech'); f.delete('signed_intent')
    }
    if (l.path === 'bigtech' && l.sub === 'fulltime') {
      l.promoWait++
      if (l.promoWait >= 2) f.add('promo_eligible')
    }
    if (l.age >= 26 && l.income > 150000 && rng.random() < 0.2) f.add('has_car')
    if (f.has('moved_home') && l.living !== 'own') l.living = 'with_parents'
    l.repriceLoan()
    if (!this.npc) this.syncRoommates()
  }

  /** Lives the roommates' previous year, then copies where they stand into the player's state. */
  private syncRoommates(): void {
    const l = this.life
    this.mates.forEach((mate, i) => {
      const r = l.roommates[i], before = r.path
      if (l.age > 22) {
        while (!mate.ended && mate.life.age < l.age) mate.tick()
        r.close = Math.max(0, r.close - CLOSENESS_DECAY)
      }
      r.path = mate.life.path
      if (r.path === 'crime' && before !== 'crime' && mate.life.history.has('bigtech')) l.flags.add('roommate_was_bigtech')
      if (before === 'crime' && r.path !== 'crime') {
        r.released = true
        l.flags.add('roommate_released')
      }
    })
  }

  private monthTick(): void {
    const l = this.life, rng = this.rng
    l.money += l.income / 12 - l.spending
    l.amortize()
    l.months[l.path] = (l.months[l.path] ?? 0) + 1
    l.totalIncome += l.income / 12
    if (l.cityTier <= 2 && l.living !== 'with_parents') l.bigCityMonths++
    if (l.living === 'with_parents' || l.relationship === 'married') l.familyMonths++
    if (l.path === 'unemployed') {
      l.gapMonths++
      if (!l.flags.has('has_offer')) {
        let p = 0.1 * l.modifier('job_success') * (0.5 + l.stats.ability / 100)
        if (l.record === 'criminal') p *= 0.3
        if (l.modules.has('bail')) p *= 0.5
        if (rng.random() < p) { l.flags.add('has_offer'); l.flags.add('background_check') }
      }
    } else {
      l.tenure += 1 / 12
    }
    for (const m of l.modifiers) if (m.months !== undefined) m.months--
    l.modifiers = l.modifiers.filter(m => m.months === undefined || m.months > 0)
  }

  private yearlyModules(): void {
    const l = this.life, rng = this.rng
    if (l.modules.has('gambling')) {
      l.money -= Math.max(l.income, 30000) * 0.2
      if (rng.random() < 0.06) { l.modules.delete('gambling'); l.flags.add('module_quit') }
    }
    if (l.modules.has('debt')) {
      l.money -= 3000
      if (l.money > 6 * l.livingCost) l.modules.delete('debt')
    }
    if (l.modules.has('side_job')) l.money += 12000
    if (l.modules.has('counseling')) l.stats.mood = Math.min(100, l.stats.mood + 5)
    if (l.modules.has('probation') && rng.random() < 0.5) l.modules.delete('probation')
    l.stats.health = Math.max(0, l.stats.health - 1)
    // being with someone lifts the year a little (research/domains/love.md 第 5 节)
    if (l.relationship !== 'single') l.stats.mood = Math.min(100, l.stats.mood + RELATIONSHIP_MOOD)
    l.parentAge++
    if (l.parentAge >= this.household.parents.decline_from) l.parentHealth = Math.max(0, l.parentHealth - rng.int(1, 3))
  }

  private yearEnd(): void {
    const l = this.life, rng = this.rng
    if (l.path === 'unemployed' && l.flags.has('has_offer')) {
      l.flags.delete('has_offer'); l.flags.delete('background_check')
      const r = rng.random()
      let pBig = 0.15 * l.modifier('bigtech_interview')
      if (l.record === 'criminal' || l.flags.has('industry_blacklist') || l.modifier('ban_same_type') !== 1) pBig = 0
      l.switchPath(r < pBig ? 'bigtech' : r < 0.7 ? 'whitecollar' : 'service')
      this.flushChanges()
    } else if (l.path !== 'unemployed') {
      l.flags.delete('on_probation')
    }
    if (l.path === 'public' && rng.random() < 0.05) {
      l.exitReason = 'laid_off'
      l.switchPath('unemployed')
      this.flushChanges()
    }
    if (l.path === 'exam' && rng.random() < 0.3) {
      l.switchPath(rng.random() < 0.3 ? 'public' : 'unemployed')
      this.flushChanges()
    }
  }

  /**
   * Builds this year's slots: due follow-ups in month 0, every chance event and the daily picks in a
   * random month each. Eligibility, chance and the daily pick are decided when the slot's month comes,
   * so events see that month's money, gap and flags.
   */
  private planYear(): void {
    const l = this.life, rng = this.rng
    this.schedule = []
    this.dailyPicked.clear()
    const start = (l.age - 22) * 12
    const due = l.queue.filter(q => q.due < start + 12)
    l.queue = l.queue.filter(q => q.due >= start + 12)
    for (const q of due) this.schedule.push({ month: Math.max(0, q.due - start), kind: 'follow', id: q.id })
    for (const ev of this.byTrigger.chance) {
      // a seasonal event gets its yearly roll in one of its months
      const months = ev.when?.season ? this.seasonMonths(ev.when.season).map(m => (m + 5) % 12) : null
      this.schedule.push({ month: months ? rng.pick(months) : rng.int(0, 11), kind: 'chance', id: ev.id })
    }
    for (let i = 0; i < DAILY_PER_YEAR; i++) this.schedule.push({ month: rng.int(0, 11), kind: 'daily', id: '' })
    this.schedule.sort((a, b) => a.month - b.month)
  }

  /** Advances one month. Does nothing while a choice is pending or after the end. */
  tick(): void {
    if (this.pending || this.ended || this.moment !== null) return
    const l = this.life
    if (l.age === BIRTHDAY) {
      this.birthday()
      return
    }
    if (!this.yearPlanned) {
      this.counters = { events: 0, choices: 0 }
      this.yearStartedOnWrittenPath = WRITTEN_PATHS.has(l.path)
      this.yearStart()
      this.planYear()
      this.yearPlanned = true
      if (this.moments && MOMENT_AGES.includes(l.age) && !this.momentsDone.has(l.age)) {
        this.moment = l.age
        return
      }
    }
    if (!this.monthDone) {
      this.monthTick()
      this.monthDone = true
    }
    if (!this.runMonth()) return // paused on a choice
    l.track.push({ path: l.path, sub: l.sub, entity: ['whitecollar', 'service'].includes(l.path) ? l.company : l.entity, mood: l.stats.mood, money: l.money })
    if (this.month === 11) {
      this.yearlyModules()
      this.yearEnd()
      this.onYearEnd?.(this.counters, this.yearStartedOnWrittenPath)
      this.month = 0
      this.yearPlanned = false
      l.age = l.age >= LAST_AGE ? BIRTHDAY : l.age + 1
    } else {
      this.month++
    }
    this.monthDone = false
  }

  /**
   * The 35th birthday, July 2027: the roommates finish their last year, the echo events written for
   * exactly 35 get their chance, and the life ends.
   */
  private birthday(): void {
    if (!this.yearPlanned) {
      if (!this.npc) this.syncRoommates()
      this.schedule = this.byTrigger.chance
        .filter(ev => ev.age[0] === BIRTHDAY)
        .map(ev => ({ month: 0, kind: 'chance' as const, id: ev.id }))
      this.yearPlanned = true
    }
    if (!this.runMonth()) return
    this.ended = true
  }

  /** Fires this month's slots; returns false if it stopped on a pending choice. */
  private runMonth(): boolean {
    while (this.schedule.length && this.schedule[0].month <= this.month) {
      const ev = this.resolveSlot(this.schedule.shift()!)
      if (!ev) continue
      this.fire(ev)
      if (this.pending) return false
    }
    return true
  }

  /** The event a slot fires now, or null if it fires nothing. */
  private resolveSlot(slot: Slot): GameEvent | null {
    const l = this.life
    if (slot.kind === 'daily') {
      const pool = this.byTrigger.weight.filter(ev => !this.dailyPicked.has(ev.id) && this.eligible(ev))
      if (!pool.length) return null
      const ev = this.rng.weighted(pool, pool.map(e => e.weight ?? 1))
      this.dailyPicked.add(ev.id)
      return ev
    }
    const ev = this.events.get(slot.id)
    if (!ev) return null
    if (slot.kind === 'follow') return l.age >= ev.age[0] && l.age <= ev.age[1] && this.check(ev.when) ? ev : null
    if (!this.eligible(ev)) return null
    let p = 0
    try { p = Math.min(1, Math.max(0, this.evaluate(ev.chance!))) } catch { p = 0 }
    return this.rng.random() < p ? ev : null
  }

  dismissMoment(): void {
    if (this.moment !== null) this.momentsDone.add(this.moment)
    this.moment = null
  }

  /** Months played so far; with choicesMade this is where a save stands. */
  get elapsed(): number {
    return (this.life.age - 22) * 12 + this.month
  }

  /** Rebuilds a saved game by replaying its choices from the seed. */
  static restore(data: EngineData, seed: number, choices: number[], elapsed: number, ranks?: string[]): Engine {
    const e = new Engine(data, { seed, ranks })
    let k = 0
    while (!e.ended) {
      if (e.pending) {
        if (k >= choices.length) break
        e.resolve(choices[k++])
      } else if (e.elapsed < elapsed || k < choices.length) {
        e.tick()
      } else {
        break
      }
    }
    // a moment comes before the year's first month, so one in a year already under way has passed
    for (const m of MOMENT_AGES) if (e.life.age > m || (e.life.age === m && e.yearPlanned)) e.momentsDone.add(m)
    return e
  }

  /** Runs to the start of next year, or until a pending choice (the skip button in auto-choice mode). */
  runYear(): void {
    const age = this.life.age
    while (!this.pending && !this.ended && this.moment === null && this.life.age === age) this.tick()
  }

  /** Runs until the next pending choice or the end of the life (used by "快转" and the simulator). */
  runUntilChoice(): void {
    while (!this.pending && !this.ended && this.moment === null) this.tick()
  }
}
