import React, { useState } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { motion } from 'framer-motion'
import { Zap, ArrowLeftRight, Shield, Layers, Activity, Globe, Sparkles } from 'lucide-react'
import { useAtomicSwap } from '@stores/AtomicSwapStore'
import { AtomicVaultCreator, BilateralSwapInterface, VaultDashboard, SwapProgressTracker } from './index'
import FusionPlusSwapInterface from './FusionPlusSwapInterface'
import { useAccount } from 'wagmi'
import { useCurrentAccount } from '@mysten/dapp-kit'

const AtomicSwapApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'create' | 'swap' | 'fusion'  | 'dashboard'>('fusion')
  const { currentSwap, isEthereumConnected, isSuiConnected } = useAtomicSwap()
const { address: connectedEthAddress } = useAccount()
  const account = useCurrentAccount()
  const tabs = [
    { id: 'fusion', label: 'Fusion+ Swap', icon: Zap, gradient: 'from-yellow-500 to-red-500' },
    { id: 'swap', label: 'Basic Swap', icon: ArrowLeftRight, gradient: 'from-amber-500 to-yellow-500' },
    { id: 'create', label: 'Create Vault', icon: Shield, gradient: 'from-orange-500 to-amber-500' },
    { id: 'dashboard', label: 'Dashboard', icon: Layers, gradient: 'from-red-500 to-orange-500' },
  ]

  return (
    <div className="min-h-screen relative">
      {/* Floating particles animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-orange-500/30 rounded-full"
            animate={{
              x: [0, 100, 0],
              y: [0, -100, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 10 + i,
              repeat: Infinity,
              delay: i * 0.5,
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="border-b border-orange-500/10 backdrop-blur-xl bg-black/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center space-x-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Logo */}
              <motion.div 
                className="relative"
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 p-0.5 atomic-glow">
                  <div className="w-full h-full rounded-2xl bg-black/50 backdrop-blur-sm flex items-center justify-center">
                    <img 
                      src="/logo.png" 
                      alt="Atomic Swap" 
                      className="w-8 h-8 object-contain"
                    />
                  </div>
                </div>
                <motion.div
                  className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>

              <div>
                <motion.h1 
                  className="text-2xl font-bold bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 bg-clip-text text-transparent"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  Atomic Swap Protocol
                </motion.h1>
                <motion.p 
                  className="text-orange-300/80 text-sm flex items-center space-x-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <Globe className="w-3 h-3" />
                  <span>Cross-Chain DeFi Infrastructure</span>
                  <Sparkles className="w-3 h-3 animate-pulse" />
                </motion.p>
              </div>
            </motion.div>

            <div className="flex items-center space-x-6">
              {/* Network Status */}
              <motion.div 
                className="hidden md:flex items-center space-x-4 bg-black/30 backdrop-blur-sm rounded-2xl px-4 py-2 border border-orange-500/20"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <div className="flex items-center space-x-2">
                  <motion.div 
                    className={`w-2 h-2 rounded-full ${connectedEthAddress ? 'bg-emerald-400' : 'bg-red-400'}`}
                    animate={{ scale: connectedEthAddress ? [1, 1.2, 1] : 1 }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <span className="text-gray-300 text-sm font-medium">Ethereum</span>
                </div>
                <div className="w-px h-4 bg-orange-500/30" />
                <div className="flex items-center space-x-2">
                  <motion.div 
                    className={`w-2 h-2 rounded-full ${account?.address ? 'bg-emerald-400' : 'bg-red-400'}`}
                    animate={{ scale: account?.address ? [1, 1.2, 1] : 1 }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <span className="text-gray-300 text-sm font-medium">Sui</span>
                </div>
              </motion.div>

              {/* Activity Indicator */}
              <motion.div
                className="p-2 bg-black/30 backdrop-blur-sm rounded-xl border border-orange-500/20"
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Activity className="w-5 h-5 text-orange-400" />
              </motion.div>

              {/* Connect Button with custom styling */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.9 }}
                className="connect-button-wrapper"
              >
                <ConnectButton.Custom>
                  {({
                    account,
                    chain,
                    openAccountModal,
                    openChainModal,
                    openConnectModal,
                    mounted,
                  }) => {
                    const ready = mounted
                    const connected = ready && account && chain

                    return (
                      <div
                        {...(!ready && {
                          'aria-hidden': true,
                          'style': {
                            opacity: 0,
                            pointerEvents: 'none',
                            userSelect: 'none',
                          },
                        })}
                      >
                        {(() => {
                          if (!connected) {
                            return (
                              <motion.button
                                onClick={openConnectModal}
                                className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold px-6 py-3 rounded-2xl hover:from-orange-600 hover:to-amber-600 transition-all duration-300 shadow-lg hover:shadow-orange-500/25 border border-orange-400/20"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <span className="flex items-center space-x-2">
                                  <Zap className="w-4 h-4" />
                                  <span>Connect Wallet</span>
                                </span>
                              </motion.button>
                            )
                          }

                          if (chain.unsupported) {
                            return (
                              <motion.button
                                onClick={openChainModal}
                                className="bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold px-6 py-3 rounded-2xl hover:from-red-600 hover:to-red-700 transition-all duration-300"
                                whileHover={{ scale: 1.05 }}
                              >
                                Wrong network
                              </motion.button>
                            )
                          }

                          return (
                            <div className="flex items-center space-x-3">
                              <motion.button
                                onClick={openChainModal}
                                className="bg-black/30 backdrop-blur-sm border border-orange-500/20 text-white font-medium px-4 py-2 rounded-xl hover:border-orange-500/40 transition-all duration-300"
                                whileHover={{ scale: 1.05 }}
                              >
                                {chain.hasIcon && (
                                  <div className="w-4 h-4 rounded-full overflow-hidden mr-2 inline-block">
                                    {chain.iconUrl && (
                                      <img
                                        alt={chain.name ?? 'Chain icon'}
                                        src={chain.iconUrl}
                                        className="w-4 h-4"
                                      />
                                    )}
                                  </div>
                                )}
                                {chain.name}
                              </motion.button>

                              <motion.button
                                onClick={openAccountModal}
                                className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold px-6 py-3 rounded-2xl hover:from-orange-600 hover:to-amber-600 transition-all duration-300 shadow-lg hover:shadow-orange-500/25"
                                whileHover={{ scale: 1.05 }}
                              >
                                {account.displayName}
                                {account.displayBalance
                                  ? ` (${account.displayBalance})`
                                  : ''}
                              </motion.button>
                            </div>
                          )
                        })()}
                      </div>
                    )
                  }}
                </ConnectButton.Custom>
              </motion.div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="border-b border-orange-500/10 bg-black/10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-2">
            {tabs.map((tab, index) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`relative flex items-center space-x-3 py-4 px-6 transition-all duration-300 ${
                    isActive
                      ? 'text-white'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  {/* Active tab background */}
                  {isActive && (
                    <motion.div
                      className={`absolute inset-0 bg-gradient-to-r ${tab.gradient} rounded-2xl opacity-10`}
                      layoutId="activeTab"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  
                  {/* Active tab border */}
                  {isActive && (
                    <motion.div
                      className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"
                      layoutId="activeBorder"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  
                  <motion.div
                    className={`p-2 rounded-xl ${isActive ? `bg-gradient-to-r ${tab.gradient}` : 'bg-gray-700/50'}`}
                    whileHover={{ rotate: isActive ? 0 : 5 }}
                  >
                    <Icon className="h-5 w-5" />
                  </motion.div>
                  <span className="font-medium relative z-10">{tab.label}</span>
                  
                  {/* Hover glow effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-amber-500/5 rounded-2xl opacity-0"
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.button>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
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

        {/* Tab Content with enhanced animations */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.95 }}
          transition={{ 
            duration: 0.4, 
            type: "spring", 
            stiffness: 300, 
            damping: 30 
          }}
        >
          {activeTab === 'create' && <AtomicVaultCreator />}
          {activeTab === 'swap' && <BilateralSwapInterface />}
          {activeTab === 'fusion' && <FusionPlusSwapInterface />}
          {activeTab === 'dashboard' && <VaultDashboard />}
        </motion.div>
      </main>

      {/* Enhanced Footer */}
      <footer className="border-t border-orange-500/10 mt-16 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div 
            className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-400 flex items-center space-x-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-4 h-4 text-orange-400" />
                </motion.div>
                <span>© 2025 Atomic Swap Protocol. Next-Gen Cross-Chain Infrastructure.</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              {[
                { label: 'Documentation', href: '#' },
                { label: 'GitHub', href: '#' },
                { label: 'Discord', href: '#' },
                { label: 'Twitter', href: '#' }
              ].map((link, index) => (
                <motion.a
                  key={link.label}
                  href={link.href}
                  className="text-sm text-gray-400 hover:text-orange-400 transition-colors duration-300 relative group"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.4 + index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                >
                  {link.label}
                  <motion.div
                    className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-orange-500 to-amber-500"
                    whileHover={{ width: "100%" }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.a>
              ))}
            </div>
          </motion.div>
          
          {/* Decorative elements */}
          <motion.div
            className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 1.6, duration: 1 }}
          />
        </div>
      </footer>
    </div>
  )
}

export default AtomicSwapApp
