import React, { useState } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { motion } from 'framer-motion'
import { Zap, ArrowLeftRight, Shield, Layers } from 'lucide-react'
import { useAtomicSwap } from '@/stores/AtomicSwapStore'
import AtomicVaultCreator from './AtomicVaultCreator'
import BilateralSwapInterface from './BilateralSwapInterface'
import VaultDashboard from './VaultDashboard'
import SwapProgressTracker from './SwapProgressTracker'

const AtomicSwapApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'create' | 'swap' | 'dashboard'>('create')
  const { currentSwap, isEthereumConnected, isSuiConnected } = useAtomicSwap()

  const tabs = [
    { id: 'create', label: 'Create Vault', icon: Shield },
    { id: 'swap', label: 'Bilateral Swap', icon: ArrowLeftRight },
    { id: 'dashboard', label: 'Dashboard', icon: Layers },
  ]

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center space-x-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <div>
                                <h1 className="text-2xl font-bold text-white">Atomic Swap Protocol</h1>
                <p className="text-blue-200 text-sm">Advanced Cross-Chain Infrastructure</p>
              </div>
            </motion.div>

            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${isEthereumConnected ? 'bg-green-400' : 'bg-red-400'}`} />
                <span className="text-gray-300">Ethereum</span>
                <div className={`w-2 h-2 rounded-full ${isSuiConnected ? 'bg-green-400' : 'bg-red-400'}`} />
                <span className="text-gray-300">Sui</span>
              </div>
              <ConnectButton />
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Swap Progress Tracker */}
        {currentSwap.progress && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <SwapProgressTracker />
          </motion.div>
        )}

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'create' && <AtomicVaultCreator />}
          {activeTab === 'swap' && <BilateralSwapInterface />}
          {activeTab === 'dashboard' && <VaultDashboard />}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              © 2024 Atomic Swap Protocol. Advanced Cross-Chain Infrastructure.
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <a href="#" className="hover:text-gray-300 transition-colors">Documentation</a>
              <a href="#" className="hover:text-gray-300 transition-colors">GitHub</a>
              <a href="#" className="hover:text-gray-300 transition-colors">Discord</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default AtomicSwapApp
