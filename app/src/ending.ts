// The 35-year ending: title, thirteen-year texture, the five check-up items, the biography and the
// reunion lines. Rules and wording come from data/story.json; this file only measures the life.
import type { Engine } from './engine/engine'
import type { Life, MonthSnapshot } from './engine/life'
import { HOUSEHOLD, PATH_NAMES, STORY, familyLine, money } from './data'
import { gameYear, homePrice } from './engine/household'
import { fillText, type Profile } from './profile'

export interface Ending {
  title: string
  titleLine: string
  texture: { key: string; name: string; line: string; axes: string[] }
  checkup: { label: string; value: string; note?: string }[]
  biography: string
}

function matchTitle(engine: Engine, cond: Record<string, any>): boolean {
  const { ever_laid_off, ...when } = cond
  if (ever_laid_off !== undefined && engine.life.wasLaidOff !== ever_laid_off) return false
  return engine.check(when)
}

/** Savings plus home equity (your share of the home's value now, less the loan). */
export function netWorth(l: Life): number {
  return l.money + l.homeValue - (l.home?.balance ?? 0)
}

/** 房与贷: where you live and what you owe, and how long a home in your city would take on your pay. */
function homeCheckup(l: Life): { value: string; note?: string } {
  const h = l.home
  if (h) {
    const where = h.hometown ? '老家有房' : '有房'
    if (h.balance <= 0) return { value: `${where}，贷款已还清`, note: `房子现在约值 ${money(l.homeValue)}` }
    const years = Math.ceil(h.months / 12)
    return {
      value: `${where}，月供 ${Math.round(h.payment).toLocaleString()} 元`,
      note: `还欠 ${money(h.balance)}，还要还 ${years} 年；房子现在约值 ${money(l.homeValue)}`,
    }
  }
  const value = l.living === 'with_parents' ? '住在父母家' : l.living === 'shared' ? '合租' : '整租'
  const price = homePrice(HOUSEHOLD, l.cityTier, gameYear(l.age))
  const pay = l.income
  return { value, note: pay > 0 ? `这座城市一套普通住房约 ${money(price)}，是你 ${Math.round(price / pay)} 年的收入` : undefined }
}

export function texture(l: Life): Ending['texture'] {
  const t = STORY.texture.thresholds
  const months = Math.max(1, l.track.length)
  const axes = [
    l.switches >= t.switches || l.riskyChoices >= t.risky ? '闯' : '稳',
    l.bigCityMonths / months >= t.city_share ? '大城市' : '家乡',
    l.familyMonths / months >= t.family_share ? '为家人' : '为自己',
    netWorth(l) > 0 && netWorth(l) >= t.save_share * l.totalIncome ? '明天' : '今天',
  ]
  const key = axes.join('|')
  return { key, axes, ...STORY.texture.kinds[key] }
}

/** What a month reads as in the biography: path, plus company and contract in big tech, prison in crime. */
function bioKey(s: MonthSnapshot): string {
  if (s.path === 'bigtech') return `bigtech|${s.entity}|${s.sub === 'outsource' ? 'outsource' : ''}`
  if (s.path === 'crime') return s.sub === 'prison' ? 'crime_prison' : 'crime'
  if (s.path === 'whitecollar') return `whitecollar|${s.entity}`
  if (s.path === 'service') return `service|${s.sub}|${s.entity}`
  if (s.path === 'flat') return s.sub === 'carer' ? 'flat_carer' : 'flat'
  return s.path
}

/** Consecutive months that read the same in the biography. */
export function segments(track: MonthSnapshot[]): { start: number; end: number; snap: MonthSnapshot }[] {
  const out: { start: number; end: number; snap: MonthSnapshot }[] = []
  track.forEach((s, i) => {
    const last = out[out.length - 1]
    if (last && bioKey(last.snap) === bioKey(s)) last.end = i
    else out.push({ start: i, end: i, snap: s })
  })
  return out
}

