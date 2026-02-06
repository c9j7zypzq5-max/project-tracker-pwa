import type { Project, ProjectUpdate, ResourceEntry, Todo } from './storage'

export type ExportBundleV1 = {
  version: 1
  exportedAt: string
  projects: Project[]
  updates: ProjectUpdate[]
  todos: Todo[]
  resources: ResourceEntry[]
}

export function downloadText(filename: string, text: string, mime = 'text/plain') {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export async function shareOrDownload(filename: string, text: string, mime: string) {
  const blob = new Blob([text], { type: mime })
  const file = new File([blob], filename, { type: mime })

  // iOS Safari supports navigator.share for files on recent versions.
  // Fallback to download if not available.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nav: any = navigator
  if (nav.share && nav.canShare && nav.canShare({ files: [file] })) {
    await nav.share({ files: [file], title: filename })
    return
  }

  downloadText(filename, text, mime)
}

export function toCSV(rows: Record<string, unknown>[]): string {
  const keys = Array.from(
    rows.reduce((acc, r) => {
      for (const k of Object.keys(r)) acc.add(k)
      return acc
    }, new Set<string>())
  )

  const esc = (v: unknown) => {
    if (v === null || v === undefined) return ''
    const s = String(v)
    if (/[\n\r",]/.test(s)) return `"${s.replaceAll('"', '""')}"`
    return s
  }

  const header = keys.join(',')
  const lines = rows.map((r) => keys.map((k) => esc(r[k])).join(','))
  return [header, ...lines].join('\n')
}
