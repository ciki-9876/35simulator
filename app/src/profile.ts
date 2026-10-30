// Flavour for one game: names, schools, majors, hometowns, the opening night. Drawn from its own random
// stream (seed-derived) so it never changes the simulation, and from data/profile.json + story.json.
import { Rng } from './engine/rng'
import type { Engine } from './engine/engine'
import { PROFILE, STORY } from './data'

export interface Person {
  rank: string
  name: string
  nick: string
  hometown: string
  hometownTier: string
  major: string
  majorGroup: string
  personality: string
  destination: string
  memory: string
}

export interface Odds {
  label: string
  value: string
  p: number
}

export interface Profile {
  overseas: boolean
  school: string
  degreeName: string
  /** The player; rank is 老大 to 老四 by age, like the roommates. */
  self: Person
  mates: Person[]
  parents: string
  odds: Odds[]
  /** 1 in N graduates share these conditions (product of the odds above). */
  oneIn: number
  ta: string
}

const DEGREES: Record<number, string> = { 1: '专科', 2: '本科', 3: '硕士', 4: '博士' }
const FAMILY = ['', '最低的五分之一', '中下', '中间', '中上', '最高的五分之一']
const CITY: Record<number, string> = { 1: '一线城市', 2: '新一线城市', 3: '二线城市', 4: '三四线城市', 5: '县城' }

function weighted<T extends { weight: number }>(rng: Rng, items: T[]): T {
  return rng.weighted(items, items.map(i => i.weight))
}

export function fillText(text: string, vars: Record<string, string>): string {
  return text.replace(/\{([^}]+)\}/g, (_, k: string) => vars[k] ?? '')
}

export function memoryBand(close: number): 'warm' | 'mid' | 'cool' {
  return close >= 65 ? 'warm' : close >= 35 ? 'mid' : 'cool'
}

/** Ranks only, so the engine can be built before the rest of the profile (event text uses them). */
export function dormRanks(seed: number): { self: string; mates: string[] } {
  const rng = new Rng((seed ^ 0x5bd1e995) >>> 0)
  const ranks = [...PROFILE.ranks]
  const self = ranks.splice(rng.int(0, 3), 1)[0]
  return { self, mates: ranks }
}

export function makeProfile(seed: number, engine: Engine): Profile {
  const life = engine.life
  const rng = new Rng((seed ^ 0x27d4eb2f) >>> 0)
  const P = PROFILE
  const gender = life.gender
  const ta = gender === 'm' ? '他' : '她'
  const ranks = dormRanks(seed)

  // school: same school for all four (overseas: flatmates from the same university)
  let school: string, overseas = false
  if (life.schoolTier === 4) {
    overseas = rng.random() < P.schools.overseas_by_family[String(life.familyTier)]
    school = rng.pick(P.schools.named.filter(s => s.overseas === overseas)).name
  } else {
    school = rng.pick(P.schools.prefixes) + rng.pick(P.schools.suffixes[String(life.schoolTier)])
  }

  const majorGroup = weighted(rng, P.majors)
  const usedNames = new Set<string>()
  const personName = () => {
    let n = ''
    do n = rng.pick(P.surnames) + rng.pick(P.given[gender]); while (usedNames.has(n))
    usedNames.add(n)
    return n
  }
  const hometown = () => {
    const t = weighted(rng, P.hometowns)
    return { tier: t.tier, place: rng.pick(t.places), weight: t.weight }
  }
  const destination = (e: Engine) =>
    fillText(P.destinations[e.start.path] ?? P.destinations.unemployed, { entity: e.start.entity || '一家大厂', industry: rng.pick(P.industries) })

  const selfHome = hometown()
  const selfMajor = rng.pick(majorGroup.names)
  const nicks = [...P.nicknames]
  const takeNick = () => nicks.splice(rng.int(0, nicks.length - 1), 1)[0]
  const self: Person = {
    rank: ranks.self, name: personName(), nick: takeNick(), hometown: selfHome.place, hometownTier: selfHome.tier,
    major: selfMajor, majorGroup: majorGroup.group, personality: rng.pick(P.personalities),
    destination: destination(engine), memory: '',
  }

  const usedMemories = new Set<string>()
  const matePeople: Person[] = engine.mates.map((m, i) => {
    const home = hometown()
    // most roommates share your major; some were assigned from another department
    const group = rng.random() < 0.75 ? majorGroup : weighted(rng, P.majors)
    const rank = ranks.mates[i]
    const band = memoryBand(engine.start.close[i])
    const pool: string[] = (overseas ? STORY.memories_overseas : STORY.memories)[band].filter((t: string) => !usedMemories.has(t))
    const memory = rng.pick(pool)
    usedMemories.add(memory)
    return {
      rank, name: personName(), nick: takeNick(), hometown: home.place, hometownTier: home.tier,
      major: rng.pick(group.names), majorGroup: group.group, personality: rng.pick(P.personalities),
      destination: destination(m), memory: fillText(memory, { rank, ta }),
    }
  })

  const fatherAge = life.parentAge, motherAge = fatherAge - rng.int(0, 4)
  const siblings = life.flags.has('only_child') ? '独生子女' : rng.pick(['有一个弟弟', '有一个妹妹', '有一个姐姐', '有一个哥哥'])
  const parents = `父亲 ${fatherAge} 岁，母亲 ${motherAge} 岁，${siblings}`

  const odds: Odds[] = [
    { label: '毕业院校', value: `${school}（${schoolTierName(life.schoolTier, overseas)}）`, p: P.school_odds[String(life.schoolTier)] },
    { label: '专业', value: `${selfMajor}（${majorGroup.group}）`, p: majorGroup.weight },
    { label: '家乡', value: `${selfHome.place}（${selfHome.tier}）`, p: selfHome.weight },
    { label: '家境', value: `收入${FAMILY[life.familyTier]}`, p: 0.2 },
    { label: '第一座城市', value: CITY[life.cityTier], p: P.city_odds[String(life.cityTier)] },
  ]
  const oneIn = Math.round(1 / odds.reduce((a, o) => a * o.p, 1))
  return { overseas, school, degreeName: DEGREES[life.degree], self, mates: matePeople, parents, odds, oneIn, ta }
}

export function schoolTierName(tier: number, overseas: boolean): string {
  if (tier === 4) return overseas ? '海外名校' : '985 院校'
  return { 1: '专科院校', 2: '普通本科院校', 3: '211 院校' }[tier] ?? ''
}
