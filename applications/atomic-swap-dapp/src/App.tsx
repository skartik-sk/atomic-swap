import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiConfig } from 'wagmi'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { Toaster } from 'react-hot-toast'
import { wagmiConfig, chains } from './config/wagmi'
import { AtomicSwapProvider } from './stores/AtomicSwapStore'
import AtomicSwapApp from './components/AtomicSwapApp'
import '@rainbow-me/rainbowkit/styles.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 10, // 10 minutes
    },
  },
})

function App() {
  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider chains={chains}>
        <QueryClientProvider client={queryClient}>
          <AtomicSwapProvider>
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
              <AtomicSwapApp />
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: 'white',
                  },
                }}
              />
            </div>
          </AtomicSwapProvider>
        </QueryClientProvider>
      </RainbowKitProvider>
    </WagmiConfig>
  )
}

export default App
