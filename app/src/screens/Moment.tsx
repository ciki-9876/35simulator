// 暂停片刻 (23, 28, 33): the four of you side by side, where you stand, and one question to answer.
import { useEffect, useRef, useState } from 'preact/hooks'
import type { Run } from '../app'
import type { Life } from '../engine/life'
import { LIVING, PATH_NAMES, STORY, TIMELINE, familyLine, money } from '../data'
import { fillText } from '../profile'

export interface Note {
  age: number
  question: string
  text: string
}

const AUTO_SECONDS = 8
const MAX_LEN = 60

export function momentQuestion(seed: number, age: number): string {
  const pool: string[] = STORY.moments.questions[String(age)]
  return pool[(seed + age) % pool.length]
}

/** Your income against the national average wage published by July of this year (last year's figure). */
function wageLine(l: Life, calendarYear: number): string {
  const wages = (TIMELINE as any).series.avg_wage.values as Record<string, number | null>
  let year = calendarYear - 1
  while (year > 2014 && !wages[String(year)]) year--
  const wage = wages[String(year)]!
  const vars = { year: String(year), wage: wage.toLocaleString() }
  if (l.income <= 0) return fillText(STORY.moments.no_income, vars)
  return fillText(STORY.moments.wage_line, { ...vars, times: (l.income / wage).toFixed(1) })
}

export function Moment({ run, auto, onDone }: { run: Run; auto: boolean; onDone: (note: Note) => void }) {
  const { engine, profile: pr, seed } = run
  const age = engine.moment!
  const question = momentQuestion(seed, age)
  const [text, setText] = useState('')
  const [left, setLeft] = useState(auto ? AUTO_SECONDS : -1)
  const input = useRef<HTMLTextAreaElement>(null)
  const done = () => onDone({ age, question, text: text.trim() })

  // in auto-choice mode the moment moves on by itself, unless the player starts writing
  useEffect(() => {
    if (left < 0) return
    if (left === 0) { done(); return }
    const id = setTimeout(() => setLeft(s => s - 1), 1000)
    return () => clearTimeout(id)
  }, [left])
  useEffect(() => { if (!auto) input.current?.focus() }, [])

  const people: { who: string; life: Life }[] = [
    { who: '你', life: engine.life },
    ...engine.mates.map((m, i) => ({ who: pr.mates[i].rank, life: m.life })),
  ]
  const byIncome = [...people].sort((a, b) => b.life.income - a.life.income)
  const place = byIncome.findIndex(p => p.who === '你') + 1

  return (
    <div class="modal-bg">
      <div class="modal moment" role="dialog" aria-modal="true" aria-label="暂停片刻">
        <p class="muted">暂停片刻 · {age} 岁 · {engine.calendarYear} 年 7 月</p>
        <table class="side">
          <thead><tr><th></th>{people.map(p => <th key={p.who}>{p.who}</th>)}</tr></thead>
          <tbody>
            <tr><th>现在</th>{people.map(p => <td key={p.who}>{PATH_NAMES[p.life.path] ?? p.life.path}</td>)}</tr>
            <tr><th>年收入</th>{people.map(p => <td key={p.who}>{money(p.life.income)}</td>)}</tr>
            <tr><th>存款</th>{people.map(p => <td key={p.who} class={p.life.money < 0 ? 'neg' : ''}>{money(p.life.money)}</td>)}</tr>
            <tr><th>住</th>{people.map(p => <td key={p.who}>{p.life.path === 'crime' && p.life.sub === 'prison' ? '—' : LIVING[p.life.living] ?? p.life.living}{p.life.home?.hometown ? '（老家有房）' : ''}</td>)}</tr>
            <tr><th>感情</th>{people.map(p => <td key={p.who}>{familyLine(p.life)}</td>)}</tr>
          </tbody>
        </table>
        <p>你的年收入在宿舍四个人里排第 {place}。</p>
        <p class="fact">数据｜{wageLine(engine.life, engine.calendarYear)}</p>
        <label class="question">
          <span>{question}</span>
          <textarea ref={input} rows={2} maxLength={MAX_LEN} value={text} placeholder="写一句，可以不写"
            onInput={e => { setText((e.target as HTMLTextAreaElement).value); setLeft(-1) }} />
        </label>
        <div class="start-actions">
          <button class="primary" onClick={done}>{text.trim() ? '记下，继续' : '继续'}{left > 0 ? `（${left}）` : ''}</button>
        </div>
      </div>
    </div>
  )
}
