import { useEffect, useState } from 'react'
import { loadGitHubConfig, saveGitHubConfig } from '../lib/github'

export function SettingsPage(props: {
  onCancel: () => void
}) {
  const [repo, setRepo] = useState('')
  const [token, setToken] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const cfg = loadGitHubConfig()
    setRepo(cfg.repo)
    setToken(cfg.token ?? '')
  }, [])

  return (
    <div className="page">
      <div className="pageTop">
        <button className="btn" onClick={props.onCancel}>
          ← Back
        </button>
        <div className="pageTitle">Settings</div>
      </div>

      <div className="card">
        <div className="cardTitle">GitHub Sync</div>
        <label className="field">
          <span>Repo (owner/name)</span>
          <input value={repo} onChange={(e) => setRepo(e.target.value)} placeholder="owner/repo" />
        </label>
        <label className="field">
          <span>Token (optional)</span>
          <input value={token} onChange={(e) => setToken(e.target.value)} placeholder="ghp_…" />
        </label>
        <div className="muted">
          Token is stored locally on this device. Leave empty for public read-only (rate-limited).
        </div>

        <div className="pageActions">
          <button
            className="btnPrimary"
            onClick={() => {
              saveGitHubConfig({ repo: repo.trim(), token: token.trim() || undefined })
              setSaved(true)
              setTimeout(() => setSaved(false), 1500)
            }}
            disabled={!repo.trim()}
          >
            Save
          </button>
        </div>
        {saved ? <div className="muted" style={{ marginTop: 10 }}>Saved.</div> : null}
      </div>
    </div>
  )
}
