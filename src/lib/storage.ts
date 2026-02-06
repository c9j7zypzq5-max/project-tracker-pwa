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

function ensureCoreProjects(db: DB): boolean {
  const coreNames = ['Project Tracker PWA', 'Project Tracker iOS', 'PC-Compare', 'FoodAO']

  let changed = false
  for (const name of coreNames) {
    if (!db.projects.some((p) => p.name.trim().toLowerCase() === name.toLowerCase())) {
      const ts = nowIso()
      db.projects.push({
        id: uuid(),
        name,
        stage: name === 'Project Tracker PWA' ? 'Build' : '',
        progress: name === 'Project Tracker PWA' ? 40 : 0,
        createdAt: ts,
        updatedAt: ts,
      })
      changed = true
    }
  }

  // If we just created the PWA project, add some starter updates/todos.
  const pwa = db.projects.find((p) => p.name.trim().toLowerCase() === 'project tracker pwa')
  if (pwa) {
    const hasAny = db.updates.some((u) => u.projectId === pwa.id) || db.todos.some((t) => t.projectId === pwa.id)
    if (!hasAny) {
      db.updates.push({
        id: uuid(),
        projectId: pwa.id,
        date: nowIso(),
        text: 'Bootstrap PWA (offline-first) + GitHub Pages deploy',
        milestone: true,
      })
      db.todos.push(createTodo(pwa.id, 'Replace prompt() with dedicated pages'))
      db.todos.push(createTodo(pwa.id, 'Add export JSON/CSV'))
      db.todos.push(createTodo(pwa.id, 'Add search (projects + updates + resources)'))
      changed = true
    }
  }

  return changed
}

// Seed for first run, and migrate existing installs by ensuring core projects exist.
export function seedIfEmpty(): DB {
  const db = loadDB()

  if (db.projects.length === 0) {
    // First run: add core projects + starter items
    ensureCoreProjects(db)
    saveDB(db)
    return db
  }

  // Existing install: ensure core projects exist (non-destructive)
  if (ensureCoreProjects(db)) {
    saveDB(db)
  }

  return db
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
