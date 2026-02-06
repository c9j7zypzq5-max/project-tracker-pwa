import { useMemo } from 'react'
import type { ExportBundleV1 } from '../lib/export'
import { shareOrDownload, toCSV } from '../lib/export'
import type { ID, ProjectUpdate, ResourceEntry, Todo } from '../lib/storage'

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

export function HomePage(props: {
  projects: { id: ID; name: string; stage: string; progress: number; updatedAt: string }[]
  selectedId: ID | null
  onSelect: (id: ID) => void
  onNewProject: () => void
  onSearch: () => void

  updates: ProjectUpdate[]
  todos: Todo[]
  resources: ResourceEntry[]

  onAddUpdate: () => void
  onAddTime: () => void
  onAddAI: () => void

  onToggleTodo: (todoId: ID) => void
  onEditTodoTitle: (todoId: ID, title: string) => void
  onAddTodo: (title: string) => void
}) {
  const selected = useMemo(() => props.projects.find((p) => p.id === props.selectedId) ?? null, [props.projects, props.selectedId])

  const updates = useMemo(
    () => props.updates.filter((u) => u.projectId === props.selectedId).sort((a, b) => b.date.localeCompare(a.date)),
    [props.updates, props.selectedId]
  )

  const todos = useMemo(
    () => props.todos.filter((t) => t.projectId === props.selectedId).sort((a, b) => Number(a.done) - Number(b.done)),
    [props.todos, props.selectedId]
  )

  const resources = useMemo(
    () => props.resources.filter((r) => r.projectId === props.selectedId).sort((a, b) => b.date.localeCompare(a.date)),
    [props.resources, props.selectedId]
  )

  const totals = useMemo(() => {
    let hours = 0
    const perModelTokens: Record<string, number> = {}
    const perModelEuros: Record<string, number> = {}

    for (const r of resources) {
      if (r.kind === 'time' && typeof r.hours === 'number') hours += r.hours
      if (r.kind === 'ai' && r.model) {
        perModelTokens[r.model] = (perModelTokens[r.model] ?? 0) + (r.tokens ?? 0)
        perModelEuros[r.model] = (perModelEuros[r.model] ?? 0) + (r.euros ?? 0)
      }
    }

    return { hours, perModelTokens, perModelEuros }
  }, [resources])

  async function exportAll() {
    const bundle: ExportBundleV1 = {
      version: 1,
      exportedAt: new Date().toISOString(),
      projects: props.projects as any,
      updates: props.updates,
      todos: props.todos,
      resources: props.resources,
    }

    const date = new Date().toISOString().slice(0, 10)

    await shareOrDownload(`project-tracker-${date}.json`, JSON.stringify(bundle, null, 2), 'application/json')

    const csv = toCSV(
      props.projects.map((p) => ({
        id: p.id,
        name: p.name,
        stage: p.stage,
        progress: p.progress,
        updatedAt: p.updatedAt,
      }))
    )
    await shareOrDownload(`project-tracker-${date}.csv`, csv, 'text/csv')
  }

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">Project Tracker (PWA)</div>
        <div className="actions" style={{ display: 'flex', gap: 8 }}>
          <button onClick={props.onSearch}>Search</button>
          <button onClick={exportAll}>Export</button>
          <button onClick={props.onNewProject}>+ Project</button>
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <div className="sidebarTitle">Projects</div>
          <div className="projectList">
            {props.projects.map((p) => (
              <button
                key={p.id}
                className={p.id === props.selectedId ? 'projectItem active' : 'projectItem'}
                onClick={() => props.onSelect(p.id)}
              >
                <div className="row">
                  <div className="name">{p.name}</div>
                  <div className="pct">{p.progress}%</div>
                </div>
                {p.stage ? <div className="stage">{p.stage}</div> : null}
                <div className="bar">
                  <div className="barFill" style={{ width: `${p.progress}%` }} />
                </div>
              </button>
            ))}
          </div>
        </aside>

        <main className="main">
          {!selected ? (
            <div className="empty">Select a project</div>
          ) : (
            <div className="detail">
              <div className="card">
                <div className="cardTitle">Summary</div>
                <div className="muted">Updated: {formatDate(selected.updatedAt)}</div>
              </div>

              <div className="card">
                <div className="cardTitleRow">
                  <div className="cardTitle">Todos</div>
                  <button
                    onClick={() => {
                      const title = prompt('New todo title?')?.trim()
                      if (title) props.onAddTodo(title)
                    }}
                  >
                    + Todo
                  </button>
                </div>

                {todos.length === 0 ? (
                  <div className="muted">No todos yet</div>
                ) : (
                  <ul className="list">
                    {todos.map((t) => (
                      <li key={t.id} className="listItem">
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          <input type="checkbox" checked={t.done} onChange={() => props.onToggleTodo(t.id)} />
                          <input
                            style={{ flex: 1 }}
                            value={t.title}
                            onChange={(e) => props.onEditTodoTitle(t.id, e.target.value)}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rowCards">
                <div className="card">
                  <div className="cardTitleRow">
                    <div className="cardTitle">Updates</div>
                    <button onClick={props.onAddUpdate}>+ Update</button>
                  </div>
                  {updates.length === 0 ? (
                    <div className="muted">No updates yet</div>
                  ) : (
                    <ul className="list">
                      {updates.map((u) => (
                        <li key={u.id} className="listItem">
                          <div className="listTop">
                            <div className="muted">{formatDate(u.date)}</div>
                            {u.milestone ? <span className="pill">Milestone</span> : null}
                          </div>
                          <div>{u.text}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="card">
                  <div className="cardTitleRow">
                    <div className="cardTitle">Resources</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={props.onAddTime}>+ Time</button>
                      <button onClick={props.onAddAI}>+ AI</button>
                    </div>
                  </div>

                  <div className="totals">
                    <div className="totalsGrid">
                      <div className="tot">
                        <div className="muted">Time (hours)</div>
                        <div className="totVal">{totals.hours.toFixed(2)}</div>
                      </div>
                      <div className="tot" style={{ gridColumn: 'span 2' }}>
                        <div className="muted">AI cost (per model)</div>
                        {Object.keys(totals.perModelEuros).length === 0 ? (
                          <div className="muted">No AI entries yet</div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
                            {Object.keys(totals.perModelEuros).map((m) => (
                              <div key={m} style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                                <div>{m}</div>
                                <div className="pct">
                                  {totals.perModelTokens[m] ?? 0} tok · €{(totals.perModelEuros[m] ?? 0).toFixed(2)}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {resources.length === 0 ? (
                    <div className="muted">No resources yet</div>
                  ) : (
                    <ul className="list">
                      {resources.map((r) => (
                        <li key={r.id} className="listItem">
                          <div className="listTop">
                            <div className="muted">{formatDate(r.date)}</div>
                            <span className="pill">{r.kind}</span>
                          </div>

                          {r.kind === 'time' ? (
                            <div>
                              <div className="resTitle">{(r.hours ?? 0).toFixed(2)}h</div>
                              {r.note ? <div className="muted">{r.note}</div> : null}
                            </div>
                          ) : (
                            <div>
                              <div className="resTitle">{r.model}</div>
                              <div className="muted">
                                {(r.tokens ?? 0).toFixed(0)} tok · €{(r.euros ?? 0).toFixed(2)}
                              </div>
                              {r.note ? <div className="muted">{r.note}</div> : null}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div className="card">
                <div className="cardTitle">Data</div>
                <div className="muted">Stored locally in your browser (offline-first).</div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
