import React from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, Clock, AlertCircle, ExternalLink, Copy, Zap } from 'lucide-react'
import { useAtomicSwap } from '@/stores/AtomicSwapStore'
import toast from 'react-hot-toast'

const SwapProgressTracker: React.FC = () => {
  const { currentSwap } = useAtomicSwap()

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Transaction hash copied!')
  }

  if (!currentSwap?.progress) {
    return (
      <motion.div 
        className="max-w-4xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-amber-500/5 rounded-3xl" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl" />
          
          <div className="relative bg-black/40 backdrop-blur-xl border border-orange-500/20 rounded-3xl p-8 md:p-10 text-center">
            <motion.div 
              className="w-24 h-24 mx-auto mb-6 bg-orange-500/10 rounded-full flex items-center justify-center"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Zap className="h-12 w-12 text-orange-400" />
            </motion.div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 bg-clip-text text-transparent mb-3">
              No Active Swap
            </h3>
            <p className="text-orange-300/80 text-lg">
              Start a bilateral swap to see progress tracking here
            </p>
          </div>
        </div>
      </motion.div>
    )
  }

  const { progress } = currentSwap
  const steps = [
    { number: 1, title: 'Secret Verification', description: 'Verifying cryptographic commitment' },
    { number: 2, title: 'Ethereum Claim', description: 'Claiming assets from Ethereum vault' },
    { number: 3, title: 'Sui Claim', description: 'Claiming assets from Sui vault' },
    { number: 4, title: 'Settlement Complete', description: 'Bilateral atomic swap completed' }
  ]

  const getStepIcon = (stepNumber: number) => {
    if (progress.step > stepNumber) {
      return <CheckCircle className="h-5 w-5 text-emerald-400" />
    } else if (progress.step === stepNumber) {
      return progress.status === 'failed' ? (
        <AlertCircle className="h-5 w-5 text-red-400" />
      ) : (
        <div className="h-5 w-5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
      )
    } else {
      return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  const getStepStatus = (stepNumber: number) => {
    if (progress.step > stepNumber) return 'completed'
    if (progress.step === stepNumber) return progress.status
    return 'pending'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-amber-500/5 rounded-3xl" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-amber-500/10 rounded-full blur-xl" />
      
      <div className="relative bg-black/40 backdrop-blur-xl border border-orange-500/20 rounded-3xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
              Swap Progress
            </h3>
            <p className="text-orange-200/80 text-sm">Step {progress.step} of {progress.total}</p>
          </div>
          
          <div className="text-right">
            <div className={`text-sm font-medium ${
              progress.status === 'completed' ? 'text-emerald-400' :
              progress.status === 'failed' ? 'text-red-400' :
              progress.status === 'processing' ? 'text-orange-400' :
              'text-gray-400'
            }`}>
              {progress.status.charAt(0).toUpperCase() + progress.status.slice(1)}
            </div>
            <div className="text-xs text-orange-300/60">
              {progress.status === 'processing' ? 'In Progress...' : ''}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative mb-8">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/20 transform -translate-y-1/2" />
          <motion.div
            className="absolute top-1/2 left-0 h-0.5 bg-gradient-to-r from-orange-500 to-amber-500 transform -translate-y-1/2"
            initial={{ width: 0 }}
            animate={{ width: `${(progress.step / progress.total) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
          
          <div className="relative flex justify-between">
            {steps.map((step) => {
              const status = getStepStatus(step.number)
              return (
                <div
                  key={step.number}
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${
                    status === 'completed' ? 'bg-emerald-500 border-emerald-500' :
                    status === 'processing' ? 'bg-orange-500 border-orange-500' :
                    status === 'failed' ? 'bg-red-500 border-red-500' :
                    'bg-black/30 border-orange-500/20'
                  }`}
                >
                  {getStepIcon(step.number)}
                </div>
              )
            })}
          </div>
        </div>

        {/* Current Step Details */}
        <div className="bg-black/30 border border-orange-500/20 rounded-2xl p-4 mb-6">
          <div className="flex items-center space-x-3 mb-2">
            {getStepIcon(progress.step)}
            <h4 className="text-orange-200 font-medium">
              {steps[progress.step - 1]?.title || 'Processing...'}
            </h4>
          </div>
          <p className={`text-sm ${
            progress.status === 'failed' ? 'text-red-300' : 'text-orange-300/80'
          }`}>
            {progress.description}
          </p>
          
          {/* Transaction Hash */}
          {progress.transactionHash && (
            <div className="mt-3 flex items-center justify-between bg-black/20 rounded-xl p-3">
              <div>
                <div className="text-xs text-orange-400 uppercase tracking-wide">Transaction Hash</div>
                <div className="text-white font-mono text-sm">{progress.transactionHash}</div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => copyToClipboard(progress.transactionHash!)}
                  className="p-2 hover:bg-orange-500/10 rounded-lg transition-colors"
                  title="Copy transaction hash"
                >
                  <Copy className="h-4 w-4 text-orange-400" />
                </button>
                <button
                  className="p-2 hover:bg-orange-500/10 rounded-lg transition-colors"
                  title="View on explorer"
                >
                  <ExternalLink className="h-4 w-4 text-orange-400" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Step Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {steps.map((step) => {
            const status = getStepStatus(step.number)
            return (
              <div
                key={step.number}
                className={`text-center p-3 rounded-xl border ${
                  status === 'completed' ? 'bg-emerald-500/10 border-emerald-500/20' :
                  status === 'processing' ? 'bg-orange-500/10 border-orange-500/20' :
                  status === 'failed' ? 'bg-red-500/10 border-red-500/20' :
                  'bg-black/20 border-orange-500/10'
                }`}
              >
                <div className="text-xs text-orange-400/80 mb-1">Step {step.number}</div>
                <div className={`text-sm font-medium ${
                  status === 'completed' ? 'text-emerald-400' :
                  status === 'processing' ? 'text-orange-400' :
                  status === 'failed' ? 'text-red-400' :
                  'text-gray-400'
                }`}>
                  {step.title}
                </div>
              </div>
            )
          })}
        </div>

        {/* Error Message */}
        {progress.status === 'failed' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-6 bg-red-500/10 border border-red-500/20 rounded-2xl p-4"
          >
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <h4 className="text-red-300 font-medium">Swap Failed</h4>
            </div>
            <p className="text-red-200 text-sm mt-2">
              The atomic swap encountered an error during execution. Please check the transaction details and try again.
            </p>
          </motion.div>
        )}

        {/* Success Message */}
        {progress.status === 'completed' && progress.step === progress.total && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4"
          >
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
              <h4 className="text-emerald-300 font-medium">Swap Completed Successfully!</h4>
            </div>
            <p className="text-emerald-200 text-sm mt-2">
              Your bilateral atomic swap has been completed successfully. Assets have been exchanged between both chains.
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

export default SwapProgressTracker