import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      includeAssets: ['favicon.svg', 'icons.svg'],
      // Only precaches the app shell (JS/CSS/HTML) so it loads with no signal.
      // Supabase API data is cached/queued separately in src/lib/offline — never
      // add runtimeCaching for the Supabase origin here, it would risk serving
      // stale or cross-account data from the shared workbox cache.
      // Custom src/sw.ts (instead of the default generated worker) adds push
      // notification + notificationclick handling for same-day job assignments.
      manifest: {
        name: 'TradeFlow',
        short_name: 'TradeFlow',
        description: 'Jobs, quotes and invoices for Australian tradies.',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/field',
        icons: [{ src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 8081,
  },
})
