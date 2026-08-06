import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      workbox: {
        // 新版本 service worker 立即激活并接管页面，清理旧预缓存
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        // 不预缓存 html：避免 index.html 被 CacheFirst 缓存导致引用旧的 JS/CSS hash（版本不一致的根因）
        globPatterns: ['**/*.{js,css,svg,png,ico,woff2,webmanifest}'],
        navigateFallback: null,
        runtimeCaching: [
          {
            // 导航请求网络优先：在线时总是拿到最新 index.html（引用最新 hash 的 JS/CSS），离线才回退缓存
            urlPattern: ({ request }: { request: Request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'nav-html',
              networkTimeoutSeconds: 3,
            },
          },
        ],
      },
      manifest: {
        name: '玄英拾光',
        short_name: '玄英拾光',
        description: '个人成长工作台 - 英语学习、读书笔记、运动打卡',
        theme_color: '#4CAF50',
        background_color: '#F1F8E9',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  server: {
    host: '0.0.0.0',
    port: 5173
  }
})
