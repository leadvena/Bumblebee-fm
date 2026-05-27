import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024 // 5 MiB
        },
        includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
        manifest: {
          name: 'BUMBLEBEE Voice Assistant Music Player',
          short_name: 'BUMBLEBEE',
          description: 'Hands-free retro pixel-art AI voice companion music player',
          theme_color: '#D4A017',
          background_color: '#0F0A00',
          display: 'standalone',
          orientation: 'portrait',
          icons: [
            {
              src: 'https://images.unsplash.com/photo-1589578528410-b3e15f606821?w=192&h=192&fit=crop',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'https://images.unsplash.com/photo-1589578528410-b3e15f606821?w=512&h=512&fit=crop',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
