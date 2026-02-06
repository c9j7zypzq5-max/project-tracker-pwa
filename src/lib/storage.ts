export type ID = string

export type Project = {
  id: ID
  name: string
  stage: string
  progress: number // 0..100
  createdAt: string
  updatedAt: string
}

export type ProjectUpdate = {
  id: ID
  projectId: ID
  date: string
  text: string
  milestone: boolean
}

export type ResourceKind = 'time' | 'budget' | 'tool' | 'service' | 'person' | 'ai'

export type ResourceEntry = {
  id: ID
  projectId: ID
  date: string
  kind: ResourceKind
  title: string
  note?: string
  amount?: number
  unit?: string
}

type DB = {
  projects: Project[]
  updates: ProjectUpdate[]
  resources: ResourceEntry[]
}

const KEY = 'pt.db.v1'

const nowIso = () => new Date().toISOString()
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`)

export function loadDB(): DB {
  const raw = localStorage.getItem(KEY)
  if (!raw) return { projects: [], updates: [], resources: [] }
  try {
    const parsed = JSON.parse(raw) as DB
    return {
      projects: parsed.projects ?? [],
      updates: parsed.updates ?? [],
      resources: parsed.resources ?? [],
    }
  } catch {
    return { projects: [], updates: [], resources: [] }
  }
}

export function saveDB(db: DB) {
  localStorage.setItem(KEY, JSON.stringify(db))
}

export function seedIfEmpty(): DB {
  const db = loadDB()
  if (db.projects.length > 0) return db

  const p1: Project = {
    id: uuid(),
    name: 'Project Tracker (PWA)',
    stage: 'Build',
    progress: 35,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
  const p2: Project = {
    id: uuid(),
    name: 'Landing page',
    stage: 'Draft',
    progress: 10,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }

  const u1: ProjectUpdate = {
    id: uuid(),
    projectId: p1.id,
    date: nowIso(),
    text: 'Bootstrap PWA + offline cache',
    milestone: true,
  }

  const r1: ResourceEntry = {
    id: uuid(),
    projectId: p1.id,
    date: nowIso(),
    kind: 'time',
    title: 'Implementation',
    amount: 2,
    unit: 'h',
  }

  const next: DB = { projects: [p1, p2], updates: [u1], resources: [r1] }
  saveDB(next)
  return next
}

export function createProject(input: Pick<Project, 'name' | 'stage' | 'progress'>): Project {
  const ts = nowIso()
  return {
    id: uuid(),
    name: input.name,
    stage: input.stage,
    progress: clampProgress(input.progress),
    createdAt: ts,
    updatedAt: ts,
  }
}

export function createUpdate(projectId: ID, text: string, milestone: boolean): ProjectUpdate {
  return {
    id: uuid(),
    projectId,
    date: nowIso(),
    text,
    milestone,
  }
}

export function createResource(projectId: ID, kind: ResourceKind, title: string): ResourceEntry {
  return {
    id: uuid(),
    projectId,
    date: nowIso(),
    kind,
    title,
  }
}

export function clampProgress(p: number) {
  if (!Number.isFinite(p)) return 0
  return Math.max(0, Math.min(100, Math.round(p)))
}
