// The pixel scene above the life log, drawn in code (no art assets) on a 192×60 canvas: a room and its
// window. Skyline from the city tier (seeded, so it stays the same all game), season from the calendar,
// weather and light from mood, the room and its props from where you live and what you do.
import { useEffect, useRef } from 'preact/hooks'
import type { Run } from './app'
import { Rng } from './engine/rng'

const W = 192, H = 60
const WIN = { x: 8, y: 6, w: 84, h: 38 }

type Ctx = CanvasRenderingContext2D
type Season = 'spring' | 'summer' | 'autumn' | 'winter'
type Weather = 'sun' | 'cloud' | 'rain' | 'snow'

export interface SceneParams {
  seed: number
  skylineTier: number
  season: Season
  weather: Weather
  mood: number
  room: 'rent' | 'parents' | 'own' | 'prison'
  props: 'office' | 'bigtech' | 'public' | 'delivery' | 'books' | 'bed' | 'dim' | 'cell'
  married: boolean
  kids: boolean
}

const HOMETOWN_TIER: Record<string, number> = { 一线城市: 1, 新一线城市: 2, 二线城市: 3, 三四线城市: 4, 县城: 5, 农村: 5 }

export function sceneParams(run: Run): SceneParams {
  const { engine, profile, seed } = run
  const l = engine.life
  const m = engine.calendarMonth
  const season: Season = m >= 3 && m <= 5 ? 'spring' : m >= 6 && m <= 8 ? 'summer' : m >= 9 && m <= 11 ? 'autumn' : 'winter'
  const mood = l.stats.mood
  const weather: Weather = mood >= 60 ? 'sun' : mood >= 40 ? 'cloud' : season === 'winter' ? 'snow' : 'rain'
  const prison = l.path === 'crime' && l.sub === 'prison'
  const home = l.living === 'with_parents'
  const props: SceneParams['props'] = prison ? 'cell'
    : l.path === 'bigtech' ? 'bigtech' : l.path === 'whitecollar' ? 'office' : l.path === 'public' ? 'public'
    : l.path === 'service' ? 'delivery' : l.path === 'exam' ? 'books' : l.path === 'crime' ? 'dim' : 'bed'
  return {
    seed,
    skylineTier: home ? HOMETOWN_TIER[profile.self.hometownTier] ?? 4 : l.cityTier,
    season, weather, mood,
    room: prison ? 'prison' : l.living === 'own' ? 'own' : home ? 'parents' : 'rent',
    props,
    married: l.relationship === 'married',
    kids: l.kids > 0,
  }
}

// ---- drawing ------------------------------------------------------------------

const rect = (c: Ctx, x: number, y: number, w: number, h: number, color: string) => {
  c.fillStyle = color
  c.fillRect(x, y, w, h)
}

const SKY: Record<Weather, [string, string]> = {
  sun: ['#7cc0e8', '#bfe3f2'], cloud: ['#a9b8c4', '#cdd6dc'], rain: ['#6f7c88', '#8d99a3'], snow: ['#b9c3cc', '#dfe5ea'],
}
const WALL: Record<SceneParams['room'], string> = { rent: '#d9cdb4', parents: '#e3c9a8', own: '#cfd8c8', prison: '#8b8d8f' }
const LEAF: Record<Season, string> = { spring: '#f2a7bb', summer: '#4f9a4a', autumn: '#d9822b', winter: '#e9eef2' }

function sky(c: Ctx, p: SceneParams) {
  const [top, bottom] = SKY[p.weather]
  for (let y = 0; y < WIN.h; y++) rect(c, WIN.x, WIN.y + y, WIN.w, 1, y < WIN.h / 2 ? top : bottom)
  if (p.weather === 'sun') {
    rect(c, WIN.x + 64, WIN.y + 4, 6, 6, '#ffd75e')
    rect(c, WIN.x + 63, WIN.y + 5, 8, 4, '#ffd75e')
  } else {
    const cloud = p.weather === 'cloud' ? '#eef1f3' : '#9aa5ad'
    for (const [cx, cy] of [[10, 5], [44, 3], [66, 7]]) {
      rect(c, WIN.x + cx, WIN.y + cy + 1, 14, 3, cloud)
      rect(c, WIN.x + cx + 3, WIN.y + cy, 8, 5, cloud)
    }
  }
}

