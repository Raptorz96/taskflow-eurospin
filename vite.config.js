import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/taskflow-eurospin/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      },
      manifest: {
        name: 'TaskFlow Eurospin',
        short_name: 'TaskFlow',
        description: 'Sistema di gestione task per supermercato Eurospin',
        theme_color: '#0066CC',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/taskflow-eurospin/',
        start_url: '/taskflow-eurospin/',
        icons: [
          { 
            src: '/taskflow-eurospin/icon-192.png', 
            sizes: '192x192', 
            type: 'image/png' 
          },
          { 
            src: '/taskflow-eurospin/icon-512.png', 
            sizes: '512x512', 
            type: 'image/png' 
          }
        ]
      }
    })
  ],
})
