// Companies and roles on the white-collar path, from data/whitecollar.json. tools/simulate.py draws them
// the same way (new_company); keep the two in step.
import type { Rng } from './rng'

export interface WhitecollarTable {
  types: Record<string, { weight: number; label: string }>
  roles: Record<string, number>
  trainee: { share: number; school_tier: number; until_age: number }
  names: { prefix: string[]; suffix: Record<string, string[]> }
}

export const COMPANY_FLAGS = ['wc_private', 'wc_foreign', 'wc_soe']

/** A company to work at: its type (forced, or drawn by weight), a role and a generated name. */
export function drawCompany(t: WhitecollarTable, rng: Rng, type?: string) {
  const types = Object.keys(t.types)
  const kind = type && t.types[type] ? type : rng.weighted(types, types.map(k => t.types[k].weight))
  const roles = Object.keys(t.roles)
  const role = rng.weighted(roles, roles.map(r => t.roles[r]))
  const name = rng.pick(t.names.prefix) + rng.pick(t.names.suffix[kind])
  return { kind, role, name }
}
