import { useEffect, useMemo, useSyncExternalStore } from 'react'
import { loadDB, saveDB, seedIfEmpty } from './storage'

type Listener = () => void

class LocalDBStore {
  private listeners = new Set<Listener>()

  constructor() {
    // Ensure there is some data on first run
    seedIfEmpty()

    // Multi-tab sync
    window.addEventListener('storage', (e) => {
      if (e.key === 'pt.db.v1') this.emit()
    })
  }

  subscribe = (l: Listener) => {
    this.listeners.add(l)
    return () => this.listeners.delete(l)
  }

  private cachedRaw: string | null = null
  private cachedParsed = loadDB()

  getSnapshot = () => {
    // useSyncExternalStore requires referential stability when data hasn't changed.
    const raw = localStorage.getItem('pt.db.v1')
    if (raw === this.cachedRaw) return this.cachedParsed

    this.cachedRaw = raw
    this.cachedParsed = loadDB()
    return this.cachedParsed
  }

  write = (mutate: (db: ReturnType<typeof loadDB>) => void) => {
    const db = loadDB()
    mutate(db)
    saveDB(db)
    this.emit()
  }

  private emit() {
    for (const l of this.listeners) l()
  }
}

const store = new LocalDBStore()

export function useLocalDB() {
  const db = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)

  const api = useMemo(
    () => ({
      db,
      write: store.write,
    }),
    [db]
  )

  // Make sure initial seeding triggers a render if needed
  useEffect(() => {
    // no-op; constructor already seeded
  }, [])

  return api
}
