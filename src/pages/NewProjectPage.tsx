import { useState } from 'react'
import type { Project } from '../lib/storage'
import { clampProgress, createProject } from '../lib/storage'

export function NewProjectPage(props: {
  onCancel: () => void
  onCreate: (p: Project) => void
}) {
  const [name, setName] = useState('')
  const [stage, setStage] = useState('')
  const [progress, setProgress] = useState(0)

  return (
    <div className="page">
      <div className="pageTop">
        <button className="btn" onClick={props.onCancel}>
          ← Back
        </button>
        <div className="pageTitle">New Project</div>
      </div>

      <div className="card">
        <label className="field">
          <span>Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. FoodAO" />
        </label>
        <label className="field">
          <span>Stage</span>
          <input value={stage} onChange={(e) => setStage(e.target.value)} placeholder="e.g. Build" />
        </label>
        <label className="field">
          <span>Progress ({progress}%)</span>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={progress}
            onChange={(e) => setProgress(clampProgress(Number(e.target.value)))}
          />
        </label>

        <div className="pageActions">
          <button
            className="btnPrimary"
            onClick={() => {
              const n = name.trim()
              if (!n) return
              props.onCreate(createProject({ name: n, stage: stage.trim(), progress }))
            }}
            disabled={!name.trim()}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  )
}
