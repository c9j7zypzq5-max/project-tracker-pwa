import { useMemo, useState } from 'react'
import './App.css'
import { useLocalDB } from './lib/useLocalDB'
import { clampProgress, createProject, createResource, createUpdate, type ID, type ResourceKind } from './lib/storage'

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

export default function App() {
  const { db, write } = useLocalDB()
  const [selectedId, setSelectedId] = useState<ID | null>(db.projects[0]?.id ?? null)

  const selected = useMemo(() => db.projects.find((p) => p.id === selectedId) ?? null, [db.projects, selectedId])
  const updates = useMemo(() => db.updates.filter((u) => u.projectId === selectedId).sort((a, b) => b.date.localeCompare(a.date)), [db.updates, selectedId])
  const resources = useMemo(() => db.resources.filter((r) => r.projectId === selectedId).sort((a, b) => b.date.localeCompare(a.date)), [db.resources, selectedId])

  const totals = useMemo(() => {
    const sums: Partial<Record<ResourceKind, number>> = {}
    const counts: Partial<Record<ResourceKind, number>> = {}
    for (const r of resources) {
      counts[r.kind] = (counts[r.kind] ?? 0) + 1
      if (typeof r.amount === 'number') sums[r.kind] = (sums[r.kind] ?? 0) + r.amount
    }
    return { sums, counts }
  }, [resources])

  function addProject() {
    write((db) => {
      const p = createProject({ name: 'New project', stage: '', progress: 0 })
      db.projects.unshift(p)
      setSelectedId(p.id)
    })
  }

  function updateProject(fields: Partial<{ name: string; stage: string; progress: number }>) {
    if (!selectedId) return
    write((db) => {
      const p = db.projects.find((x) => x.id === selectedId)
      if (!p) return
      if (fields.name !== undefined) p.name = fields.name
      if (fields.stage !== undefined) p.stage = fields.stage
      if (fields.progress !== undefined) p.progress = clampProgress(fields.progress)
      p.updatedAt = new Date().toISOString()
    })
  }

  function addUpdate() {
    if (!selectedId) return
    const text = prompt('Update text?')?.trim()
    if (!text) return
    const milestone = confirm('Milestone?')

    write((db) => {
      db.updates.push(createUpdate(selectedId, text, milestone))
      const p = db.projects.find((x) => x.id === selectedId)
      if (p) p.updatedAt = new Date().toISOString()
    })
  }

  function addResource() {
    if (!selectedId) return
    const kind = (prompt('Kind (time/budget/tool/service/person/ai)?', 'time')?.trim() as ResourceKind) || 'time'
    const title = prompt('Title?')?.trim()
    if (!title) return
    const amountRaw = prompt('Amount (optional)?')?.trim()
    const unit = prompt('Unit (optional)?')?.trim()

    write((db) => {
      const r = createResource(selectedId, kind, title)
      if (amountRaw) {
        const n = Number(amountRaw.replace(',', '.'))
        if (Number.isFinite(n)) r.amount = n
      }
      if (unit) r.unit = unit
      db.resources.push(r)
      const p = db.projects.find((x) => x.id === selectedId)
      if (p) p.updatedAt = new Date().toISOString()
    })
  }

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">Project Tracker (PWA)</div>
        <div className="actions">
          <button onClick={addProject}>+ Project</button>
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <div className="sidebarTitle">Projects</div>
          <div className="projectList">
            {db.projects.map((p) => (
              <button
                key={p.id}
                className={p.id === selectedId ? 'projectItem active' : 'projectItem'}
                onClick={() => setSelectedId(p.id)}
              >
                <div className="row">
                  <div className="name">{p.name}</div>
                  <div className="pct">{p.progress}%</div>
                </div>
                {p.stage ? <div className="stage">{p.stage}</div> : null}
                <div className="bar"><div className="barFill" style={{ width: `${p.progress}%` }} /></div>
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
                <label className="field">
                  <span>Name</span>
                  <input value={selected.name} onChange={(e) => updateProject({ name: e.target.value })} />
                </label>
                <label className="field">
                  <span>Stage</span>
                  <input value={selected.stage} onChange={(e) => updateProject({ stage: e.target.value })} />
                </label>
                <label className="field">
                  <span>Progress ({selected.progress}%)</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={selected.progress}
                    onChange={(e) => updateProject({ progress: Number(e.target.value) })}
                  />
                </label>
                <div className="meta">Updated: {formatDate(selected.updatedAt)}</div>
              </div>

              <div className="rowCards">
                <div className="card">
                  <div className="cardTitleRow">
                    <div className="cardTitle">Updates</div>
                    <button onClick={addUpdate}>+ Update</button>
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
                    <button onClick={addResource}>+ Resource</button>
                  </div>

                  <div className="totals">
                    {Object.entries(totals.sums).length === 0 && Object.entries(totals.counts).length === 0 ? (
                      <div className="muted">No totals yet</div>
                    ) : (
                      <div className="totalsGrid">
                        {(['time', 'budget', 'tool', 'service', 'person', 'ai'] as ResourceKind[]).map((k) => {
                          const sum = totals.sums[k]
                          const cnt = totals.counts[k]
                          if (sum === undefined && cnt === undefined) return null
                          return (
                            <div className="tot" key={k}>
                              <div className="muted">{k}</div>
                              <div className="totVal">{sum !== undefined ? sum.toFixed(2) : cnt}</div>
                            </div>
                          )
                        })}
                      </div>
                    )}
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
                          <div className="resTitle">{r.title}</div>
                          {typeof r.amount === 'number' ? (
                            <div className="muted">
                              {r.amount} {r.unit ?? ''}
                            </div>
                          ) : null}
                          {r.note ? <div className="muted">{r.note}</div> : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div className="card">
                <div className="cardTitle">Data</div>
                <div className="muted">Stored locally in your browser (offline-first). Add to Home Screen on iOS for an app-like experience.</div>
                <div className="smallActions">
                  <button
                    onClick={() => {
                      if (!confirm('This will wipe all local data for this app. Continue?')) return
                      localStorage.removeItem('pt.db.v1')
                      location.reload()
                    }}
                  >
                    Reset local data
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
