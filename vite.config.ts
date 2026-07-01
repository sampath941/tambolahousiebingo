import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'pwa-*.png', 'maskable-icon-512x512.png'],
      manifest: {
        name: 'Tambola Caller: Housie Bingo',
        short_name: 'Tambola Caller',
        description: 'Call Tambola / Housie numbers with friends and family',
        theme_color: '#7c3aed',
        background_color: '#f5f3ff',
        display: 'standalone',
        orientation: 'any',
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: '/maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /\/audio\/.+\.mp3$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'tambola-audio',
              expiration: { maxEntries: 1100, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\./i,
            handler: 'CacheFirst',
          },
        ]
      }
    })
  ]
})
