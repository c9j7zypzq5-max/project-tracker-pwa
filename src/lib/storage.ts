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

export type Todo = {
  id: ID
  projectId: ID
  createdAt: string
  updatedAt: string
  title: string
  done: boolean
}

// MVP resource tracking focuses on:
// - time spent
// - AI cost (tokens + euros) per model
export type ResourceKind = 'time' | 'ai'

export type ResourceEntry = {
  id: ID
  projectId: ID
  date: string
  kind: ResourceKind

  // For time
  hours?: number

  // For AI
  model?: string
  tokens?: number
  euros?: number

  note?: string
}

type DB = {
  projects: Project[]
  updates: ProjectUpdate[]
  todos: Todo[]
  resources: ResourceEntry[]
}

const KEY = 'pt.db.v1'

const nowIso = () => new Date().toISOString()
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`)

export function loadDB(): DB {
  const raw = localStorage.getItem(KEY)
  if (!raw) return { projects: [], updates: [], todos: [], resources: [] }
  try {
    const parsed = JSON.parse(raw) as DB
    return {
      projects: parsed.projects ?? [],
      updates: parsed.updates ?? [],
      todos: parsed.todos ?? [],
      resources: parsed.resources ?? [],
    }
  } catch {
    return { projects: [], updates: [], todos: [], resources: [] }
  }
}

export function saveDB(db: DB) {
  localStorage.setItem(KEY, JSON.stringify(db))
}

export function seedIfEmpty(): DB {
  const db = loadDB()
  if (db.projects.length > 0) return db

  const projects = [
    'Project Tracker PWA',
    'Project Tracker iOS',
    'PC-Compare',
    'FoodAO',
  ].map((name, i) => {
    const ts = nowIso()
    return {
      id: uuid(),
      name,
      stage: i === 0 ? 'Build' : '',
      progress: i === 0 ? 40 : 0,
      createdAt: ts,
      updatedAt: ts,
    } satisfies Project
  })

  const updates: ProjectUpdate[] = [
    {
      id: uuid(),
      projectId: projects[0].id,
      date: nowIso(),
      text: 'Bootstrap PWA (offline-first) + GitHub Pages deploy',
      milestone: true,
    },
    {
      id: uuid(),
      projectId: projects[0].id,
      date: nowIso(),
      text: 'Next: proper forms → export → search',
      milestone: false,
    },
  ]

  const todos: Todo[] = [
    {
      id: uuid(),
      projectId: projects[0].id,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      title: 'Replace prompt() with dedicated pages',
      done: false,
    },
    {
      id: uuid(),
      projectId: projects[0].id,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      title: 'Add export JSON/CSV',
      done: false,
    },
    {
      id: uuid(),
      projectId: projects[0].id,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      title: 'Add search (projects + updates + resources)',
      done: false,
    },
  ]

  const resources: ResourceEntry[] = [
    {
      id: uuid(),
      projectId: projects[0].id,
      date: nowIso(),
      kind: 'time',
      hours: 2,
      note: 'Initial implementation',
    },
  ]

  const next: DB = { projects, updates, todos, resources }
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

export function createTodo(projectId: ID, title: string): Todo {
  const ts = nowIso()
  return {
    id: uuid(),
    projectId,
    createdAt: ts,
    updatedAt: ts,
    title,
    done: false,
  }
}

export function createTimeResource(projectId: ID, hours: number, note?: string): ResourceEntry {
  return {
    id: uuid(),
    projectId,
    date: nowIso(),
    kind: 'time',
    hours,
    note,
  }
}

export function createAIResource(projectId: ID, model: string, tokens: number, euros: number, note?: string): ResourceEntry {
  return {
    id: uuid(),
    projectId,
    date: nowIso(),
    kind: 'ai',
    model,
    tokens,
    euros,
    note,
  }
}

export function clampProgress(p: number) {
  if (!Number.isFinite(p)) return 0
  return Math.max(0, Math.min(100, Math.round(p)))
}
