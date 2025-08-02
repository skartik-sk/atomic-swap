import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'safe-wallet-stub',
      resolveId(id) {
        if (id === '@safe-globalThis/safe-apps-provider') {
          return 'virtual:safe-apps-provider'
        }
        if (id === '@safe-globalThis/safe-apps-sdk') {
          return 'virtual:safe-apps-sdk'
        }
      },
      load(id) {
        if (id === 'virtual:safe-apps-provider') {
          return `
            export class SafeAppProvider {
              constructor() {}
              connect() { return Promise.resolve() }
              disconnect() { return Promise.resolve() }
            }
            export default SafeAppProvider
          `
        }
        if (id === 'virtual:safe-apps-sdk') {
          return `
            export default class SafeAppsSDK {
              constructor() {}
              getSafeInfo() { return Promise.resolve({}) }
              getSafeAddress() { return Promise.resolve('') }
            }
          `
        }
      }
    }
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@types': path.resolve(__dirname, './src/types'),
      '@assets': path.resolve(__dirname, './src/assets'),
    },
  },
  define: {
    global: 'globalThis',
  },
  server: {
    port: 3000,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ethereum: ['ethers', 'wagmi', '@rainbow-me/rainbowkit'],
          ui: ['framer-motion', 'lucide-react', 'recharts'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'ethers'],
  },
})
