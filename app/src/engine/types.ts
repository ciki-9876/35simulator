// Event library types. The contract is events/README.md; tools/lint_events.py validates the JSON.

export type Cmp = string // ">=60", "<3", "==2"
export type Formula = number | string

export interface When {
  path?: string | string[]
  not_path?: string | string[]
  sub?: string | string[]
  tenure?: Cmp
  role?: string | string[]
  level?: Cmp
  stat?: Record<string, Cmp>
  flags?: string[]
  not_flags?: string[]
  module?: string
  not_module?: string
  history_any?: string[]
  history_months?: Record<string, Cmp>
  gap_months?: Cmp
  exit_reason?: string
  record?: string
  degree?: Cmp
  school_tier?: Cmp
  family_tier?: Cmp
  city_tier?: Cmp
  year?: Cmp
  scenario?: string
  roommate?: { close?: Cmp; path?: string }
  living?: string | string[]
  relationship?: string | string[]
  season?: string
  kids?: Cmp
  parent_age?: Cmp
}

export interface Effects {
  health?: number
  mood?: number
  ability?: number
  social?: number
  money?: Formula
  flags_add?: string[]
  flags_remove?: string[]
  module_start?: string
  module_end?: string
  path?: string
  sub?: string
  exit_reason?: string
  record?: string
  level?: number
  income_mult?: number
  roommate_close?: number
  modifier?: Record<string, number>
  relationship?: string
  living?: string
  kids?: number
  /** Buys an ordinary home in your city ("city") or your hometown ("hometown"). */
  buy_home?: 'city' | 'hometown'
  sell_home?: boolean
  /** Pays this share of your savings off the mortgage. */
  prepay?: number
  parent_health?: number
  /** White-collar job hop: a new company of this type ("new" draws one). */
  company?: string
  text?: string
}

export interface Followup {
  id: string
  delay?: number
  chance?: number
}

export interface Option {
  label: string
  hint?: string
  /** Weight of this option when the choice is made automatically (roommates, auto mode); default 1. */
  auto?: number
  p?: Formula
  success?: Effects
  fail?: Effects
  effects?: Effects
  unlock?: When
  followups?: Followup[]
}

export interface GameEvent {
  id: string
  path?: string
  domain?: string
  seed: string
  type: 'daily' | 'choice' | 'chain' | 'macro' | 'milestone' | 'echo'
  age: [number, number]
  when?: When
  chance?: Formula
  weight?: number
  trigger?: 'follow' | 'path_change'
  transition?: { from?: string; to?: string }
  once?: boolean
  cooldown?: number
  text: { t: string; when?: When }[]
  fact?: { text: string; source: string; year?: number }
  effects?: Effects
  options?: Option[]
  followups?: Followup[]
  help?: string[]
  review?: string
}

export interface ScenarioYear {
  internet: number
  property: number
  exam_heat: number
  ai: number
  pandemic: number
  label?: string
}

export interface Timeline {
  scenario: Record<string, ScenarioYear>
  events: { date: string; cat: string; title: string; impact: string; label: string }[]
}
