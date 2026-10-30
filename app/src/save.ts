// One autosave slot in IndexedDB. A save is the seed plus the choices taken (the engine replays the
// rest), so it stays a few hundred bytes. Storage can be missing (private windows), so every call
// fails soft.
import { ENGINE_VERSION } from './engine/engine'
import type { Note } from './screens/Moment'

export interface Save {
  version: number
  seed: number
  choices: number[]
  elapsed: number
  /** 暂停片刻 answers: the player's own words, which the replay cannot rebuild. */
  notes?: Note[]
  savedAt: number
}

const DB = 'tongjiesheng', STORE = 'saves', KEY = 'auto'

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function run<T>(mode: IDBTransactionMode, op: (s: IDBObjectStore) => IDBRequest): Promise<T | null> {
  try {
    const db = await open()
    return await new Promise<T>((resolve, reject) => {
      const req = op(db.transaction(STORE, mode).objectStore(STORE))
      req.onsuccess = () => resolve(req.result as T)
      req.onerror = () => reject(req.error)
    })
  } catch {
    return null
  }
}

export const loadSave = () => run<Save>('readonly', s => s.get(KEY)).then(v => (v && v.version === ENGINE_VERSION ? v : null))
export const writeSave = (save: Save) => run('readwrite', s => s.put(save, KEY))
export const clearSave = () => run('readwrite', s => s.delete(KEY))
