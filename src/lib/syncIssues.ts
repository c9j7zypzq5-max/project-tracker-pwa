import { fetchIssues, hasLabel, loadGitHubConfig, projectFromLabels, type GitHubIssue } from './github'
import type { DB, Project, Todo } from './storage'

function norm(s: string) {
  return s.trim().toLowerCase()
}

function ensureProject(db: DB, name: string): Project {
  const existing = db.projects.find((p) => norm(p.name) === norm(name))
  if (existing) return existing

  const ts = new Date().toISOString()
  const p: Project = {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    name,
    stage: '',
    progress: 0,
    createdAt: ts,
    updatedAt: ts,
  }
  db.projects.push(p)
  return p
}

function issueToTodo(projectId: string, issue: GitHubIssue): Todo {
  const done = issue.state === 'closed' || hasLabel(issue, 'done')

  return {
    id: `gh:${issue.number}`,
    projectId,
    createdAt: issue.created_at,
    updatedAt: issue.updated_at,
    title: issue.title,
    done,
    source: 'github',
    url: issue.html_url,
  }
}

function inferProjectName(issue: GitHubIssue): string {
  const p = projectFromLabels(issue)
  if (p) {
    // map label slugs -> display names
    if (p === 'tracker-pwa') return 'Project Tracker PWA'
    if (p === 'tracker-ios') return 'Project Tracker iOS'
    if (p === 'pc-compare') return 'PC-Compare'
    if (p === 'foodao') return 'FoodAO'
    return p
  }

  // fallback: prefix in title
  const m = issue.title.split(':')[0]
  return m || 'Project Tracker PWA'
}

export async function syncGitHubIssuesIntoDB(db: DB) {
  const cfg = loadGitHubConfig()
  const issues = await fetchIssues(cfg)

  // Keep only todo/doing issues for now
  const todoIssues = issues.filter((i) => hasLabel(i, 'todo') || hasLabel(i, 'doing'))

  // Remove old github-sourced todos (we will recreate from fresh fetch)
  db.todos = db.todos.filter((t) => t.source !== 'github')

  for (const issue of todoIssues) {
    const projectName = inferProjectName(issue)
    const p = ensureProject(db, projectName)
    db.todos.push(issueToTodo(p.id, issue))
  }

  // Touch updatedAt of projects that gained github todos
  const touched = new Set<string>(db.todos.filter((t) => t.source === 'github').map((t) => t.projectId))
  const ts = new Date().toISOString()
  for (const p of db.projects) {
    if (touched.has(p.id)) p.updatedAt = ts
  }
}