export function biography(l: Life): string {
  const B = STORY.biography
  const parts = segments(l.track).map(seg => {
    const s = seg.snap
    const key = s.path === 'bigtech' && s.sub === 'outsource' ? 'bigtech_outsource'
      : s.path === 'crime' && s.sub === 'prison' ? 'crime_prison'
      : s.path === 'flat' && s.sub === 'carer' ? 'flat_carer'
      : s.path === 'service' && s.sub ? `service_${s.sub}` : s.path
    const what = fillText(B[key] ?? PATH_NAMES[s.path] ?? s.path, { entity: s.entity || (s.path === 'whitecollar' ? '一家公司' : '一家大厂') })
    const months = seg.end - seg.start + 1
    const span = months >= 12 ? `${Math.round(months / 12)} 年` : `${months} 个月`
    return `${22 + Math.floor(seg.start / 12)} 岁，${what}（${span}）`
  })
  return parts.join('；') + '。'
}

export function makeEnding(engine: Engine, mates: Life[]): Ending {
  const l = engine.life
  const rule = STORY.titles.rules.find((r: any) => matchTitle(engine, r.if))
  const job = l.path === 'public' ? '上岸体制内'
    : l.path === 'unemployed' ? (l.exitReason === 'laid_off' ? '被优化，待业中' : '待业')
    : l.path === 'crime' ? (l.sub === 'prison' ? '服刑中' : '—')
    : l.path === 'exam' ? '备考中' : `还在岗（${PATH_NAMES[l.path] ?? l.path}）`
  // 国考一般岗位报考年龄上限从 2026 年度起为 38 周岁（data/sources.json: civil_exam_2026）
  const exam = l.path === 'public' ? '已上岸'
    : l.record === 'criminal' ? '受过刑事处罚，不能报考公务员'
    : '国考年龄上限 38 周岁，还剩约 4 次机会'
  const home = homeCheckup(l)
  const family = familyLine(l)
  const parents = l.flags.has('parent_ill') ? '父母生过病' : `父亲 ${l.parentAge} 岁`
  const all = [l.money, ...mates.map(m => m.money)].sort((a, b) => b - a)
  const place = all.indexOf(l.money) + 1
  return {
    title: rule.title,
    titleLine: rule.line,
    texture: texture(l),
    checkup: [
      { label: '岗位', value: job },
      { label: '考公窗口', value: exam },
      { label: '房与贷', ...home },
      { label: '家庭', value: family, note: parents },
      { label: '存款', value: money(l.money), note: `宿舍四个人里排第 ${place}${l.home ? `；算上房子，净资产约 ${money(netWorth(l))}` : ''}` },
    ],
    biography: biography(l),
  }
}

/** One line per roommate at the reunion, from their path at 35. */
export function reunionLine(rank: string, mate: Life, released: boolean, ta: string, used: Set<string>): string {
  const R = STORY.reunion
  const vars = { rank, ta, entity: mate.entity || '大厂' }
  if (mate.path === 'crime' && mate.sub === 'prison') return fillText(R.absent, vars)
  const key = released && mate.path !== 'crime' ? 'released' : mate.path === 'flat' && mate.sub === 'carer' ? 'carer' : mate.path
  const pool: string[] = R.lines[key] ?? R.lines.unemployed
  // stable per roommate (depends on the life, not on when the screen renders), and not repeated at the table
  const first = (mate.switches + mate.track.length) % pool.length
  const pick = pool.map((_, k) => pool[(first + k) % pool.length]).find(t => !used.has(t)) ?? pool[first]
  used.add(pick)
  return fillText(pick, vars)
}

export function groupLast(profile: Profile, closeness: number[]): { date: string; text: string } {
  const avg = closeness.reduce((a, b) => a + b, 0) / closeness.length
  const band = avg >= 50 ? 'high' : avg >= 25 ? 'mid' : 'low'
  const g = STORY.reunion.group[band]
  const who = profile.mates[closeness.indexOf(Math.max(...closeness))].rank
  return { date: g.date, text: fillText(g.text, { rank: who }) }
}
