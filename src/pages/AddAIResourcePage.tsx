import { useMemo, useState } from 'react'

export function AddAIResourcePage(props: {
  projectName: string
  onCancel: () => void
  onAdd: (model: string, tokens: number, euros: number, note?: string) => void
}) {
  const [model, setModel] = useState('')
  const [tokensText, setTokensText] = useState('')
  const [eurosText, setEurosText] = useState('')
  const [note, setNote] = useState('')

  const tokens = useMemo(() => Number(tokensText.replace(',', '.')), [tokensText])
  const euros = useMemo(() => Number(eurosText.replace(',', '.')), [eurosText])

  const valid = model.trim() && Number.isFinite(tokens) && tokens >= 0 && Number.isFinite(euros) && euros >= 0

  return (
    <div className="page">
      <div className="pageTop">
        <button className="btn" onClick={props.onCancel}>
          ← Back
        </button>
        <div className="pageTitle">Add AI Cost</div>
      </div>

      <div className="card">
        <div className="muted">{props.projectName}</div>
        <label className="field">
          <span>Model</span>
          <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="e.g. gpt-5.2 / claude-sonnet" />
        </label>
        <label className="field">
          <span>Tokens</span>
          <input value={tokensText} onChange={(e) => setTokensText(e.target.value)} placeholder="e.g. 120000" inputMode="numeric" />
        </label>
        <label className="field">
          <span>Euros</span>
          <input value={eurosText} onChange={(e) => setEurosText(e.target.value)} placeholder="e.g. 2.34" inputMode="decimal" />
        </label>
        <label className="field">
          <span>Note (optional)</span>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Context" />
        </label>

        <div className="pageActions">
          <button
            className="btnPrimary"
            disabled={!valid}
            onClick={() => props.onAdd(model.trim(), tokens, euros, note.trim() || undefined)}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  )
}
