import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')

  return {
    plugins: [react()],
    server: {
      host: env.VITE_HOST || '0.0.0.0',
      port: Number(env.VITE_PORT || 3000),
      proxy: {
        '/api': {
          target: env.VITE_API_PROXY_TARGET || 'http://localhost:5238',
          changeOrigin: true,
        },
        '/icons': {
          target: env.VITE_API_PROXY_TARGET || 'http://localhost:5238',
          changeOrigin: true,
        },
      },
    },
    preview: {
      host: env.VITE_HOST || '0.0.0.0',
      port: Number(env.VITE_PREVIEW_PORT || 4173),
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            const normalizedId = id.replace(/\\/g, '/')

            if (!normalizedId.includes('/node_modules/')) {
              return undefined
            }

            if (normalizedId.includes('/node_modules/react-pdf/') || normalizedId.includes('/node_modules/pdfjs-dist/')) {
              return 'vendor-pdf'
            }

            if (normalizedId.includes('/node_modules/recharts/') || normalizedId.includes('/node_modules/d3-')) {
              return 'vendor-charts'
            }

            if (normalizedId.includes('/node_modules/@mui/') || normalizedId.includes('/node_modules/@emotion/')) {
              return 'vendor-mui'
            }

            if (normalizedId.includes('/node_modules/@tanstack/')) {
              return 'vendor-query'
            }

            if (
              normalizedId.includes('/node_modules/react/') ||
              normalizedId.includes('/node_modules/react-dom/') ||
              normalizedId.includes('/node_modules/react-router/') ||
              normalizedId.includes('/node_modules/@remix-run/') ||
              normalizedId.includes('/node_modules/scheduler/')
            ) {
              return 'vendor-react'
            }

            if (
              normalizedId.includes('/node_modules/axios/') ||
              normalizedId.includes('/node_modules/dompurify/') ||
              normalizedId.includes('/node_modules/zod/')
            ) {
              return 'vendor-core'
            }

            return undefined
          },
        },
      },
      sourcemap: mode !== 'production',
    },
  }
})
