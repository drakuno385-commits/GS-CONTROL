import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
      },
      manifest: {
        name: 'GS-CONTROL App',
        short_name: 'GS-CONTROL',
        description: 'App para controle operacional e supervisão',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        icons: [
          {
            src: 'https://via.placeholder.com/192x192/0f172a/3b82f6?text=GS',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'https://via.placeholder.com/512x512/0f172a/3b82f6?text=GS',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
});
