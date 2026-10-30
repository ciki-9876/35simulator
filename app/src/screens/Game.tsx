// The thirteen years: top bar, status, life log, era and roommates, choice dialog.
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks'
import { ENGINE_VERSION, type Engine, type LogEntry } from '../engine/engine'
import { STATS } from '../engine/life'
import type { Run } from '../app'
import { CITY_TIERS, GRADUATES, HELP, PATH_NAMES, RECORDS, STAT_NAMES, TIMELINE, familyLine, homeLine, money, seedCode, serviceLine } from '../data'
import { schoolTierName } from '../profile'
import { clearSave, writeSave } from '../save'
import { Bar } from '../ui'
import { Moment, type Note } from './Moment'
import { Scene } from '../scene'

const SPEEDS = [1, 2, 4, 8, 16]
const SCENARIO_NAMES: Record<string, string> = { expansion: '互联网扩张期', contraction: '互联网收缩期', ai_wave: 'AI 浪潮' }

const isProjection = (year: number, month: number) => year > 2026 || (year === 2026 && month >= 11)

export function Game({ run, onQuit, onEnd }: { run: Run; onQuit: () => void; onEnd: () => void }) {
  const { engine, seed } = run
  const [, setVersion] = useState(0)
  const [speed, setSpeed] = useState(2)
  const [paused, setPaused] = useState(false)
  const [auto, setAuto] = useState(false)
  const rerender = () => setVersion(v => v + 1)

  const persist = () => {
    if (engine.ended) clearSave()
    else writeSave({ version: ENGINE_VERSION, seed, choices: engine.choicesMade, elapsed: engine.elapsed, notes: run.notes, savedAt: Date.now() })
  }

  // Game clock: wall-clock time, so a hidden tab (where rAF stops) still keeps time when it returns.
  useEffect(() => {
    let last = Date.now(), acc = 0, lastAge = engine.life.age
    const id = setInterval(() => {
      const now = Date.now()
      const dt = Math.min(2, (now - last) / 1000)
      last = now
      if (paused || engine.pending || engine.ended || engine.moment !== null) { acc = 0; return }
      acc += dt * speed
      let changed = false
      while (acc >= 1 && !engine.pending && !engine.ended && engine.moment === null) {
        engine.tick()
        acc -= 1
        changed = true
      }
      if (engine.life.age !== lastAge || engine.ended) {
        lastAge = engine.life.age
        persist()
      }
      if (changed) rerender()
    }, 100)
    return () => clearInterval(id)
  }, [engine, speed, paused])

  useEffect(() => { engine.auto = auto }, [auto])

  const skip = () => {
    if (auto) engine.runYear(); else engine.runUntilChoice()
    persist()
    rerender()
  }
  const closeMoment = (note: Note) => {
    run.notes.push(note)
    engine.dismissMoment()
    persist()
    rerender()
  }
  const choose = (i: number) => {
    engine.resolve(i)
    persist()
    rerender()
  }

  const year = engine.calendarYear, month = engine.calendarMonth
  return (
    <div class="game">
      <header class="topbar">
        <div class="when">
          <strong>{engine.life.age} 岁</strong> · {year} 年 {month} 月
          {isProjection(year, month) && <span class="tag proj">推演</span>}
        </div>
        <div class="controls">
          {engine.ended ? (
            <button class="primary" onClick={onEnd}>35 岁生日到了 → 同学会</button>
          ) : (
            <>
              <button onClick={() => setPaused(p => !p)}>{paused ? '▶ 继续' : '❚❚ 暂停'}</button>
              <div class="speeds" role="group" aria-label="速度">
                {SPEEDS.map(s => <button key={s} class={s === speed ? 'on' : ''} onClick={() => setSpeed(s)}>{s}×</button>)}
              </div>
              <button onClick={skip}>{auto ? '⏭ 下一年' : '⏭ 到下一个抉择'}</button>
              <label class="toggle"><input type="checkbox" checked={auto} onChange={e => setAuto((e.target as HTMLInputElement).checked)} /> 自动抉择</label>
              <button class="ghost" onClick={() => { persist(); onQuit() }}>存档退出</button>
            </>
          )}
        </div>
      </header>
      <aside class="panel status"><Status run={run} /></aside>
      <main class="panel log">
        <Scene run={run} />
        <Log entries={engine.log} notes={run.notes} ended={engine.ended} />
      </main>
      <aside class="panel era"><Era run={run} /></aside>
      {engine.pending && <Choice engine={engine} onChoose={choose} />}
      {engine.moment !== null && <Moment run={run} auto={auto} onDone={closeMoment} />}
    </div>
  )
}

const WC_LEVELS = ['职员', '资深职员', '主管', '经理']

