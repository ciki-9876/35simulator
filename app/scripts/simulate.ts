// Runs many lives through the TypeScript engine in auto mode and writes the same metrics JSON as
// tools/simulate.py --json, so tools/parity.py can compare the two engines.
// Usage: npx tsx scripts/simulate.ts [--lives 10000] [--seed 1] [--json ../reports/metrics_ts.json]
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Engine, WRITTEN_PATHS } from '../src/engine/engine'
import type { HouseholdTable } from '../src/engine/household'
import type { IncomeTable } from '../src/engine/income'
import type { GameEvent, Timeline } from '../src/engine/types'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 ? process.argv[i + 1] : fallback
}

function jsonFiles(dir: string): string[] {
  return readdirSync(dir).sort().flatMap(f => {
    const p = join(dir, f)
    return statSync(p).isDirectory() ? jsonFiles(p) : f.endsWith('.json') ? [p] : []
  })
}

const lives = Number(arg('lives', '10000'))
const seed = Number(arg('seed', '1'))
const out = arg('json', join(ROOT, 'reports', 'metrics_ts.json'))
const events: GameEvent[] = jsonFiles(join(ROOT, 'events')).flatMap(f => JSON.parse(readFileSync(f, 'utf-8')))
const timeline: Timeline = JSON.parse(readFileSync(join(ROOT, 'data', 'timeline.json'), 'utf-8'))
const income: IncomeTable = JSON.parse(readFileSync(join(ROOT, 'data', 'income.json'), 'utf-8'))
const household: HouseholdTable = JSON.parse(readFileSync(join(ROOT, 'data', 'household.json'), 'utf-8'))
const whitecollar = JSON.parse(readFileSync(join(ROOT, 'data', 'whitecollar.json'), 'utf-8'))
const service = JSON.parse(readFileSync(join(ROOT, 'data', 'service.json'), 'utf-8'))

const writtenEvents: number[] = [], writtenChoices: number[] = []
const eventSets: Set<string>[] = []
const everPath: Record<string, number> = {}
const firedLives: Record<string, number> = Object.fromEntries(events.map(e => [e.id, 0]))
let threePlus = 0, criminal = 0, bigtechLaidOff = 0
const t = Date.now()

for (let i = 0; i < lives; i++) {
  const engine = new Engine({ events, timeline, income, household, whitecollar, service }, { seed: (seed * 1000003 + i * 7919) >>> 0, auto: true })
  engine.onYearEnd = (c, written) => {
    if (!written) return
    writtenEvents.push(c.events)
    writtenChoices.push(c.choices)
  }
  engine.runUntilChoice()
  const l = engine.life
  for (const p of l.history) everPath[p] = (everPath[p] ?? 0) + 1
  for (const id of Object.keys(l.fired)) firedLives[id]++
  eventSets.push(new Set(Object.keys(l.fired)))
  if (l.history.size >= 3) threePlus++
  if (l.record === 'criminal') criminal++
  if (l.fired['bigtech.crisis.laid_off']) bigtechLaidOff++
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length)
let jac = 0, pairs = 0
for (let i = 0; i + 1 < eventSets.length; i += 2) {
  const a = eventSets[i], b = eventSets[i + 1]
  const inter = [...a].filter(x => b.has(x)).length
  jac += inter / Math.max(1, new Set([...a, ...b]).size)
  pairs++
}
const metrics = {
  lives,
  events_per_year_written: mean(writtenEvents),
  choices_per_year_written: mean(writtenChoices),
  jaccard: jac / Math.max(1, pairs),
  three_plus_paths: threePlus / lives,
  criminal: criminal / lives,
  bigtech_laid_off: bigtechLaidOff / Math.max(1, everPath.bigtech ?? 0),
  ever_path: Object.fromEntries(Object.entries(everPath).map(([p, n]) => [p, n / lives])),
  fired_lives: Object.fromEntries(Object.entries(firedLives).map(([e, n]) => [e, n / lives])),
}
writeFileSync(out, JSON.stringify(metrics, null, 1))
console.log(`${lives} lives in ${((Date.now() - t) / 1000).toFixed(1)}s, written paths: ${[...WRITTEN_PATHS].join(',')}`)
console.log(JSON.stringify({ ...metrics, fired_lives: undefined }, null, 1))
