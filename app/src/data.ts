// Content bundled from the repository: the event library, the 2014–2027 timeline and the help lines.
import type { EngineData } from './engine/engine'
import type { Life } from './engine/life'
import type { HouseholdTable } from './engine/household'
import type { IncomeTable } from './engine/income'
import type { ServiceTable } from './engine/service'
import type { WhitecollarTable } from './engine/whitecollar'
import type { GameEvent, Timeline } from './engine/types'

const eventFiles = import.meta.glob<GameEvent[]>('../../events/**/*.json', { eager: true, import: 'default' })
const dataFiles = import.meta.glob<unknown>('../../data/*.json', { eager: true, import: 'default' })

export const EVENTS: GameEvent[] = Object.keys(eventFiles).sort().flatMap(k => eventFiles[k])
export const TIMELINE = dataFiles['../../data/timeline.json'] as Timeline & {
  events: { date: string; cat: string; title: string; impact: string; label: string }[]
}
const sources = dataFiles['../../data/sources.json'] as { help: Record<string, { name: string; number: string }> }
export const HELP = sources.help
export const INCOME = dataFiles['../../data/income.json'] as IncomeTable
export const HOUSEHOLD = dataFiles['../../data/household.json'] as HouseholdTable
export const WHITECOLLAR = dataFiles['../../data/whitecollar.json'] as WhitecollarTable
export const SERVICE = dataFiles['../../data/service.json'] as ServiceTable
export const DATA: EngineData = { events: EVENTS, timeline: TIMELINE, income: INCOME, household: HOUSEHOLD, whitecollar: WHITECOLLAR, service: SERVICE }
// Flavour and story tables; shapes are documented in the files' _note fields.
export interface ProfileData {
  surnames: string[]
  given: Record<'m' | 'f', string[]>
  ranks: string[]
  nicknames: string[]
  personalities: string[]
  majors: { group: string; weight: number; names: string[] }[]
  hometowns: { tier: string; weight: number; places: string[] }[]
  schools: {
    prefixes: string[]
    suffixes: Record<string, string[]>
    named: { name: string; overseas: boolean }[]
    overseas_by_family: Record<string, number>
  }
  school_odds: Record<string, number>
  city_odds: Record<string, number>
  industries: string[]
  destinations: Record<string, string>
}
export const PROFILE = dataFiles['../../data/profile.json'] as ProfileData
export const STORY = dataFiles['../../data/story.json'] as any
export const GRADUATES = (TIMELINE as any).series.graduates_10k.values as Record<string, number | null>

/** Path colours for strips and the life map (one per path, readable in both themes). */
export const PATH_COLORS: Record<string, string> = {
  bigtech: '#3f7fd0', whitecollar: '#5aa37a', service: '#d08a3f', public: '#8a6fc9', unemployed: '#a39e93',
  exam: '#c9b14a', crime: '#c45a4a', flat: '#7fa6a6',
}
export const PATH_NAMES: Record<string, string> = {
  bigtech: '大厂', whitecollar: '白领', service: '服务业', public: '体制内', unemployed: '待业',
  exam: '备考', crime: '违法', flat: '躺平', founder: '创业', freelance: '自由职业', study: '读书',
  factory: '工厂', creator: '自媒体', grey: '灰色地带', special: '特殊',
}
export const STAT_NAMES: Record<string, string> = { health: '健康', mood: '心情', ability: '能力', social: '人脉' }
export const SCHOOL_TIERS: Record<number, string> = { 1: '专科', 2: '普通本科', 3: '211', 4: '985 / 海外名校' }
export const CITY_TIERS: Record<number, string> = { 1: '一线城市', 2: '新一线', 3: '二线城市', 4: '三四线城市', 5: '县城' }
export const RECORDS: Record<string, string> = { none: '无', sealed: '治安处罚', criminal: '刑事记录' }
export const RELATIONSHIP: Record<string, string> = { single: '单身', dating: '恋爱中', married: '已婚' }
export const LIVING: Record<string, string> = { with_parents: '住父母家', shared: '合租', rent: '整租', own: '自己的房子' }

/** 城南站 · 骑手 / 老街面馆 · 店长 / 网约车司机 */
export function serviceLine(l: Life): string {
  const job = SERVICE.jobs[l.sub ?? '']
  if (!job) return ''
  const title = l.level >= 2 ? job.boss : job.label
  return l.company ? `${l.company} · ${title}` : title
}

/** 已婚 · 1 个孩子 / 恋爱中 · 同居 / 单身 */
export function familyLine(l: Life): string {
  const r = RELATIONSHIP[l.relationship] ?? l.relationship
  if (l.kids) return `${r} · ${l.kids} 个孩子`
  if (l.relationship === 'dating' && l.flags.has('cohabiting')) return `${r} · 同居`
  return r
}

/** 整租 / 自己的房子 · 月供 3,200 / 合租 · 老家有房 */
export function homeLine(l: Life): string {
  const where = LIVING[l.living] ?? l.living
  const hometown = l.home?.hometown ? ' · 老家有房' : ''
  const loan = l.mortgage > 0 ? ` · 月供 ${Math.round(l.mortgage).toLocaleString()}` : ''
  return where + hometown + loan
}

export function money(n: number): string {
  const w = n / 10000
  return Math.abs(w) >= 1 ? `${w.toFixed(1)} 万` : `${Math.round(n)} 元`
}

export const newSeed = () => Math.floor(Math.random() * 36 ** 6)
export const seedCode = (n: number) => n.toString(36).toUpperCase().padStart(6, '0')
export const parseSeed = (code: string) => {
  const n = parseInt(code.trim(), 36)
  return Number.isFinite(n) ? n >>> 0 : null
}
