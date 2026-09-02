import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Pulso — Performance Low Ticket',
        short_name: 'Pulso',
        description: 'Painel operacional de performance para ofertas low ticket.',
        theme_color: '#14251f',
        background_color: '#f5f7f5',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: '/icon-maskable.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' }
        ]
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /\/api\//,
            handler: 'NetworkFirst',
            options: { cacheName: 'financial-api', networkTimeoutSeconds: 6, expiration: { maxEntries: 30, maxAgeSeconds: 300 } }
          }
        ]
      }
    })
  ]
})
