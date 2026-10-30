// 毕业卡 (the draw, shown with its odds) and 开篇夜话 (the last night in the dorm).
import { useEffect, useState } from 'preact/hooks'
import type { Run } from '../app'
import { GRADUATES, STORY, seedCode } from '../data'
import { fillText, memoryBand } from '../profile'
import { saveCard } from '../share'

const REVEAL_MS = 650

const pct = (p: number) => (p >= 0.1 ? `${Math.round(p * 100)}%` : `${(p * 100).toFixed(1)}%`)

export function GradCard({ run, onNext }: { run: Run; onNext: () => void }) {
  const { profile: pr, engine, seed } = run
  const [shown, setShown] = useState(0)
  const done = shown >= pr.odds.length
  useEffect(() => {
    if (done) return
    const id = setTimeout(() => setShown(s => s + 1), REVEAL_MS)
    return () => clearTimeout(id)
  }, [shown, done])

  const gender = engine.life.gender === 'm' ? '男' : '女'
  const grads = GRADUATES['2014']
  const share = () => saveCard({
    kicker: `同届生 · 2014 届 · No.${seedCode(seed)}`,
    title: pr.self.name,
    subtitle: `${pr.school} · ${pr.self.major}（${pr.degreeName}）`,
    rows: [['性别', gender], ['家乡', `${pr.self.hometown}（${pr.self.hometownTier}）`], ...pr.odds.slice(3).map(o => [o.label, o.value] as [string, string]),
      ['概率', `全国每 ${pr.oneIn.toLocaleString()} 名应届生中，有 1 人和你条件相同`]],
    footer: `种子码 ${seedCode(seed)} · 输入同一串码，拿到同一张毕业卡`,
    accent: '#2f6f5e',
  }, `同届生-毕业卡-${seedCode(seed)}.png`)

  return (
    <main class="opening">
      <p class="kicker">2014 年 6 月 · 毕业前</p>
      <h1>抽签</h1>
      <ol class="draw">
        {pr.odds.map((o, i) => (
          <li key={o.label} class={i < shown ? 'on' : ''}>
            <span class="muted">{o.label}</span>
            <b>{i < shown ? o.value : '……'}</b>
            <span class="odds">{i < shown ? pct(o.p) : ''}</span>
          </li>
        ))}
      </ol>
      {!done && <button class="ghost" onClick={() => setShown(pr.odds.length)}>跳过动画</button>}
      {done && (
        <section class="gradcard" aria-label="毕业卡">
          <header>
            <span class="muted">毕业卡 No.{seedCode(seed)}</span>
            <span class="muted">2014 届</span>
          </header>
          <h2>{pr.self.name}<span class="muted"> · {gender}</span></h2>
          <p class="school">{pr.school} · {pr.self.major}（{pr.degreeName}）</p>
          <dl>
            <dt>家乡</dt><dd>{pr.self.hometown}（{pr.self.hometownTier}）</dd>
            <dt>家境</dt><dd>{pr.odds[3].value}</dd>
            <dt>父母</dt><dd>{pr.parents}</dd>
            <dt>第一座城市</dt><dd>{pr.odds[4].value}</dd>
          </dl>
          <p class="rare">全国每 <b>{pr.oneIn.toLocaleString()}</b> 名应届生中，有 1 人和你条件相同。</p>
          {grads && <p class="muted">你毕业的这一年（2014），全国有约 {grads} 万名高校毕业生。</p>}
          <p class="muted small">概率按设计权重计算，专业和家乡分布上线前按教育部数据校准。</p>
          {pr.overseas && <p class="muted">你从海外毕业，回国找工作。三个室友是留学时的合租室友，毕业后也都回了国。</p>}
        </section>
      )}
      {done && (
        <div class="start-actions">
          <button class="primary" onClick={onNext}>{pr.overseas ? '回国前最后一晚 →' : '毕业前最后一晚 →'}</button>
          <button onClick={share}>保存毕业卡</button>
        </div>
      )}
    </main>
  )
}

export function Night({ run, onNext }: { run: Run; onNext: () => void }) {
  const { profile: pr, engine } = run
  const N = STORY.night
  // step 0: you; 1–3: the roommates; 4: dawn
  const [step, setStep] = useState(0)
  const selfLine = fillText(pr.overseas ? N.self_overseas : N.self, { rank: pr.self.rank, hometown: pr.self.hometown, major: pr.self.major, destination: pr.self.destination })
  const bandName = { warm: '很铁', mid: '还行', cool: '客客气气' } as const
  return (
    <main class="opening night">
      <p class="kicker">{pr.overseas ? N.intro_overseas : N.intro}</p>
      <div class="night-cards">
        <article class="person self">
          <h3>你 · {pr.self.name}<span class="muted">「{pr.self.nick}」</span></h3>
          <p>{selfLine}</p>
        </article>
        {pr.mates.slice(0, Math.max(0, step)).map((m, i) => {
          const close = engine.start.close[i]
          return (
            <article class="person" key={m.rank}>
              <h3>{m.rank} · {m.name}<span class="muted">「{m.nick}」</span></h3>
              <p>{fillText(N.mate, { hometown: m.hometown, major: m.major, personality: m.personality, ta: pr.ta, destination: m.destination })}</p>
              <p class="memory">{m.memory}</p>
              <p class="muted small">你们的关系：{bandName[memoryBand(close)]}（亲疏 {close}）</p>
            </article>
          )
        })}
        {step >= 4 && <p class="dawn">{N.outro}</p>}
      </div>
      <div class="start-actions">
        {step < 3 && <button class="primary" onClick={() => setStep(s => s + 1)}>{step === 0 ? '熄灯，开始夜谈' : '下一个'}</button>}
        {step === 3 && <button class="primary" onClick={() => setStep(4)}>聊到天亮</button>}
        {step >= 4 && <button class="primary" onClick={onNext}>毕业了 →</button>}
        {step < 4 && <button class="ghost" onClick={onNext}>跳过</button>}
      </div>
    </main>
  )
}
