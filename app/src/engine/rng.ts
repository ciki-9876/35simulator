// Seeded PRNG (mulberry32). Every random draw in a life goes through one Rng, so a seed code plus the
// same choices reproduces the same life.

export class Rng {
  private state: number

  constructor(seed: number) {
    this.state = seed >>> 0
  }

  random(): number {
    this.state = (this.state + 0x6d2b79f5) | 0
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  int(lo: number, hi: number): number {
    return lo + Math.floor(this.random() * (hi - lo + 1))
  }

  pick<T>(items: readonly T[]): T {
    return items[Math.floor(this.random() * items.length)]
  }

  weighted<T>(items: readonly T[], weights: readonly number[]): T {
    const total = weights.reduce((a, b) => a + b, 0)
    let r = this.random() * total
    for (let i = 0; i < items.length; i++) {
      r -= weights[i]
      if (r < 0) return items[i]
    }
    return items[items.length - 1]
  }
}
