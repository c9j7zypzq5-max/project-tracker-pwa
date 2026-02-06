import { useMemo, useState } from 'react'
import type { ProjectUpdate, ResourceEntry, Todo } from '../lib/storage'
import type { ID } from '../lib/storage'

export function SearchPage(props: {
  projects: { id: ID; name: string }[]
  updates: ProjectUpdate[]
  todos: Todo[]
  resources: ResourceEntry[]
  onCancel: () => void
  onOpenProject: (projectId: ID) => void
}) {
  const [q, setQ] = useState('')
  const query = q.trim().toLowerCase()

  const results = useMemo(() => {
    if (!query) return props.projects

    const projectIds = new Set<ID>()

    for (const p of props.projects) {
      if (p.name.toLowerCase().includes(query)) projectIds.add(p.id)
    }

    for (const u of props.updates) {
      if (u.text.toLowerCase().includes(query)) projectIds.add(u.projectId)
    }

    for (const t of props.todos) {
      if (t.title.toLowerCase().includes(query)) projectIds.add(t.projectId)
    }

    for (const r of props.resources) {
      const hay = [r.kind, r.model ?? '', r.note ?? ''].join(' ').toLowerCase()
      if (hay.includes(query)) projectIds.add(r.projectId)
    }

    return props.projects.filter((p) => projectIds.has(p.id))
  }, [props.projects, props.resources, props.todos, props.updates, query])

  return (
    <div className="page">
      <div className="pageTop">
        <button className="btn" onClick={props.onCancel}>
          ← Back
        </button>
        <div className="pageTitle">Search</div>
      </div>

      <div className="card">
        <label className="field">
          <span>Query</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Project, update, todo, resource…" />
        </label>
      </div>

      <div className="card">
        <div className="cardTitle">Results ({results.length})</div>
        <div className="projectList">
          {results.map((p) => (
            <button key={p.id} className="projectItem" onClick={() => props.onOpenProject(p.id)}>
              <div className="row">
                <div className="name">{p.name}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
