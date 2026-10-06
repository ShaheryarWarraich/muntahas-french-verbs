import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { existsSync, statSync } from 'node:fs';

// Song / lesson videos are dropped into public/video later (song.mp4, final.mp4).
// They are precached for offline use only if every one that exists is under 25 MB; otherwise they load normally.
const MB = 1024 * 1024;
const videoFiles = ['public/video/song.mp4', 'public/video/final.mp4'].filter(f => existsSync(f));
const cacheVideos = videoFiles.length > 0 && videoFiles.every(f => statSync(f).size < 25 * MB);
const exts = 'js,css,html,svg,png,mp3,m4a,json,webmanifest' + (cacheVideos ? ',mp4' : '');

export default defineConfig({
  base: './',
  define: { __BUILD__: JSON.stringify(new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC') },
  server: { port: 5182 },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*', 'audio/*', 'content/*'],
      manifest: {
        name: "Muntaha's French Verbs",
        short_name: 'French Verbs',
        description: 'Learn and practise être and avoir',
        theme_color: '#7a4fc7',
        background_color: '#fffdf7',
        display: 'standalone',
        orientation: 'any',
        start_url: './',
        scope: './',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: [`**/*.{${exts}}`],
        maximumFileSizeToCacheInBytes: (cacheVideos ? 25 : 6) * MB,
        navigateFallback: 'index.html',
      },
    }),
  ],
});
