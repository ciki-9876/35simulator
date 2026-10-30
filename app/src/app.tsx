// The flow of one game: 首页 → 毕业卡 → 毕业前最后一晚 → 13 年 → 35 岁同学会 → 体检报告 → 再来一局.
import { useEffect, useState } from 'preact/hooks'
import { Engine } from './engine/engine'
import { DATA, newSeed } from './data'
import { dormRanks, makeProfile, type Profile } from './profile'
import { loadSave, type Save } from './save'
import type { Note } from './screens/Moment'
import { Start } from './screens/Start'
import { GradCard, Night } from './screens/Opening'
import { Game } from './screens/Game'
import { Ending } from './screens/Ending'
import './app.css'

type Phase = 'start' | 'card' | 'night' | 'game' | 'end'

export interface Run {
  seed: number
  engine: Engine
  profile: Profile
  notes: Note[]
}

export function App() {
  const [phase, setPhase] = useState<Phase>('start')
  const [run, setRun] = useState<Run | null>(null)
  const [save, setSave] = useState<Save | null>(null)

  useEffect(() => { if (phase === 'start') loadSave().then(setSave) }, [phase])
  useEffect(() => { window.scrollTo(0, 0) }, [phase])

  const start = (seed: number) => {
    const engine = new Engine(DATA, { seed, ranks: dormRanks(seed).mates })
    engine.moments = true
    setRun({ seed, engine, profile: makeProfile(seed, engine), notes: [] })
    setPhase('card')
  }
  const resume = (s: Save) => {
    const engine = Engine.restore(DATA, s.seed, s.choices, s.elapsed, dormRanks(s.seed).mates)
    const notes = s.notes ?? []
    for (const n of notes) engine.momentsDone.add(n.age)
    engine.moments = true
    setRun({ seed: s.seed, engine, profile: makeProfile(s.seed, engine), notes })
    setPhase(engine.ended ? 'end' : 'game')
  }
  const home = () => {
    setRun(null)
    setPhase('start')
  }

  if (!run || phase === 'start') return <Start save={save} onStart={start} onResume={resume} />
  switch (phase) {
    case 'card': return <GradCard run={run} onNext={() => setPhase('night')} />
    case 'night': return <Night run={run} onNext={() => setPhase('game')} />
    case 'game': return <Game key={run.seed} run={run} onQuit={home} onEnd={() => setPhase('end')} />
    default: return <Ending run={run} onRestart={() => start(newSeed())} onHome={home} />
  }
}
