// Small pieces shared by the screens.
import type { MonthSnapshot } from './engine/life'
import { PATH_COLORS, PATH_NAMES } from './data'

export function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div class="bar">
      <span>{label}</span>
      <div class="track"><div class="fill" style={{ width: `${value}%` }} /></div>
      <b>{value}</b>
    </div>
  )
}

const monthLabel = (i: number) => {
  const year = 2014 + Math.floor((i + 6) / 12)
  return `${year} 年 ${((i + 6) % 12) + 1} 月`
}

/** Thirteen years as one bar per person, coloured by path: the reunion's side-by-side view. */
export function PathStrip({ track }: { track: MonthSnapshot[] }) {
  return (
    <div class="strip" role="img" aria-label="十三年的路径">
      {track.map((s, i) => (
        <i key={i} style={{ background: PATH_COLORS[s.path] ?? '#999' }} title={`${monthLabel(i)} · ${PATH_NAMES[s.path] ?? s.path}`} />
      ))}
    </div>
  )
}

export function PathLegend({ paths }: { paths: string[] }) {
  return (
    <div class="legend">
      {paths.map(p => <span key={p}><i style={{ background: PATH_COLORS[p] ?? '#999' }} />{PATH_NAMES[p] ?? p}</span>)}
    </div>
  )
}

const LOW = [72, 98, 140], MID = [176, 170, 158], HIGH = [232, 168, 64]

/** Mood as a colour: slate blue when low, neutral in the middle, amber when high (no green on the way). */
export function moodColor(mood: number): string {
  const t = Math.max(0, Math.min(100, mood)) / 100
  const [a, b, u] = t < 0.5 ? [LOW, MID, t * 2] : [MID, HIGH, (t - 0.5) * 2]
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * u))
  return `rgb(${c[0]} ${c[1]} ${c[2]})`
}

/** The life map: 13 years × 12 months, each cell the month's mood; a ring marks a change of path. */
export function LifeMap({ track }: { track: MonthSnapshot[] }) {
  const rows: MonthSnapshot[][] = []
  for (let i = 0; i < track.length; i += 12) rows.push(track.slice(i, i + 12))
  return (
    <div class="lifemap">
      {rows.map((row, y) => (
        <div class="lm-row" key={y}>
          <span class="lm-age">{22 + y}</span>
          {row.map((s, x) => {
            const i = y * 12 + x
            const changed = i > 0 && track[i - 1].path !== s.path
            return (
              <i key={x} class={changed ? 'changed' : ''} style={{ background: moodColor(s.mood) }}
                title={`${monthLabel(i)} · ${PATH_NAMES[s.path] ?? s.path} · 心情 ${s.mood}`} />
            )
          })}
        </div>
      ))}
    </div>
  )
}
