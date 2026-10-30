// Quick look at the economy: pay and savings by path at a few ages, from auto-played lives.
// Usage: npx tsx scripts/economy.ts [--lives 2000]
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Engine } from '../src/engine/engine'
import type { HouseholdTable } from '../src/engine/household'
import type { IncomeTable } from '../src/engine/income'
import type { GameEvent, Timeline } from '../src/engine/types'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const files = (d: string): string[] => readdirSync(d).sort().flatMap(f => {
  const p = join(d, f)
  return statSync(p).isDirectory() ? files(p) : f.endsWith('.json') ? [p] : []
})
const i = process.argv.indexOf('--lives')
const lives = i >= 0 ? Number(process.argv[i + 1]) : 2000
const data = {
  events: files(join(ROOT, 'events')).flatMap(f => JSON.parse(readFileSync(f, 'utf-8'))) as GameEvent[],
  timeline: JSON.parse(readFileSync(join(ROOT, 'data', 'timeline.json'), 'utf-8')) as Timeline,
  income: JSON.parse(readFileSync(join(ROOT, 'data', 'income.json'), 'utf-8')) as IncomeTable,
  household: JSON.parse(readFileSync(join(ROOT, 'data', 'household.json'), 'utf-8')) as HouseholdTable,
  whitecollar: JSON.parse(readFileSync(join(ROOT, 'data', 'whitecollar.json'), 'utf-8')),
  service: JSON.parse(readFileSync(join(ROOT, 'data', 'service.json'), 'utf-8')),
}

const pay: Record<string, number[]> = {}
const tiers: Record<number, { n: number; home: number; hometown: number; married: number; kids: number }> = {}
const netWorth: number[] = [], payments: number[] = [], burden: number[] = []
let divorced = 0, carer = 0, parentIll = 0, twoKids = 0
const marryByTier: Record<number, number[]> = {}
const marryAge: number[] = [], childAge: number[] = [], mood35: number[] = []
const money: Record<number, number[]> = { 23: [], 28: [], 35: [] }
const saveShare: number[] = [], familyShare: number[] = []
for (let k = 0; k < lives; k++) {
  const e = new Engine(data, { seed: k * 2654435761 >>> 0, auto: true })
  e.onYearEnd = () => {
    const l = e.life
    const key = `${l.path}${l.path === 'bigtech' && l.sub === 'outsource' ? '_outsource' : ''}@${l.age}`
    if ([22, 27, 34].includes(l.age) && l.income > 0) (pay[key] ??= []).push(l.income)
    if (money[l.age + 1]) money[l.age + 1].push(l.money)
  }
  e.runUntilChoice()
  const l = e.life
  money[35].push(l.money)
  const t = (tiers[l.cityTier] ??= { n: 0, home: 0, hometown: 0, married: 0, kids: 0 })
  t.n++
  if (l.home && !l.home.hometown) t.home++
  if (l.home?.hometown) t.hometown++
  if (l.relationship === 'married') t.married++
  if (l.kids > 0) t.kids++
  netWorth.push(l.money + l.homeValue - (l.home?.balance ?? 0))
  if (l.mortgage > 0) { payments.push(l.mortgage); burden.push(l.mortgage / Math.max(1, l.income / 12)) }
  if (l.flags.has('divorced')) divorced++
  if (l.kids >= 2) twoKids++
  if ('love.wed.registry' in l.lastFired) { marryAge.push(l.lastFired['love.wed.registry']); (marryByTier[l.cityTier] ??= []).push(l.lastFired['love.wed.registry']) }
  if ('love.kids.newborn' in l.fired) childAge.push(l.lastFired['love.kids.newborn'])
  mood35.push(l.stats.mood)
  if (l.history.has('flat')) carer++
  if (l.flags.has('parent_ill')) parentIll++
  saveShare.push((l.money + l.homeValue - (l.home?.balance ?? 0)) / Math.max(1, l.totalIncome))
  familyShare.push(e.life.familyMonths / Math.max(1, e.life.track.length))
}
const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] ?? 0
const share = (xs: number[], f: (x: number) => boolean) => `${Math.round((100 * xs.filter(f).length) / xs.length)}%`
console.log('annual pay, median (yuan):')
for (const k of Object.keys(pay).sort()) console.log(`  ${k.padEnd(24)} ${Math.round(median(pay[k])).toLocaleString().padStart(9)}  n=${pay[k].length}`)
console.log('savings at the start of age (median, share negative):')
for (const a of [23, 28, 35]) console.log(`  ${a}: ${Math.round(median(money[a])).toLocaleString()}  negative ${share(money[a], x => x < 0)}`)
console.log(`ending texture inputs (median): net worth / total income ${median(saveShare).toFixed(2)}, family months share ${median(familyShare).toFixed(2)}`)
console.log('at 35 by city tier: owns a home there / owns one in the hometown / married / has children')
for (const [k, t] of Object.entries(tiers)) console.log(`  tier ${k}: ${share(Array(t.n).fill(0).map((_, i) => i < t.home ? 1 : 0), x => x > 0)} / ${Math.round(100 * t.hometown / t.n)}% / ${Math.round(100 * t.married / t.n)}% / ${Math.round(100 * t.kids / t.n)}%  n=${t.n}`)
console.log(`net worth at 35 (savings + home equity), median: ${Math.round(median(netWorth)).toLocaleString()}`)
console.log(`mortgage at 35: ${payments.length} lives, payment median ${Math.round(median(payments)).toLocaleString()}/month, share of pay median ${median(burden).toFixed(2)}`)
console.log(`divorced ${share(Array(lives).fill(0).map((_, i) => i < divorced ? 1 : 0), x => x > 0)}, ever a full-time carer ${Math.round(100 * carer / lives)}%, parent ever ill ${Math.round(100 * parentIll / lives)}%`)
console.log(`marriage age median ${median(marryAge)} (n=${marryAge.length}), age at last birth median ${median(childAge)}, two or more children ${Math.round(100 * twoKids / lives)}%, mood at 35 median ${median(mood35)}`)
console.log('marriage age median by city tier: ' + Object.entries(marryByTier).map(([k, v]) => `${k}: ${median(v)}`).join(', '))
