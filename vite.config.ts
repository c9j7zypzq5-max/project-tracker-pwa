import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages: set base to repo name when deploying.
// If you deploy to https://<user>.github.io/project-tracker-pwa/ then base must be '/project-tracker-pwa/'.
export default defineConfig(({ mode }) => {
  const isGH = mode === 'gh'

  return {
    base: isGH ? '/project-tracker-pwa/' : '/',
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg'],
        manifest: {
          name: 'Project Tracker',
          short_name: 'Tracker',
          description: 'Offline-first project tracker (MVP)',
          theme_color: '#0B1220',
          background_color: '#0B1220',
          display: 'standalone',
          start_url: '.',
          scope: '.',
          icons: [
            {
              src: 'pwa-192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'pwa-512.png',
              sizes: '512x512',
              type: 'image/png',
            },
          ],
        },
        workbox: {
          navigateFallback: 'index.html',
        },
      }),
    ],
  }
})
