import { useState } from 'react'

export function AddUpdatePage(props: {
  projectName: string
  onCancel: () => void
  onAdd: (text: string, milestone: boolean) => void
}) {
  const [text, setText] = useState('')
  const [milestone, setMilestone] = useState(false)

  return (
    <div className="page">
      <div className="pageTop">
        <button className="btn" onClick={props.onCancel}>
          ← Back
        </button>
        <div className="pageTitle">New Update</div>
      </div>

      <div className="card">
        <div className="muted">{props.projectName}</div>
        <label className="field">
          <span>What changed?</span>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} placeholder="Write the update…" />
        </label>

        <label className="check">
          <input type="checkbox" checked={milestone} onChange={(e) => setMilestone(e.target.checked)} />
          Milestone
        </label>

        <div className="pageActions">
          <button className="btnPrimary" onClick={() => props.onAdd(text.trim(), milestone)} disabled={!text.trim()}>
            Add
          </button>
        </div>
      </div>
    </div>
  )
}
