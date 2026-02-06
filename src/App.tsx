import { useMemo, useState } from 'react'
import './App.css'
import { useLocalDB } from './lib/useLocalDB'
import {
  createAIResource,
  createTimeResource,
  createTodo,
  createUpdate,
  ensureCoreProjects,
  type ID,
  type Project,
} from './lib/storage'
import { syncGitHubIssuesIntoDB } from './lib/syncIssues'
import type { Route } from './pages/types'
import { HomePage } from './pages/HomePage'
import { NewProjectPage } from './pages/NewProjectPage'
import { AddUpdatePage } from './pages/AddUpdatePage'
import { AddTimeResourcePage } from './pages/AddTimeResourcePage'
import { AddAIResourcePage } from './pages/AddAIResourcePage'
import { SearchPage } from './pages/SearchPage'
import { SettingsPage } from './pages/SettingsPage'

export default function App() {
  const { db, write } = useLocalDB()

  const [selectedId, setSelectedId] = useState<ID | null>(db.projects[0]?.id ?? null)
  const [route, setRoute] = useState<Route>({ name: 'home' })
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle')
  const [syncError, setSyncError] = useState<string | null>(null)

  // Keep selectedId valid as projects appear/disappear
  const projectsSorted = useMemo(() => {
    return [...db.projects].sort((a, b) => {
      // Recent updated first
      return b.updatedAt.localeCompare(a.updatedAt)
    })
  }, [db.projects])

  function touchProject(db: { projects: Project[] }, projectId: ID) {
    const p = db.projects.find((x) => x.id === projectId)
    if (p) p.updatedAt = new Date().toISOString()
  }

  // Project editing happens in HomePage (inline fields) and calls write() directly.

  if (route.name === 'newProject') {
    return (
      <NewProjectPage
        onCancel={() => setRoute({ name: 'home' })}
        onCreate={(p) => {
          write((db) => {
            db.projects.unshift(p)
          })
          setSelectedId(p.id)
          setRoute({ name: 'home' })
        }}
      />
    )
  }

  if (route.name === 'addUpdate') {
    const p = db.projects.find((x) => x.id === route.projectId)
    return (
      <AddUpdatePage
        projectName={p?.name ?? 'Project'}
        onCancel={() => setRoute({ name: 'home' })}
        onAdd={(text, milestone) => {
          write((db) => {
            db.updates.push(createUpdate(route.projectId, text, milestone))
            touchProject(db, route.projectId)
          })
          setRoute({ name: 'home' })
        }}
      />
    )
  }

  if (route.name === 'addTimeResource') {
    const p = db.projects.find((x) => x.id === route.projectId)
    return (
      <AddTimeResourcePage
        projectName={p?.name ?? 'Project'}
        onCancel={() => setRoute({ name: 'home' })}
        onAdd={(hours, note) => {
          write((db) => {
            db.resources.push(createTimeResource(route.projectId, hours, note))
            touchProject(db, route.projectId)
          })
          setRoute({ name: 'home' })
        }}
      />
    )
  }

  if (route.name === 'addAIResource') {
    const p = db.projects.find((x) => x.id === route.projectId)
    return (
      <AddAIResourcePage
        projectName={p?.name ?? 'Project'}
        onCancel={() => setRoute({ name: 'home' })}
        onAdd={(model, tokens, euros, note) => {
          write((db) => {
            db.resources.push(createAIResource(route.projectId, model, tokens, euros, note))
            touchProject(db, route.projectId)
          })
          setRoute({ name: 'home' })
        }}
      />
    )
  }

  if (route.name === 'search') {
    return (
      <SearchPage
        projects={projectsSorted.map((p) => ({ id: p.id, name: p.name }))}
        updates={db.updates}
        todos={db.todos}
        resources={db.resources}
        onCancel={() => setRoute({ name: 'home' })}
        onOpenProject={(projectId) => {
          setSelectedId(projectId)
          setRoute({ name: 'home' })
        }}
      />
    )
  }

  if (route.name === 'settings') {
    return (
      <SettingsPage
        onCancel={() => setRoute({ name: 'home' })}
      />
    )
  }

  return (
    <HomePage
      projects={projectsSorted}
      selectedId={selectedId}
      onSelect={(id) => setSelectedId(id)}
      onNewProject={() => setRoute({ name: 'newProject' })}
      onSearch={() => setRoute({ name: 'search' })}
      onSettings={() => setRoute({ name: 'settings' })}
      updates={db.updates}
      todos={db.todos}
      resources={db.resources}
      onAddUpdate={() => selectedId && setRoute({ name: 'addUpdate', projectId: selectedId })}
      onAddTime={() => selectedId && setRoute({ name: 'addTimeResource', projectId: selectedId })}
      onAddAI={() => selectedId && setRoute({ name: 'addAIResource', projectId: selectedId })}
      onToggleTodo={(todoId) => {
        write((db) => {
          const t = db.todos.find((x) => x.id === todoId)
          if (!t) return
          if (t.source === 'github') return
          t.done = !t.done
          t.updatedAt = new Date().toISOString()
          touchProject(db, t.projectId)
        })
      }}
      onEditTodoTitle={(todoId, title) => {
        write((db) => {
          const t = db.todos.find((x) => x.id === todoId)
          if (!t) return
          if (t.source === 'github') return
          t.title = title
          t.updatedAt = new Date().toISOString()
          touchProject(db, t.projectId)
        })
      }}
      onAddTodo={(title) => {
        if (!selectedId) return
        write((db) => {
          db.todos.push(createTodo(selectedId, title))
          touchProject(db, selectedId)
        })
      }}
      onRepairData={() => {
        write((db) => {
          ensureCoreProjects(db as any)
        })
      }}
      onResetData={() => {
        if (!confirm('This will wipe all local data for this app. Continue?')) return
        localStorage.removeItem('pt.db.v1')
        location.reload()
      }}
      onSyncGitHub={async () => {
        try {
          setSyncStatus('syncing')
          setSyncError(null)
          await new Promise((r) => setTimeout(r, 50))

          // Fetch and then write in one atomic update
          const cloned = structuredClone(db)
          await syncGitHubIssuesIntoDB(cloned as any)
          write((db2) => {
            db2.projects = cloned.projects
            db2.todos = cloned.todos
            db2.updates = cloned.updates
            db2.resources = cloned.resources
          })

          setSyncStatus('idle')
        } catch (e) {
          setSyncStatus('error')
          setSyncError(e instanceof Error ? e.message : String(e))
        }
      }}
      syncStatus={syncStatus}
      syncError={syncError}
    />
  )
}