function skyline(c: Ctx, p: SceneParams) {
  const rng = new Rng((p.seed * 31 + p.skylineTier) >>> 0)
  const base = WIN.y + WIN.h
  const [lo, hi] = ({ 1: [16, 34], 2: [12, 28], 3: [9, 22], 4: [6, 15], 5: [3, 7] } as Record<number, number[]>)[p.skylineTier]
  const snow = p.season === 'winter'
  if (p.skylineTier === 5) {
    // county town / village: hills, low houses with roofs, fields
    rect(c, WIN.x, base - 10, WIN.w, 10, p.season === 'winter' ? '#d7dde0' : p.season === 'autumn' ? '#c9a55a' : '#7fae5f')
    for (let x = WIN.x + 2; x < WIN.x + WIN.w - 10; x += rng.int(12, 18)) {
      const h = rng.int(lo, hi)
      rect(c, x, base - 10 - h, 10, h, '#e8e2d4')
      rect(c, x - 1, base - 12 - h, 12, 2, snow ? '#f4f6f7' : '#8a4b3a')
      rect(c, x + 4, base - 10 - h + 2, 2, 2, '#5a6b78')
    }
    return
  }
  const colors = ['#5d6d7e', '#6c7a89', '#7f8c99', '#4e5d6c']
  for (let x = WIN.x - 2; x < WIN.x + WIN.w; ) {
    const w = rng.int(6, 12), h = rng.int(lo, hi)
    const color = rng.pick(colors)
    rect(c, x, base - h, w, h, color)
    if (snow) rect(c, x, base - h, w, 1, '#f4f6f7')
    for (let wy = base - h + 2; wy < base - 2; wy += 3)
      for (let wx = x + 1; wx < x + w - 1; wx += 2)
        if (rng.random() < 0.35) rect(c, wx, wy, 1, 1, p.weather === 'sun' ? '#c9d8e2' : '#f1d58a')
    x += w + rng.int(0, 2)
  }
}

function particles(c: Ctx, p: SceneParams, frame: number) {
  if (p.weather !== 'rain' && p.weather !== 'snow') return
  const rng = new Rng(7)
  for (let i = 0; i < 40; i++) {
    const x0 = rng.int(0, WIN.w - 1), y0 = rng.int(0, WIN.h - 1)
    const speed = p.weather === 'rain' ? 3 : 1
    const y = (y0 + frame * speed) % WIN.h
    const x = p.weather === 'rain' ? x0 : (x0 + Math.round(Math.sin((frame + i) / 3))) % WIN.w
    rect(c, WIN.x + x, WIN.y + y, 1, p.weather === 'rain' ? 2 : 1, p.weather === 'rain' ? '#c7d3dc' : '#ffffff')
  }
}

function windowFrame(c: Ctx, p: SceneParams) {
  if (p.room === 'prison') {
    // a small barred window high on a concrete wall
    for (let x = WIN.x + 4; x < WIN.x + WIN.w; x += 8) rect(c, x, WIN.y, 2, WIN.h, '#3d4043')
    return
  }
  const frame = p.room === 'parents' ? '#8a5a3c' : '#f3efe6'
  rect(c, WIN.x - 2, WIN.y - 2, WIN.w + 4, 2, frame)
  rect(c, WIN.x - 2, WIN.y + WIN.h, WIN.w + 4, 3, frame)
  rect(c, WIN.x - 2, WIN.y, 2, WIN.h, frame)
  rect(c, WIN.x + WIN.w, WIN.y, 2, WIN.h, frame)
  rect(c, WIN.x + WIN.w / 2 - 1, WIN.y, 2, WIN.h, frame)
  // a branch in the corner shows the season
  for (let i = 0; i < 9; i++) rect(c, WIN.x + i * 2, WIN.y + 2 + (i % 3), 3, 2, LEAF[p.season])
  rect(c, WIN.x, WIN.y + 4, 14, 1, '#6b4a2f')
}

function curtain(c: Ctx, half: boolean) {
  const color = '#7d6b8a'
  rect(c, WIN.x - 4, WIN.y - 3, half ? WIN.w / 2 + 4 : 10, WIN.h + 6, color)
  rect(c, WIN.x + WIN.w - 6, WIN.y - 3, 10, WIN.h + 6, color)
}

function desk(c: Ctx) {
  rect(c, 104, 40, 80, 3, '#8b6a4a')
  rect(c, 108, 43, 3, 11, '#6e5238')
  rect(c, 177, 43, 3, 11, '#6e5238')
}

function monitor(c: Ctx, x: number, screen: string, lines: string) {
  rect(c, x, 22, 26, 17, '#2b2f36')
  rect(c, x + 2, 24, 22, 13, screen)
  for (let y = 26; y < 36; y += 2) rect(c, x + 4, y, 6 + ((y * 7) % 11), 1, lines)
  rect(c, x + 11, 39, 4, 1, '#2b2f36')
}

