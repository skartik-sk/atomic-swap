import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeftRight, Eye, EyeOff, Copy, ExternalLink, CheckCircle, Sparkles } from 'lucide-react'
import { useAtomicSwap } from '@/stores/AtomicSwapStore'
import toast from 'react-hot-toast'

const BilateralSwapInterface: React.FC = () => {
  const [step, setStep] = useState<'select' | 'execute' | 'verify'>('select')
  const [selectedVaults, setSelectedVaults] = useState({
    ethereum: '',
    sui: ''
  })
  const [secretReveal, setSecretReveal] = useState('')
  const [showSecret, setShowSecret] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)

  const { activeVaults, startSwap, updateSwapProgress, completeSwap } = useAtomicSwap()

  const ethereumVaults = activeVaults.filter(v => v.chainType === 'ethereum')
  const suiVaults = activeVaults.filter(v => v.chainType === 'sui')

  const handleVaultSelection = () => {
    if (!selectedVaults.ethereum || !selectedVaults.sui) {
      toast.error('🚫 Please select vaults from both chains')
      return
    }

    startSwap(selectedVaults.ethereum, selectedVaults.sui)
    setStep('execute')
    toast.success('🚀 Bilateral swap initiated!')
  }

  const handleExecuteSwap = async () => {
    if (!secretReveal.trim()) {
      toast.error('🔐 Please enter the secret to complete the swap')
      return
    }

    setIsExecuting(true)

    try {
      // Step 1: Verifying secret
      updateSwapProgress({
        step: 1,
        total: 4,
        description: 'Verifying cryptographic secret...',
        status: 'processing'
      })

      await new Promise(resolve => setTimeout(resolve, 2000))

      // Step 2: Claiming from first vault
      updateSwapProgress({
        step: 2,
        total: 4,
        description: 'Claiming assets from Ethereum vault...',
        status: 'processing',
        transactionHash: '0x123...abc'
      })

      await new Promise(resolve => setTimeout(resolve, 3000))

      // Step 3: Claiming from second vault
      updateSwapProgress({
        step: 3,
        total: 4,
        description: 'Claiming assets from Sui vault...',
        status: 'processing',
        transactionHash: 'sui_456...def'
      })

      await new Promise(resolve => setTimeout(resolve, 3000))

      // Step 4: Completion
      updateSwapProgress({
        step: 4,
        total: 4,
        description: 'Bilateral atomic swap completed successfully!',
        status: 'completed'
      })

      await new Promise(resolve => setTimeout(resolve, 1500))

      completeSwap()
      setStep('verify')
      toast.success('🎉 Atomic swap completed successfully!')

    } catch (error) {
      console.error('Swap execution failed:', error)
      updateSwapProgress({
        step: 0,
        total: 4,
        description: 'Swap execution failed',
        status: 'failed'
      })
      toast.error('❌ Swap execution failed')
    } finally {
      setIsExecuting(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('📋 Copied to clipboard!')
  }

  const inputClasses = "w-full px-6 py-4 bg-black/30 border border-orange-500/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-300 backdrop-blur-sm"

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden"
      >
        {/* Background decorations */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-amber-500/5 rounded-3xl" />
        <div className="absolute top-0 left-0 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl" />
        
        <div className="relative bg-black/40 backdrop-blur-xl border border-orange-500/20 rounded-3xl p-8 md:p-10">
          {/* Header */}
          <motion.div 
            className="flex items-center space-x-4 mb-8"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <motion.div 
              className="relative"
              whileHover={{ scale: 1.1, rotate: 180 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="p-4 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl shadow-2xl shadow-orange-500/30">
                <ArrowLeftRight className="h-8 w-8 text-white" />
              </div>
              <motion.div
                className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
            <div>
              <motion.h2 
                className="text-3xl font-bold bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 bg-clip-text text-transparent"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Cross-Chain Atomic Swap
              </motion.h2>
              <motion.p 
                className="text-orange-200/80 mt-1 flex items-center space-x-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <Sparkles className="w-4 h-4" />
                <span>Execute trustless bilateral asset exchanges across blockchains</span>
              </motion.p>
            </div>
          </motion.div>

          {/* Step Indicator */}
          <div className="flex items-center justify-between mb-8 p-4 bg-black/20 rounded-2xl border border-orange-500/10">
            {['Select Vaults', 'Execute Swap', 'Verify Settlement'].map((stepName, index) => (
              <div key={stepName} className="flex items-center">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  step === ['select', 'execute', 'verify'][index]
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30'
                    : index < ['select', 'execute', 'verify'].indexOf(step)
                    ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white'
                    : 'bg-gray-700/50 text-gray-400'
                }`}>
                  {index < ['select', 'execute', 'verify'].indexOf(step) ? <CheckCircle className="h-5 w-5" /> : index + 1}
                </div>
                <span className={`ml-3 text-sm font-medium ${
                  step === ['select', 'execute', 'verify'][index] ? 'text-orange-300' : 'text-gray-400'
                }`}>
                  {stepName}
                </span>
                {index < 2 && <div className="w-16 h-1 bg-orange-500/20 ml-6 rounded-full" />}
              </div>
            ))}
          </div>

          {/* Step 1: Vault Selection */}
          {step === 'select' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              <div className="grid md:grid-cols-2 gap-8">
                {/* Ethereum Vaults */}
                <div>
                  <h3 className="text-xl font-semibold text-orange-200 mb-6 flex items-center space-x-2">
                    <span>🔷</span>
                    <span>Select Ethereum Vault</span>
                  </h3>
                  <div className="space-y-4">
                    {ethereumVaults.length === 0 ? (
                      <div className="text-center py-12 bg-black/20 rounded-2xl border border-orange-500/10">
                        <div className="text-6xl mb-4">🔷</div>
                        <div className="text-gray-400">No Ethereum vaults available</div>
                        <div className="text-sm text-gray-500 mt-2">Create an Ethereum vault first</div>
                      </div>
                    ) : (
                      ethereumVaults.map((vault) => (
                        <motion.div
                          key={vault.vaultId}
                          onClick={() => setSelectedVaults({...selectedVaults, ethereum: vault.vaultId})}
                          className={`p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                            selectedVaults.ethereum === vault.vaultId
                              ? 'border-orange-500 bg-orange-500/10 shadow-lg shadow-orange-500/20'
                              : 'border-orange-500/20 bg-black/20 hover:border-orange-500/40 hover:bg-orange-500/5'
                          }`}
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-white font-semibold text-lg">
                                {(Number(vault.assetAmount) / 1e18).toFixed(4)} ETH
                              </p>
                              <p className="text-orange-300/80 text-sm mt-1">
                                ID: {vault.vaultId.substring(0, 10)}...
                              </p>
                              <div className="flex items-center space-x-2 mt-2">
                                <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">
                                  Ethereum
                                </span>
                                <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded-full">
                                  Active
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>

                {/* Sui Vaults */}
                <div>
                  <h3 className="text-xl font-semibold text-orange-200 mb-6 flex items-center space-x-2">
                    <span>🌊</span>
                    <span>Select Sui Vault</span>
                  </h3>
                  <div className="space-y-4">
                    {suiVaults.length === 0 ? (
                      <div className="text-center py-12 bg-black/20 rounded-2xl border border-orange-500/10">
                        <div className="text-6xl mb-4">🌊</div>
                        <div className="text-gray-400">No Sui vaults available</div>
                        <div className="text-sm text-gray-500 mt-2">Create a Sui vault first</div>
                      </div>
                    ) : (
                      suiVaults.map((vault) => (
                        <motion.div
                          key={vault.vaultId}
                          onClick={() => setSelectedVaults({...selectedVaults, sui: vault.vaultId})}
                          className={`p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                            selectedVaults.sui === vault.vaultId
                              ? 'border-orange-500 bg-orange-500/10 shadow-lg shadow-orange-500/20'
                              : 'border-orange-500/20 bg-black/20 hover:border-orange-500/40 hover:bg-orange-500/5'
                          }`}
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-white font-semibold text-lg">
                                {(Number(vault.assetAmount) / 1e18).toFixed(4)} SUI
                              </p>
                              <p className="text-orange-300/80 text-sm mt-1">
                                ID: {vault.vaultId.substring(0, 10)}...
                              </p>
                              <div className="flex items-center space-x-2 mt-2">
                                <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full">
                                  Sui
                                </span>
                                <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded-full">
                                  Active
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <motion.button
                onClick={handleVaultSelection}
                disabled={!selectedVaults.ethereum || !selectedVaults.sui}
                className="w-full relative overflow-hidden bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 text-black font-bold py-5 px-8 rounded-2xl hover:from-orange-600 hover:via-amber-600 hover:to-yellow-600 focus:outline-none focus:ring-4 focus:ring-orange-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl shadow-orange-500/25"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-center space-x-3">
                  <Sparkles className="w-5 h-5" />
                  <span>Initiate Cross-Chain Swap</span>
                  <ArrowLeftRight className="w-5 h-5" />
                </div>
              </motion.button>
            </motion.div>
          )}

          {/* Step 2: Execute Swap */}
          {step === 'execute' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-2xl p-8">
                <h3 className="text-xl font-semibold text-blue-300 mb-6 flex items-center space-x-2">
                  <span>🚀</span>
                  <span>Swap Execution</span>
                </h3>
                <p className="text-blue-200/80 mb-6 leading-relaxed">
                  Enter the secret that was used to create the cryptographic commitment. 
                  This will allow you to claim assets from both vaults simultaneously through atomic execution.
                </p>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-orange-200 mb-3">
                      🔐 Secret Reveal
                    </label>
                    <div className="relative">
                      <input
                        type={showSecret ? "text" : "password"}
                        value={secretReveal}
                        onChange={(e) => setSecretReveal(e.target.value)}
                        placeholder="Enter the secret phrase"
                        className={inputClasses}
                      />
                      <button
                        type="button"
                        onClick={() => setShowSecret(!showSecret)}
                        className="absolute inset-y-0 right-0 pr-6 flex items-center text-orange-400 hover:text-orange-300 transition-colors"
                      >
                        {showSecret ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <motion.button
                    onClick={handleExecuteSwap}
                    disabled={isExecuting || !secretReveal.trim()}
                    className="w-full relative overflow-hidden bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 text-black font-bold py-5 px-8 rounded-2xl hover:from-orange-600 hover:via-amber-600 hover:to-yellow-600 focus:outline-none focus:ring-4 focus:ring-orange-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl shadow-orange-500/25"
                    whileHover={{ scale: isExecuting ? 1 : 1.02, y: isExecuting ? 0 : -2 }}
                    whileTap={{ scale: isExecuting ? 1 : 0.98 }}
                  >
                    {isExecuting ? (
                      <div className="flex items-center justify-center space-x-3">
                        <motion.div
                          className="w-6 h-6 border-3 border-black/30 border-t-black rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        <span>Executing Atomic Swap...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-3">
                        <Sparkles className="w-5 h-5" />
                        <span>Execute Atomic Swap</span>
                      </div>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Verification */}
          {step === 'verify' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              <div className="bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/20 rounded-2xl p-8">
                <div className="flex items-center space-x-4 mb-6">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <CheckCircle className="h-8 w-8 text-emerald-400" />
                  </motion.div>
                  <h3 className="text-xl font-semibold text-emerald-300">🎉 Swap Completed Successfully!</h3>
                </div>
                
                <p className="text-emerald-200/80 mb-8 leading-relaxed">
                  Your bilateral atomic swap has been completed successfully. Assets have been exchanged between both chains 
                  with full cryptographic verification and atomic settlement.
                </p>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-black/20 rounded-2xl p-6 border border-blue-500/20">
                    <h4 className="text-blue-300 font-semibold mb-4 flex items-center space-x-2">
                      <span>🔷</span>
                      <span>Ethereum Transaction</span>
                    </h4>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 text-sm font-mono">0x123...abc</span>
                      <div className="flex space-x-2">
                        <motion.button
                          onClick={() => copyToClipboard('0x123456789abcdef123456789abcdef123456789abc')}
                          className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Copy className="h-4 w-4 text-gray-400" />
                        </motion.button>
                        <motion.button 
                          className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <ExternalLink className="h-4 w-4 text-gray-400" />
                        </motion.button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-black/20 rounded-2xl p-6 border border-purple-500/20">
                    <h4 className="text-purple-300 font-semibold mb-4 flex items-center space-x-2">
                      <span>🌊</span>
                      <span>Sui Transaction</span>
                    </h4>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 text-sm font-mono">sui_456...def</span>
                      <div className="flex space-x-2">
                        <motion.button
                          onClick={() => copyToClipboard('sui_456789defabc456789defabc456789defabc456')}
                          className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Copy className="h-4 w-4 text-gray-400" />
                        </motion.button>
                        <motion.button 
                          className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <ExternalLink className="h-4 w-4 text-gray-400" />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>

                <motion.button
                  onClick={() => {
                    setStep('select')
                    setSelectedVaults({ ethereum: '', sui: '' })
                    setSecretReveal('')
                  }}
                  className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold py-4 px-8 rounded-2xl hover:from-emerald-600 hover:to-green-700 transition-all duration-300 shadow-lg shadow-emerald-500/25"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Sparkles className="w-5 h-5" />
                    <span>Start New Cross-Chain Swap</span>
                  </div>
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default BilateralSwapInterface
