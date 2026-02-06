import { useState } from 'react'

export function AddTimeResourcePage(props: {
  projectName: string
  onCancel: () => void
  onAdd: (hours: number, note?: string) => void
}) {
  const [hoursText, setHoursText] = useState('')
  const [note, setNote] = useState('')

  const hours = Number(hoursText.replace(',', '.'))
  const valid = Number.isFinite(hours) && hours > 0

  return (
    <div className="page">
      <div className="pageTop">
        <button className="btn" onClick={props.onCancel}>
          ← Back
        </button>
        <div className="pageTitle">Add Time</div>
      </div>

      <div className="card">
        <div className="muted">{props.projectName}</div>
        <label className="field">
          <span>Hours</span>
          <input value={hoursText} onChange={(e) => setHoursText(e.target.value)} placeholder="e.g. 1.5" inputMode="decimal" />
        </label>
        <label className="field">
          <span>Note (optional)</span>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="What did you do?" />
        </label>

        <div className="pageActions">
          <button className="btnPrimary" disabled={!valid} onClick={() => props.onAdd(hours, note.trim() || undefined)}>
            Add
          </button>
        </div>
      </div>
    </div>
  )
}
