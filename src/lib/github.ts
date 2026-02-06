export type GitHubIssue = {
  id: number
  number: number
  title: string
  body: string | null
  state: 'open' | 'closed'
  labels: { name: string }[]
  created_at: string
  updated_at: string
  html_url: string
}

export type GitHubConfig = {
  repo: string // owner/name
  token?: string // optional; stored locally
}

const KEY = 'pt.github.v1'

export function loadGitHubConfig(): GitHubConfig {
  const raw = localStorage.getItem(KEY)
  if (!raw) return { repo: 'c9j7zypzq5-max/project-tracker-pwa' }
  try {
    const parsed = JSON.parse(raw) as GitHubConfig
    return { repo: parsed.repo || 'c9j7zypzq5-max/project-tracker-pwa', token: parsed.token }
  } catch {
    return { repo: 'c9j7zypzq5-max/project-tracker-pwa' }
  }
}

export function saveGitHubConfig(cfg: GitHubConfig) {
  localStorage.setItem(KEY, JSON.stringify(cfg))
}

export async function fetchIssues(cfg: GitHubConfig): Promise<GitHubIssue[]> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
  }
  if (cfg.token) headers.Authorization = `Bearer ${cfg.token}`

  // Use issues endpoint (includes PRs) but we filter PRs out by checking for pull_request field via REST is hard here.
  // For MVP, we accept that if PRs appear, they can be ignored by label rules.
  const url = `https://api.github.com/repos/${cfg.repo}/issues?state=all&per_page=100&sort=updated&direction=desc`

  const res = await fetch(url, { headers })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`GitHub fetch failed (${res.status}). ${text}`)
  }

  const data = (await res.json()) as any[]
  // Filter out PRs reliably
  const issues = data.filter((x) => !x.pull_request) as GitHubIssue[]
  return issues
}

export function hasLabel(issue: GitHubIssue, label: string): boolean {
  return issue.labels?.some((l) => l.name === label) ?? false
}

export function projectFromLabels(issue: GitHubIssue): string | null {
  const p = issue.labels?.map((l) => l.name).find((n) => n.startsWith('project:'))
  return p ? p.slice('project:'.length) : null
}
