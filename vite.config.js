import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/reelvault/',
  plugins: [
    vue(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: null,
      includeAssets: ['favicon.ico', 'movies.xlsx'],
      manifest: {
        name: 'ReelVault',
        short_name: 'ReelVault',
        description: 'Your personal movie collection',
        theme_color: '#0a0a0f',
        background_color: '#0a0a0f',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,xlsx}'],
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            urlPattern: /movies\.xlsx$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'data-cache',
              networkTimeoutSeconds: 5,
            }
          },
          {
            urlPattern: /^https:\/\/(image\.tmdb\.org|tse\d\.mm\.bing\.net)\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'poster-cache',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 30
              }
            }
          }
        ]
      }
    })
  ]
})