import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeftRight, 
  Zap, 
  Settings, 
  TrendingUp, 
  Shield, 
  Timer,
  DollarSign,
  Activity,
  BarChart3,
  Sparkles,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  Clock,
  Globe,
  Copy
} from 'lucide-react'
import { useAccount, useWalletClient } from 'wagmi'
import { useFusionPlusSwap } from '../hooks/useFusionPlusSwap'
import { useBidirectionalSwap } from '../hooks/useBidirectionalSwap'
import { useSuiWallet } from '../hooks/useSuiWallet'
import { useCurrentAccount, useWallets } from '@mysten/dapp-kit'
import { useDisconnectWallet, useConnectWallet } from '@mysten/dapp-kit'
import FusionLogsViewer from './FusionLogsViewer'
import toast from 'react-hot-toast'
import { sendETHToStaticAddress } from '@/services/trasection'
import { sendSUIToStaticAddress } from '@/services/suiTransaction'

const FusionPlusSwapInterface: React.FC = () => {
  const [swapDirection, setSwapDirection] = useState<'eth-to-sui' | 'sui-to-eth'>('eth-to-sui')
  const [amount, setAmount] = useState('')
  const [targetAddress, setTargetAddress] = useState('') // Changed from suiAddress to targetAddress
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)
  const [showLogs, setShowLogs] = useState(true)

  // Ethereum wallet connection
  const { address: connectedEthAddress } = useAccount()
  const { data: walletClient } = useWalletClient()
  
  // SUI wallet connection
  const suiWallet = useSuiWallet()
  const currentSuiAccount = useCurrentAccount()
  const { mutate: disconnectSuiWallet } = useDisconnectWallet()
  const { mutate: connectSuiWallet } = useConnectWallet()
  const wallets = useWallets()
  
  // Use both hooks for comprehensive functionality
  const fusionHook = useFusionPlusSwap()
  const bidirectionalHook = useBidirectionalSwap()
  
  // Unified state from both hooks
  const isExecuting = fusionHook.isExecuting || bidirectionalHook.isLoading
  const executionLogs = [...(fusionHook.executionLogs || []), ...(bidirectionalHook.executionLogs || [])]
  const lastResult = fusionHook.lastResult || bidirectionalHook.lastResult
  const currentStep = bidirectionalHook.currentStep || ''
  
  // Unified log statistics
  const totalLogs = executionLogs.length
  const successCount = executionLogs.filter((log: any) => log.level === 'success').length
  const errorCount = executionLogs.filter((log: any) => log.level === 'error').length
  const warningCount = executionLogs.filter((log: any) => log.level === 'warning').length
  
  // Reset form when direction changes
  useEffect(() => {
    setAmount('')
    fusionHook.resetState?.()
    bidirectionalHook.resetState?.()
  }, [swapDirection])
  
  const handleSwap = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('🚫 Please enter a valid amount')
      return
    }

    // Additional amount validation
    const numAmount = parseFloat(amount)
    if (swapDirection === 'sui-to-eth' && numAmount < 0.01) {
      toast.error('🚫 Minimum SUI amount is 0.01 SUI for transaction fees')
      return
    }
    if (swapDirection === 'eth-to-sui' && numAmount < 0.0001) {
      toast.error('🚫 Minimum ETH amount is 0.0001 ETH')
      return
    }
    
    if (!targetAddress.trim()) {
      toast.error(`🚫 Please enter a ${swapDirection === 'eth-to-sui' ? 'Sui' : 'Ethereum'} address`)
      return
    }
    
    // Check wallet connections based on swap direction
    if (swapDirection === 'eth-to-sui') {
      if (!connectedEthAddress) {
        toast.error('🚫 Please connect your Ethereum wallet')
        return
      }
      if (!walletClient) {
        toast.error('🚫 Ethereum wallet client not available')
        return
      }
    } else {
      if (!currentSuiAccount) {
        toast.error('🚫 Please connect your SUI wallet')
        return
      }

      // Check SUI balance
      const currentBalance = parseFloat(suiWallet.balance || '0')
      console.log(`💰 Balance check: current=${currentBalance}, needed=${numAmount}, total with gas=${numAmount + 0.005}`)
      
      if (currentBalance < numAmount) {
        toast.error(`💰 Insufficient SUI balance. Have: ${currentBalance} SUI, Need: ${numAmount} SUI`)
        return
      }
      
      // Check for sufficient gas (reduced to 0.005 SUI for gas fees)
      if (currentBalance < numAmount + 0.005) {
        toast.error(`⛽ Insufficient SUI for gas fees. Need at least ${(numAmount + 0.005).toFixed(3)} SUI total`)
        return
      }
    }

    toast.success(`🚀 Starting ${swapDirection === 'eth-to-sui' ? 'ETH → SUI' : 'SUI → ETH'} enhanced swap!`)
    
    try {
      setShowLogs(true)

      // Use the bidirectional swap service for actual execution
      if (swapDirection === 'eth-to-sui') {
        // Send ETH to static address for ETH → SUI swaps
        toast.success('🔷 Sending ETH to static address...')
        await sendETHToStaticAddress(walletClient!, amount)
        await bidirectionalHook.executeEthToSuiSwap(amount, connectedEthAddress!, targetAddress)
      } else {
        // Send SUI to static address for SUI → ETH swaps
        toast.success('🌊 Sending SUI to static address...')
        
        // Refresh balance before transaction
        await suiWallet.updateBalance()
        
        console.log(`🔍 Debug Info:`)
        console.log(`  - Amount to send: ${amount} SUI`)
        console.log(`  - Current balance: ${suiWallet.balance} SUI`)
        console.log(`  - Account address: ${currentSuiAccount?.address}`)
        console.log(`  - Amount in MIST: ${parseFloat(amount) * 1e9}`)
        
        await sendSUIToStaticAddress(suiWallet.executeTransaction, amount)
        await bidirectionalHook.executeSuiToEthSwap(amount, currentSuiAccount?.address || '', targetAddress)
      }
    } catch (error: any) {
      console.error('Swap execution failed:', error)
      
      // Provide more specific error messages
      let errorMessage = 'Swap execution failed'
      if (error?.message?.includes('insufficient funds')) {
        errorMessage = '💰 Insufficient funds. Please check your wallet balance.'
      } else if (error?.message?.includes('rejected')) {
        errorMessage = '🚫 Transaction rejected by user'
      } else if (error?.message) {
        errorMessage = `Error: ${error.message}`
      }
      
      toast.error(errorMessage)
    }
  }
  
  const swapDirections = () => {
    setSwapDirection(swapDirection === 'eth-to-sui' ? 'sui-to-eth' : 'eth-to-sui')
    setAmount('')
    setTargetAddress('')
    toast(`🔄 Switched to ${swapDirection === 'eth-to-sui' ? 'SUI → ETH' : 'ETH → SUI'} mode`, { 
      icon: '🔄',
      style: { background: '#1f2937', color: '#f3f4f6' }
    })
  }
  
  const clearLogs = () => {
    fusionHook.clearLogs?.()
    bidirectionalHook.clearLogs?.()
  }
  
  const resetState = () => {
    fusionHook.resetState?.()
    bidirectionalHook.resetState?.()
    setAmount('')
    setTargetAddress('')
  }
  
  const getEstimatedOutput = () => {
    if (!amount || parseFloat(amount) <= 0) return '0'
    
    const inputAmount = parseFloat(amount)
    if (swapDirection === 'eth-to-sui') {
      return (inputAmount * 1000).toFixed(4) // 1 ETH = 1000 SUI (demo rate)
    } else {
      return (inputAmount * 0.001).toFixed(6) // 1 SUI = 0.001 ETH (demo rate)
    }
  }
  
  const getProgressPercentage = () => {
    if (!isExecuting && !lastResult) return 0
    if (lastResult?.success) return 100
    if (errorCount > 0) return 0
    
    // Estimate progress based on successful steps
    const totalExpectedSteps = 8
    const progressPercentage = Math.min((successCount / totalExpectedSteps) * 100, 90)
    return isExecuting ? progressPercentage : 100
  }
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'error': return <XCircle className="w-4 h-4 text-red-400" />
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-400" />
      default: return <Info className="w-4 h-4 text-blue-400" />
    }
  }
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('📋 Copied to clipboard!')
  }
  
  const inputClasses = "w-full px-6 py-4 bg-black/30 border border-orange-500/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-300 backdrop-blur-sm"
  
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Main Swap Interface */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-amber-500/5 rounded-3xl" />
        <div className="absolute top-0 left-0 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl" />
        
        <div className="relative bg-black/40 backdrop-blur-xl border border-orange-500/20 rounded-3xl p-8 md:p-10">
          {/* Header */}
          <motion.div 
            className="flex items-center justify-between mb-8"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center space-x-4">
              <motion.div 
                className="relative"
                whileHover={{ scale: 1.1, rotate: 180 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="p-4 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl shadow-2xl shadow-orange-500/30">
                  <Zap className="h-8 w-8 text-white" />
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
                  Fusion+ Enhanced Swap
                </motion.h2>
                <motion.p 
                  className="text-orange-200/80 mt-1 flex items-center space-x-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Advanced cross-chain swaps with Dutch auctions, safety deposits & finality locks</span>
                </motion.p>
              </div>
            </div>
            
            <motion.button
              onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
              className="p-3 bg-black/30 backdrop-blur-sm rounded-xl border border-orange-500/20 hover:border-orange-500/40 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Settings className="w-6 h-6 text-orange-400" />
            </motion.button>
          </motion.div>
          
          {/* Advanced Features Info */}
          {showAdvancedSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 grid md:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
                <TrendingUp className="w-8 h-8 text-blue-400 mb-2" />
                <h4 className="text-blue-300 font-semibold text-sm mb-1">Dutch Auction</h4>
                <p className="text-blue-200/80 text-xs">Dynamic pricing with time-based rate optimization</p>
              </div>
              
              <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4">
                <Shield className="w-8 h-8 text-green-400 mb-2" />
                <h4 className="text-green-300 font-semibold text-sm mb-1">Safety Deposits</h4>
                <p className="text-green-200/80 text-xs">10% safety deposits with resolver incentives</p>
              </div>
              
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4">
                <Timer className="w-8 h-8 text-purple-400 mb-2" />
                <h4 className="text-purple-300 font-semibold text-sm mb-1">Finality Locks</h4>
                <p className="text-purple-200/80 text-xs">64-block finality with conditional secret sharing</p>
              </div>
              
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4">
                <BarChart3 className="w-8 h-8 text-orange-400 mb-2" />
                <h4 className="text-orange-300 font-semibold text-sm mb-1">Gas Optimization</h4>
                <p className="text-orange-200/80 text-xs">Volatility-aware gas price adjustments</p>
              </div>
            </motion.div>
          )}
          
          {/* Swap Form */}
          <div className="space-y-6">
            {/* From Section */}
            <div className="bg-black/20 rounded-2xl p-6 border border-orange-500/10">
              <div className="flex items-center justify-between mb-4">
                <label className="text-orange-200 font-semibold flex items-center space-x-2">
                  <DollarSign className="w-5 h-5" />
                  <span>From</span>
                </label>
                <div className="flex items-center space-x-2">
                  <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">
                    {swapDirection === 'eth-to-sui' ? 'Ethereum' : 'Sui'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Enter ${swapDirection === 'eth-to-sui' ? 'ETH' : 'SUI'} amount`}
                  className={inputClasses}
                  step="0.0001"
                  min="0"
                />
                <div className="text-white font-semibold text-lg min-w-fit">
                  {swapDirection === 'eth-to-sui' ? 'ETH' : 'SUI'}
                </div>
              </div>
            </div>
            
            {/* Swap Direction Button */}
            <div className="flex justify-center">
              <motion.button
                onClick={swapDirections}
                className="p-4 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl hover:from-orange-600 hover:to-amber-600 transition-all duration-300 shadow-lg hover:shadow-orange-500/25"
                whileHover={{ scale: 1.1, rotate: 180 }}
                whileTap={{ scale: 0.9 }}
              >
                <ArrowLeftRight className="w-6 h-6 text-white" />
              </motion.button>
            </div>
            
            {/* To Section */}
            <div className="bg-black/20 rounded-2xl p-6 border border-orange-500/10">
              <div className="flex items-center justify-between mb-4">
                <label className="text-orange-200 font-semibold flex items-center space-x-2">
                  <DollarSign className="w-5 h-5" />
                  <span>To</span>
                </label>
                <div className="flex items-center space-x-2">
                  <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full">
                    {swapDirection === 'eth-to-sui' ? 'Sui' : 'Ethereum'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex-1 px-6 py-4 bg-black/30 border border-orange-500/20 rounded-2xl text-gray-400">
                  {amount ? (
                    <span className="text-white">
                      ≈ {getEstimatedOutput()}
                    </span>
                  ) : (
                    'Amount will be calculated'
                  )}
                </div>
                <div className="text-white font-semibold text-lg min-w-fit">
                  {swapDirection === 'eth-to-sui' ? 'SUI' : 'ETH'}
                </div>
              </div>
            </div>
            
            {/* Dynamic Wallet Connection and Address Input */}
            {swapDirection === 'eth-to-sui' ? (
              <>
                {/* Target SUI Address Input */}
                <div className="bg-black/20 rounded-2xl p-6 border border-orange-500/10">
                  <label className="text-orange-200 font-semibold mb-4 flex items-center space-x-2">
                    <span>🌊</span>
                    <span>Target Sui Address</span>
                  </label>
                  <input
                    type="text"
                    value={targetAddress}
                    onChange={(e) => setTargetAddress(e.target.value)}
                    placeholder="Enter destination Sui wallet address (0x...)"
                    className={inputClasses}
                  />
                </div>
                
                {/* Connected Ethereum Address Display */}
                {connectedEthAddress && (
                  <div className="bg-black/20 rounded-2xl p-6 border border-orange-500/10">
                    <label className="text-orange-200 font-semibold mb-4 flex items-center space-x-2">
                      <span>🔷</span>
                      <span>Source: Connected Ethereum Address</span>
                    </label>
                    <div className="px-6 py-4 bg-black/30 border border-orange-500/20 rounded-2xl text-orange-300 font-mono">
                      {connectedEthAddress}
                    </div>
                   
                  </div>
                )}
              </>
            ) : (
              <>
                {/* SUI Wallet Connection */}
                <div className="bg-black/20 rounded-2xl p-6 border border-orange-500/10">
                  <label className="text-orange-200 font-semibold mb-4 flex items-center space-x-2">
                    <span>🌊</span>
                    <span>Source: SUI Wallet</span>
                  </label>
                  
                  {currentSuiAccount ? (
                    <div className="space-y-3">
                      <div className="px-6 py-4 bg-black/30 border border-orange-500/20 rounded-2xl text-orange-300 font-mono">
                        {currentSuiAccount.address}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-400">
                          Balance: {suiWallet.balance} SUI
                        </div>
                        <motion.button
                          onClick={() => {
                            disconnectSuiWallet(
                              undefined,
                              {
                                onSuccess: () => {
                                  toast.success('🌊 SUI wallet disconnected successfully')
                                },
                                onError: (error) => {
                                  toast.error('Failed to disconnect SUI wallet')
                                  console.error('SUI wallet disconnect error:', error)
                                }
                              }
                            )
                          }}
                          className="px-4 py-2 bg-red-500/20 text-red-300 rounded-xl hover:bg-red-500/30 transition-colors border border-red-500/20 text-sm"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Disconnect
                        </motion.button>
                      </div>
                   
                    </div>
                  ) : (
                    <motion.button
                      onClick={() => {
                        // Get the first available wallet
                        const firstWallet = wallets[0]
                        if (!firstWallet) {
                          toast.error('No SUI wallets detected. Please install a SUI wallet extension.')
                          return
                        }
                        
                        console.log('Attempting to connect to wallet:', firstWallet.name)
                        connectSuiWallet(
                          { wallet: firstWallet },
                          {
                            onSuccess: (result) => {
                              toast.success('🌊 SUI wallet connected successfully!')
                              console.log('SUI wallet connected:', result)
                            },
                            onError: (error) => {
                              toast.error('Failed to connect SUI wallet')
                              console.error('SUI wallet connection error:', error)
                            }
                          }
                        )
                      }}
                      className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold px-6 py-3 rounded-2xl hover:from-orange-600 hover:to-amber-600 transition-all duration-300 shadow-lg hover:shadow-orange-500/25 border border-orange-400/20 w-full"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                    >
                      <div className="flex items-center justify-center space-x-3">
                        <span>🌊</span>
                        <span>Connect SUI Wallet</span>
                        <Sparkles className="w-5 h-5" />
                      </div>
                    </motion.button>
                  )}
                </div>

                {/* Target Ethereum Address Input */}
                <div className="bg-black/20 rounded-2xl p-6 border border-orange-500/10">
                  <label className="text-orange-200 font-semibold mb-4 flex items-center space-x-2">
                    <span>🔷</span>
                    <span>Target Ethereum Address</span>
                  </label>
                  <input
                    type="text"
                    value={targetAddress}
                    onChange={(e) => setTargetAddress(e.target.value)}
                    placeholder="Enter destination Ethereum wallet address (0x...)"
                    className={inputClasses}
                  />
                </div>
              </>
            )}
            
            {/* Execute Button */}
            <motion.button
              onClick={handleSwap}
              disabled={isExecuting || !amount || !targetAddress.trim()}
              className="w-full relative overflow-hidden bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 text-black font-bold py-6 px-8 rounded-2xl hover:from-orange-600 hover:via-amber-600 hover:to-yellow-600 focus:outline-none focus:ring-4 focus:ring-orange-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl shadow-orange-500/25"
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
                  <span>Executing Fusion+ Swap...</span>
                  <Activity className="w-5 h-5" />
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-3">
                  <Zap className="w-6 h-6" />
                  <span>Execute Fusion+ Enhanced Swap</span>
                  <Sparkles className="w-5 h-5" />
                </div>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
      
      {/* Progress and Status Panel */}
      {(isExecuting || lastResult || executionLogs.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/40 backdrop-blur-xl border border-orange-500/20 rounded-3xl p-8"
        >
          <h3 className="text-xl font-bold text-orange-200 mb-6 flex items-center space-x-3">
            <Activity className="w-6 h-6" />
            <span>Swap Progress & Status</span>
          </h3>
          
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-orange-300">Progress</span>
              <span className="text-sm text-orange-400">{Math.round(getProgressPercentage())}%</span>
            </div>
            <div className="w-full bg-black/30 rounded-full h-3 border border-orange-500/20">
              <motion.div
                className={`h-full rounded-full transition-all duration-500 ${
                  lastResult?.success ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 
                  errorCount > 0 ? 'bg-gradient-to-r from-red-500 to-red-600' : 
                  'bg-gradient-to-r from-orange-500 to-amber-500'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${getProgressPercentage()}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Current Step */}
          {currentStep && (
            <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <div className="flex items-center space-x-3">
                <motion.div
                  className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <span className="text-blue-300 font-medium">{currentStep}</span>
              </div>
            </div>
          )}

          {/* Swap Result */}
          {lastResult && (
            <div className={`mb-6 p-6 border rounded-2xl ${
              lastResult.success ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'
            }`}>
              <div className="flex items-center space-x-3 mb-3">
                <span className={`text-2xl ${lastResult.success ? 'text-green-400' : 'text-red-400'}`}>
                  {lastResult.success ? '🎉' : '❌'}
                </span>
                <span className={`font-bold text-lg ${lastResult.success ? 'text-green-300' : 'text-red-300'}`}>
                  {lastResult.success ? 'Swap Completed Successfully!' : 'Swap Failed'}
                </span>
              </div>
              
              {lastResult.success && lastResult.swapData && (
                <div className="text-sm space-y-2 text-green-200">
                  <div className="flex items-center space-x-2">
                    <span>Order ID:</span>
                    <code className="bg-green-500/20 px-2 py-1 rounded text-xs font-mono">
                      {lastResult.escrowId?.slice(0, 16)}...
                    </code>
                    <button
                      onClick={() => copyToClipboard(lastResult.escrowId || '')}
                      className="p-1 hover:bg-green-500/20 rounded transition-colors"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                  <div>
                    Amount: {lastResult.swapData.direction === 'eth-to-sui' 
                      ? `${lastResult.swapData.ethAmount} ETH → ${lastResult.swapData.suiAmount} SUI`
                      : `${lastResult.swapData.suiAmount} SUI → ${lastResult.swapData.ethAmount} ETH`
                    }
                  </div>
                </div>
              )}
              
              {lastResult.error && (
                <div className="text-sm text-red-300 mt-2 bg-red-500/10 p-3 rounded-xl">
                  <span className="font-medium">Error:</span> {lastResult.error}
                </div>
              )}
            </div>
          )}

          {/* Log Statistics */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-gray-500/10 rounded-xl border border-gray-500/20">
              <div className="text-2xl font-bold text-gray-300">{totalLogs}</div>
              <div className="text-xs text-gray-400">Total Events</div>
            </div>
            <div className="text-center p-4 bg-green-500/10 rounded-xl border border-green-500/20">
              <div className="text-2xl font-bold text-green-400">{successCount}</div>
              <div className="text-xs text-green-300">Success</div>
            </div>
            <div className="text-center p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
              <div className="text-2xl font-bold text-yellow-400">{warningCount}</div>
              <div className="text-xs text-yellow-300">Warnings</div>
            </div>
            <div className="text-center p-4 bg-red-500/10 rounded-xl border border-red-500/20">
              <div className="text-2xl font-bold text-red-400">{errorCount}</div>
              <div className="text-xs text-red-300">Errors</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <motion.button
              onClick={clearLogs}
              className="flex-1 py-3 px-6 bg-gray-500/20 text-gray-300 rounded-xl hover:bg-gray-500/30 transition-colors border border-gray-500/20"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Clear Logs
            </motion.button>
            <motion.button
              onClick={resetState}
              className="flex-1 py-3 px-6 bg-orange-500/20 text-orange-300 rounded-xl hover:bg-orange-500/30 transition-colors border border-orange-500/20"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Reset State
            </motion.button>
          </div>
        </motion.div>
      )}
      
      {/* Logs Viewer */}
      <AnimatePresence>
        {(showLogs || executionLogs.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <FusionLogsViewer
              logs={executionLogs}
              onClearLogs={clearLogs}
              totalLogs={totalLogs}
              successCount={successCount}
              errorCount={errorCount}
              warningCount={warningCount}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Transaction Hashes */}
      {lastResult?.transactionHashes && (lastResult.transactionHashes.ethereum.length > 0 || lastResult.transactionHashes.sui.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/40 backdrop-blur-xl border border-orange-500/20 rounded-3xl p-8"
        >
          <h3 className="text-xl font-bold text-orange-200 mb-6 flex items-center space-x-3">
            <Globe className="w-6 h-6" />
            <span>Transaction Hashes</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {lastResult.transactionHashes.ethereum.length > 0 && (
              <div>
                <h4 className="font-medium text-blue-300 mb-4 flex items-center space-x-2">
                  <span>🔷</span>
                  <span>Ethereum Transactions</span>
                </h4>
                <div className="space-y-3">
                  {lastResult.transactionHashes.ethereum.map((hash, index) => (
                    <div key={index} className="bg-black/20 rounded-xl p-4 border border-blue-500/20">
                      <div className="flex items-center justify-between">
                        <code className="text-blue-300 text-sm font-mono">
                          {hash.slice(0, 10)}...{hash.slice(-10)}
                        </code>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => copyToClipboard(hash)}
                            className="p-2 hover:bg-blue-500/20 rounded transition-colors"
                          >
                            <Copy className="w-4 h-4 text-blue-400" />
                          </button>
                          <a
                            href={`https://sepolia.etherscan.io/tx/${hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-blue-500/20 rounded transition-colors"
                          >
                            <ExternalLink className="w-4 h-4 text-blue-400" />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {lastResult.transactionHashes.sui.length > 0 && (
              <div>
                <h4 className="font-medium text-purple-300 mb-4 flex items-center space-x-2">
                  <span>🌊</span>
                  <span>Sui Transactions</span>
                </h4>
                <div className="space-y-3">
                  {lastResult.transactionHashes.sui.map((hash, index) => (
                    <div key={index} className="bg-black/20 rounded-xl p-4 border border-purple-500/20">
                      <div className="flex items-center justify-between">
                        <code className="text-purple-300 text-sm font-mono">
                          {hash.slice(0, 10)}...{hash.slice(-10)}
                        </code>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => copyToClipboard(hash)}
                            className="p-2 hover:bg-purple-500/20 rounded transition-colors"
                          >
                            <Copy className="w-4 h-4 text-purple-400" />
                          </button>
                          <a
                            href={`https://suiscan.xyz/testnet/tx/${hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-purple-500/20 rounded transition-colors"
                          >
                            <ExternalLink className="w-4 h-4 text-purple-400" />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default FusionPlusSwapInterface