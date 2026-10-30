// Jobs and workplaces on the service path, from data/service.json. tools/simulate.py draws them the same
// way (Life.join_job); keep the two in step.
import type { Rng } from './rng'

export interface ServiceTable {
  jobs: Record<string, { weight: number; label: string; boss: string; platform: boolean; needs_car?: boolean }>
  names: { area: string[]; courier: string[]; shop_prefix: string[]; shop_suffix: string[] }
}

/** A service job (forced, or drawn by weight; driving needs a car and a clean record) and where it is. */
export function drawJob(t: ServiceTable, rng: Rng, canDrive: boolean, job?: string) {
  const jobs = Object.keys(t.jobs)
  const kind = job && t.jobs[job] ? job
    : rng.weighted(jobs, jobs.map(k => (t.jobs[k].needs_car && !canDrive ? 0 : t.jobs[k].weight)))
  const n = t.names
  const shop = () => rng.pick(n.shop_prefix) + rng.pick(n.shop_suffix)
  const place = kind === 'rider' ? rng.pick(n.area) + '站'
    : kind === 'courier' ? rng.pick(n.courier) + '快递'
    : kind === 'store' || kind === 'owner' ? shop() : ''
  return { kind, place }
}
