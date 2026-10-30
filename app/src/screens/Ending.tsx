// 35 岁同学会 (four lives side by side) and 35 岁体检报告 (title, check-up, biography, map, texture).
import { useState } from 'preact/hooks'
import type { Run } from '../app'
import type { Life } from '../engine/life'
import { LIVING, PATH_NAMES, RECORDS, STORY, familyLine, money, seedCode } from '../data'
import { groupLast, makeEnding, reunionLine } from '../ending'
import { saveCard } from '../share'
import { LifeMap, PathLegend, PathStrip } from '../ui'


function nowLine(l: Life): string {
  if (l.path === 'crime' && l.sub === 'prison') return '服刑中'
  const base = PATH_NAMES[l.path] ?? l.path
  return l.path === 'bigtech' ? `${base} · ${l.entity}${l.sub === 'outsource' ? '外包' : ''}` : base
}

export function Ending({ run, onRestart, onHome }: { run: Run; onRestart: () => void; onHome: () => void }) {
  const [step, setStep] = useState<'reunion' | 'report'>('reunion')
  return step === 'reunion'
    ? <Reunion run={run} onNext={() => setStep('report')} />
    : <Report run={run} onRestart={onRestart} onHome={onHome} />
}

function Reunion({ run, onNext }: { run: Run; onNext: () => void }) {
  const { engine, profile: pr } = run
  const R = STORY.reunion
  const mates = engine.mates.map(m => m.life)
  const usedLines = new Set<string>()
  const people = [
    { who: `你 · ${pr.self.name}`, nick: pr.self.nick, life: engine.life, line: '' },
    ...mates.map((m, i) => ({
      who: `${pr.mates[i].rank} · ${pr.mates[i].name}`, nick: pr.mates[i].nick, life: m,
      line: reunionLine(pr.mates[i].rank, m, engine.life.roommates[i].released, pr.ta, usedLines),
    })),
  ]
  const paths = [...new Set(people.flatMap(p => p.life.track.map(s => s.path)))]
  const group = groupLast(pr, engine.life.roommates.map(r => r.close))
  const chat = pr.overseas ? '合租群' : '宿舍群'
  return (
    <main class="ending reunion">
      <p class="kicker">35 岁同学会 · 2027 年 7 月</p>
      <h1>四个人，十三年</h1>
      <p class="sub">{pr.overseas ? R.intro_overseas : R.intro}</p>
      <div class="people">
        {people.map(p => (
          <article class="card" key={p.who}>
            <h3>{p.who}<span class="muted small">「{p.nick}」</span></h3>
            <PathStrip track={p.life.track} />
            <div class="kv"><span>现在</span><b>{nowLine(p.life)}</b></div>
            <div class="kv"><span>存款</span><b class={p.life.money < 0 ? 'neg' : ''}>{money(p.life.money)}</b></div>
            {!(p.life.path === 'crime' && p.life.sub === 'prison') &&
              <div class="kv"><span>住</span><b>{LIVING[p.life.living] ?? p.life.living}{p.life.home?.hometown ? ' · 老家有房' : ''}</b></div>}
            <div class="kv"><span>感情</span><b>{familyLine(p.life)}</b></div>
            {p.life.record !== 'none' && <div class="kv"><span>记录</span><b>{RECORDS[p.life.record]}</b></div>}
            <p class="paths">{[...p.life.history].map(x => PATH_NAMES[x] ?? x).join(' → ')}</p>
            {p.line && <p class="said">{p.line}</p>}
          </article>
        ))}
      </div>
      <PathLegend paths={paths} />
      <section class="groupchat" aria-label={chat}>
        <span class="muted small">{chat} · 最后一条消息 · {group.date}</span>
        <p>{group.text}</p>
      </section>
      <div class="start-actions">
        <button class="primary" onClick={onNext}>看 35 岁体检报告 →</button>
      </div>
    </main>
  )
}

function Report({ run, onRestart, onHome }: { run: Run; onRestart: () => void; onHome: () => void }) {
  const { engine, profile: pr, seed } = run
  const end = makeEnding(engine, engine.mates.map(m => m.life))
  const written = run.notes.filter(n => n.text)
  const letter = written.find(n => n.age === 33)
  const others = written.filter(n => n !== letter)
  // key moments: milestones, echoes, and each choice together with the event it answered
  const moments = engine.log.flatMap((e, i, log) => {
    if (e.type === 'milestone' || e.type === 'echo') return [e]
    if (e.type !== 'picked') return []
    const asked = log.slice(0, i).reverse().find(x => x.eventId === e.eventId && x.type !== 'picked' && x.type !== 'chain')
    return [{ ...e, text: asked ? `${asked.text} ${e.text}` : e.text }]
  }).slice(-14)
  const share = () => saveCard({
    kicker: `同届生 · 2014 届 · 35 岁体检报告`,
    title: end.title,
    subtitle: end.titleLine,
    rows: [...end.checkup.map(c => [c.label, c.value] as [string, string]), ['纹理', `${end.texture.name}（${end.texture.axes.join(' · ')}）`]],
    footer: `${pr.self.name} · 种子码 ${seedCode(seed)} · 同一手牌，你会怎么打？`,
    accent: '#b4472f',
  }, `同届生-结局-${seedCode(seed)}.png`)

  return (
    <main class="ending report">
      <p class="kicker">35 岁体检报告 · {pr.self.name} · No.{seedCode(seed)}</p>
      <h1>{end.title}</h1>
      <p class="sub">{end.titleLine}</p>

      <section class="checkup" aria-label="体检五项">
        {end.checkup.map(c => (
          <div class="ck" key={c.label}>
            <span class="muted">{c.label}</span>
            <b>{c.value}</b>
            {c.note && <span class="muted small">{c.note}</span>}
          </div>
        ))}
      </section>

      <section>
        <h2>生平</h2>
        <p class="bio">{end.biography}</p>
      </section>

      <section>
        <h2>人生地图</h2>
        <p class="muted small">一格一个月，颜色是当月的心情（冷色低、暖色高），描边的格子是换了一条路。</p>
        <LifeMap track={engine.life.track} />
      </section>

      <section class="texture">
        <span class="muted small">十三年纹理</span>
        <h2>{end.texture.name}</h2>
        <p class="axes">{end.texture.axes.join(' · ')}</p>
        <p>{end.texture.line}</p>
      </section>

      {letter && (
        <section>
          <h2>写给 22 岁的自己</h2>
          <p class="letter">「{letter.text}」</p>
          <p class="muted small">33 岁那年的暂停片刻里写下的。</p>
        </section>
      )}

      {others.length > 0 && (
        <section>
          <h2>暂停片刻</h2>
          <ul class="notes">
            {others.map(n => <li key={n.age}><span class="muted small">{n.age} 岁 · {n.question}</span><span>「{n.text}」</span></li>)}
          </ul>
        </section>
      )}

      {moments.length > 0 && (
        <section>
          <h2>那些时刻</h2>
          <ul class="moments">
            {moments.map((m, i) => <li key={i}><span class="month">{m.year}.{m.month}</span>{m.text}</li>)}
          </ul>
        </section>
      )}

      <div class="start-actions">
        <button class="primary" onClick={onRestart}>再来一局</button>
        <button onClick={share}>保存结局卡</button>
        <button class="ghost" onClick={onHome}>回到首页</button>
      </div>
      <p class="note">种子码 {seedCode(seed)}：把它发给朋友，同一张毕业卡、同一个时代，看看谁打得更好。</p>
    </main>
  )
}