function props(c: Ctx, p: SceneParams) {
  switch (p.props) {
    case 'bigtech':
      desk(c)
      monitor(c, 112, '#1f3b5c', '#7fc2ff')
      monitor(c, 142, '#1f3b5c', '#9be08f')
      rect(c, 172, 35, 5, 5, '#f2f2f2') // coffee
      rect(c, 177, 36, 1, 2, '#f2f2f2')
      rect(c, 166, 33, 1, 7, '#3f7fd0') // lanyard and badge
      rect(c, 165, 38, 3, 3, '#ffffff')
      break
    case 'office':
      desk(c)
      monitor(c, 118, '#e9f2ea', '#5aa37a')
      rect(c, 160, 32, 8, 8, '#a5683a') // plant
      rect(c, 158, 26, 12, 7, '#5aa37a')
      break
    case 'public':
      desk(c)
      monitor(c, 114, '#f4f1e6', '#8a6fc9')
      rect(c, 150, 30, 14, 10, '#d9c27a') // folders
      rect(c, 150, 33, 14, 1, '#b39c55')
      rect(c, 170, 31, 4, 9, '#9fb2c4') // thermos
      break
    case 'delivery':
      rect(c, 118, 36, 22, 18, '#f2c230') // delivery box
      rect(c, 118, 42, 22, 2, '#2f6fb3')
      rect(c, 150, 44, 14, 8, '#e04b3a') // helmet
      rect(c, 152, 42, 10, 3, '#e04b3a')
      rect(c, 170, 46, 5, 8, '#1d1f22') // phone with an order
      rect(c, 171, 47, 3, 5, '#7ee08a')
      break
    case 'books':
      desk(c)
      for (let i = 0; i < 6; i++) rect(c, 116, 37 - i * 3, 18 - (i % 2) * 3, 3, ['#c45a4a', '#3f7fd0', '#5aa37a', '#c9b14a'][i % 4])
      rect(c, 150, 24, 2, 16, '#3a3a3a') // lamp
      rect(c, 146, 22, 10, 3, '#3a3a3a')
      rect(c, 140, 25, 22, 15, 'rgba(255, 230, 150, 0.35)')
      rect(c, 168, 34, 6, 6, '#fff3a6') // sticky notes
      break
    case 'bed':
      rect(c, 110, 42, 72, 8, '#e6e1d6')
      rect(c, 110, 40, 14, 4, '#ffffff')
      rect(c, 128, 42, 54, 5, '#7f9bb3')
      rect(c, 108, 36, 3, 18, '#6e5238')
      rect(c, 182, 42, 3, 12, '#6e5238')
      rect(c, 150, 52, 10, 6, '#f7f7f2') // résumé pages on the floor
      rect(c, 154, 54, 10, 5, '#ecece3')
      rect(c, 140, 44, 4, 3, '#9be0ff') // phone glow on the blanket
      break
    case 'dim':
      rect(c, 110, 42, 72, 8, '#6b6660')
      rect(c, 140, 44, 4, 3, '#9be0ff')
      break
    case 'cell':
      rect(c, 112, 30, 66, 3, '#5f6366') // bunk
      rect(c, 112, 44, 66, 3, '#5f6366')
      rect(c, 112, 28, 2, 26, '#4a4d50')
      rect(c, 176, 28, 2, 26, '#4a4d50')
      rect(c, 116, 41, 58, 3, '#c9c4b8')
      break
  }
}

export function drawScene(c: Ctx, p: SceneParams, frame: number) {
  rect(c, 0, 0, W, H, WALL[p.room])
  rect(c, 0, 52, W, 8, p.room === 'prison' ? '#6f7275' : '#a88b6a') // floor
  // everything outside stays inside the window
  c.save()
  c.beginPath()
  c.rect(WIN.x, WIN.y, WIN.w, WIN.h)
  c.clip()
  sky(c, p)
  skyline(c, p)
  particles(c, p, frame)
  c.restore()
  windowFrame(c, p)
  if (p.props === 'dim') curtain(c, true)
  if (p.married && p.room !== 'prison') {
    rect(c, 100, 10, 12, 9, '#6e5238') // a photo on the wall
    rect(c, 101, 11, 10, 7, '#f0e4d0')
    rect(c, 103, 13, 2, 4, '#c45a4a')
    rect(c, 107, 13, 2, 4, '#3f7fd0')
  }
  if (p.kids && p.room !== 'prison') {
    rect(c, 96, 42, 18, 2, '#c9a27a') // a crib: top rail, bars, a toy
    for (let x = 96; x <= 112; x += 4) rect(c, x, 42, 2, 10, '#c9a27a')
    rect(c, 96, 48, 18, 2, '#e8d9c0')
    rect(c, 103, 45, 4, 3, '#e07b8a')
  }
  props(c, p)
  // mood sets the light: low mood dims and cools the whole room
  const dark = Math.max(0, (50 - p.mood) / 50) * 0.35
  if (dark > 0) rect(c, 0, 0, W, H, `rgba(30, 40, 70, ${dark.toFixed(2)})`)
  if (p.mood >= 70) rect(c, 0, 0, W, H, 'rgba(255, 220, 150, 0.08)')
}

export function Scene({ run }: { run: Run }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const p = sceneParams(run)
  const key = JSON.stringify(p)
  useEffect(() => {
    const c = ref.current?.getContext('2d')
    if (!c) return
    let frame = 0
    drawScene(c, p, frame)
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches
    if (still || (p.weather !== 'rain' && p.weather !== 'snow')) return
    const id = setInterval(() => drawScene(c, p, ++frame), 120)
    return () => clearInterval(id)
  }, [key])
  return <canvas ref={ref} class="scene" width={W} height={H} role="img" aria-label="你此刻的房间和窗外" />
}
