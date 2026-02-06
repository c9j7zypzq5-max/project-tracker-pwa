import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registerSW } from 'virtual:pwa-register'

function showBootError(err: unknown) {
  const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err)
  const pre = document.createElement('pre')
  pre.style.whiteSpace = 'pre-wrap'
  pre.style.padding = '12px'
  pre.style.fontFamily = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
  pre.style.color = '#fecaca'
  pre.textContent = `App failed to start.\n\n${msg}`
  document.body.innerHTML = ''
  document.body.appendChild(pre)
}

window.addEventListener('error', (e) => showBootError(e.error ?? e.message))
window.addEventListener('unhandledrejection', (e) => showBootError(e.reason))

try {
  // Auto-update service worker (offline + new versions when available)
  registerSW({ immediate: true })

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
} catch (err) {
  showBootError(err)
}