function Status({ run }: { run: Run }) {
  const { engine, profile: pr, seed } = run
  const l = engine.life
  const sub = l.path === 'bigtech' ? (l.sub === 'outsource' ? ` · ${l.entity}外包` : ` · ${l.entity} L${l.level}`)
    : l.path === 'whitecollar' ? ` · ${l.company} · ${l.sub === 'trainee' ? '管培生' : WC_LEVELS[Math.min(l.level, 4) - 1]}`
    : l.path === 'service' ? ` · ${serviceLine(l)}`
    : l.path === 'flat' && l.sub === 'carer' ? ' · 照顾父母' : ''
  return (
    <>
      <h2>{pr.self.name}<span class="muted small">「{pr.self.nick}」</span></h2>
      <p class="muted">{pr.school}（{schoolTierName(l.schoolTier, pr.overseas)}）· {pr.self.major}</p>
      <p class="muted">工作城市：{CITY_TIERS[l.cityTier]} · 种子 {seedCode(seed)}</p>
      <div class="kv"><span>现在</span><b>{PATH_NAMES[l.path] ?? l.path}{sub}</b></div>
      <div class="kv"><span>存款</span><b class={l.money < 0 ? 'neg' : ''}>{money(l.money)}</b></div>
      <div class="kv"><span>年收入</span><b>{money(l.income)}</b></div>
      {l.path === 'unemployed' && <div class="kv"><span>空窗</span><b>{l.gapMonths} 个月</b></div>}
      <div class="kv"><span>住</span><b>{homeLine(l)}</b></div>
      <div class="kv"><span>感情</span><b>{familyLine(l)}</b></div>
      {l.record !== 'none' && <div class="kv"><span>记录</span><b class="neg">{RECORDS[l.record]}</b></div>}
      <div class="bars">{STATS.map(k => <Bar key={k} label={STAT_NAMES[k]} value={l.stats[k]} />)}</div>
      <h3>走过的路</h3>
      <p class="paths">{[...l.history].map(p => PATH_NAMES[p] ?? p).join(' → ')}</p>
    </>
  )
}

function Log({ entries, notes, ended }: { entries: LogEntry[]; notes: Note[]; ended: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (el) el.scrollTop = el.scrollHeight
  }, [entries.length, notes.length, ended])
  const years: { age: number; year: number; items: LogEntry[] }[] = []
  for (const e of entries) {
    const last = years[years.length - 1]
    if (last && last.age === e.age) last.items.push(e)
    else years.push({ age: e.age, year: e.year, items: [e] })
  }
  // a year may have a 暂停片刻 answer but no events yet
  for (const n of notes) if (!years.some(y => y.age === n.age)) years.push({ age: n.age, year: 0, items: [] })
  years.sort((a, b) => a.age - b.age)
  return (
    <div class="scroll" ref={ref}>
      <p class="muted center">七月，毕业典礼结束。宿舍楼下，行李箱滚过石板路……</p>
      {years.map(y => (
        <section key={y.age} class="year">
          <h3>{y.age === 35 ? '35 岁生日' : `${y.age} 岁`}</h3>
          {notes.filter(n => n.age === y.age).map(n => (
            <div key={n.age} class="note-entry">
              <p class="muted small">暂停片刻 · {n.question}</p>
              {n.text ? <p>「{n.text}」</p> : <p class="muted">（没有写）</p>}
            </div>
          ))}
          {y.items.map((e, i) => (
            <div key={i} class={`entry ${e.type}`}>
              <span class="month">{e.year}.{e.month}</span>
              <div>
                <p>{e.text}</p>
                {e.fact && <p class="fact">数据｜{e.fact}</p>}
                {e.help?.map(h => HELP[h] && <p key={h} class="help">{HELP[h].name} {HELP[h].number}</p>)}
              </div>
            </div>
          ))}
        </section>
      ))}
      {ended && <p class="muted center">2027 年 7 月，你 35 岁了。宿舍群里有人发：「今年同学会，来吗？」</p>}
    </div>
  )
}

function Era({ run }: { run: Run }) {
  const { engine, profile: pr } = run
  const l = engine.life
  const year = String(engine.calendarYear)
  const news = TIMELINE.events.filter(e => e.date.startsWith(year))
  const grads = GRADUATES[year]
  const sc = TIMELINE.scenario[String(2014 + Math.min(l.age, 34) - 22)]
  const chips = [...l.scenario].map(s => SCENARIO_NAMES[s])
  if (sc?.pandemic) chips.push('疫情')
  return (
    <>
      <h2>{year} 年</h2>
      {chips.length > 0 && <div class="chips">{chips.map(c => <span key={c} class="chip">{c}</span>)}</div>}
      {grads ? <p class="muted">这一年全国高校毕业生约 {grads} 万人</p> : null}
      <ul class="news">
        {news.map(n => (
          <li key={n.date + n.title}>
            <span class="month">{n.date.slice(5)}</span>
            <div>
              <p>{n.title}{n.label === 'projection' && <span class="tag proj">推演</span>}</p>
              {n.impact && <p class="muted small">{n.impact}</p>}
            </div>
          </li>
        ))}
      </ul>
      <h3>室友</h3>
      <ul class="roommates">
        {l.roommates.map((r, i) => {
          const p = pr.mates[i]
          return (
            <li key={r.rank}>
              <b>{p.rank}</b> {p.name}<span class="muted">「{p.nick}」</span>
              <div class="rm-line"><span>{PATH_NAMES[r.path] ?? r.path}</span><span class="muted">亲疏 {r.close}</span></div>
            </li>
          )
        })}
      </ul>
    </>
  )
}

function Choice({ engine, onChoose }: { engine: Engine; onChoose: (i: number) => void }) {
  const p = engine.pending!
  return (
    <div class="modal-bg">
      <div class="modal" role="dialog" aria-modal="true" aria-label="抉择">
        <p class="muted">{engine.life.age} 岁 · {engine.calendarYear} 年 {engine.calendarMonth} 月</p>
        <p class="modal-text">{p.text}</p>
        {p.fact && <p class="fact">数据｜{p.fact}</p>}
        <div class="options">
          {p.options.map((o, i) => (
            <button key={i} disabled={!o.enabled} onClick={() => onChoose(i)}>
              <b>{o.label}</b>
              {o.hint && <span>{o.hint}</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
