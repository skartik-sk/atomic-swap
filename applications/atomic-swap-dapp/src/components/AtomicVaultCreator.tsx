import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, Lock, Clock, Users, ChevronRight, Sparkles, Zap } from 'lucide-react'
import { useAtomicSwap } from '@/stores/AtomicSwapStore'
import toast from 'react-hot-toast'

const AtomicVaultCreator: React.FC = () => {
  const [formData, setFormData] = useState({
    assetAmount: '',
    counterpartyAddress: '',
    expirationHours: '24',
    secret: '',
    chainType: 'ethereum' as 'ethereum' | 'sui'
  })
  const [isCreating, setIsCreating] = useState(false)
  
  const { generateCommitment, addVault, setLoading, setError } = useAtomicSwap()

  const handleCreateVault = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.assetAmount || !formData.counterpartyAddress || !formData.secret) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsCreating(true)
    setLoading(true)

    try {
      // Generate cryptographic commitment
      const commitment = generateCommitment(formData.secret)
      const expirationTimestamp = Math.floor(Date.now() / 1000) + (parseInt(formData.expirationHours) * 3600)
      
      // Create vault entry
      const vaultId = `vault_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const vault = {
        vaultId,
        initiator: '0x1234567890123456789012345678901234567890', // This would come from wallet
        assetAmount: BigInt(parseFloat(formData.assetAmount) * 1e18),
        commitmentHash: commitment.hash,
        expirationTimestamp,
        counterpartyAddress: formData.counterpartyAddress,
        isActive: true,
        isSettled: false,
        chainType: formData.chainType
      }

      addVault(vault)
      
      toast.success(`🚀 Atomic vault created successfully! Vault ID: ${vaultId.substring(0, 10)}...`)
      
      // Reset form
      setFormData({
        assetAmount: '',
        counterpartyAddress: '',
        expirationHours: '24',
        secret: '',
        chainType: 'ethereum'
      })
      
    } catch (error) {
      console.error('Failed to create vault:', error)
      setError(`Failed to create vault: ${error}`)
      toast.error('❌ Failed to create atomic vault')
    } finally {
      setIsCreating(false)
      setLoading(false)
    }
  }

  const inputClasses = "w-full px-6 py-4 bg-black/30 border border-orange-500/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-300 backdrop-blur-sm"
  const labelClasses = "block text-sm font-semibold text-orange-200 mb-3 flex items-center space-x-2"

  return (
    <div className="max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden"
      >
        {/* Background decorations */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-amber-500/5 rounded-3xl" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl" />
        
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
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="p-4 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl shadow-2xl shadow-orange-500/30">
                <Shield className="h-8 w-8 text-white" />
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
                Create Atomic Vault
              </motion.h2>
              <motion.p 
                className="text-orange-200/80 mt-1 flex items-center space-x-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <Sparkles className="w-4 h-4" />
                <span>Establish secure cross-chain atomic vault with cryptographic commitments</span>
              </motion.p>
            </div>
          </motion.div>

          {/* Form */}
          <motion.form 
            onSubmit={handleCreateVault} 
            className="space-y-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {/* Chain Selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <label className={labelClasses}>
                <Zap className="w-4 h-4 text-orange-400" />
                <span>Target Blockchain</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <motion.button
                  type="button"
                  onClick={() => setFormData({ ...formData, chainType: 'ethereum' })}
                  className={`relative p-6 rounded-2xl border-2 transition-all duration-300 overflow-hidden ${
                    formData.chainType === 'ethereum'
                      ? 'border-orange-500 bg-orange-500/10 text-orange-200'
                      : 'border-orange-500/20 bg-black/20 text-gray-300 hover:border-orange-500/40 hover:bg-orange-500/5'
                  }`}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {formData.chainType === 'ethereum' && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-amber-500/20"
                      layoutId="chainSelection"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <div className="relative text-center space-y-2">
                    <div className="text-xl font-bold flex items-center justify-center space-x-2">
                      <span>🔷</span>
                      <span>Ethereum</span>
                    </div>
                    <div className="text-sm opacity-75">EVM Compatible Network</div>
                    <div className="text-xs bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full inline-block mt-2">
                      Gas Optimized
                    </div>
                  </div>
                </motion.button>

                <motion.button
                  type="button"
                  onClick={() => setFormData({ ...formData, chainType: 'sui' })}
                  className={`relative p-6 rounded-2xl border-2 transition-all duration-300 overflow-hidden ${
                    formData.chainType === 'sui'
                      ? 'border-orange-500 bg-orange-500/10 text-orange-200'
                      : 'border-orange-500/20 bg-black/20 text-gray-300 hover:border-orange-500/40 hover:bg-orange-500/5'
                  }`}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {formData.chainType === 'sui' && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-amber-500/20"
                      layoutId="chainSelection"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <div className="relative text-center space-y-2">
                    <div className="text-xl font-bold flex items-center justify-center space-x-2">
                      <span>🌊</span>
                      <span>Sui</span>
                    </div>
                    <div className="text-sm opacity-75">Move Language Powered</div>
                    <div className="text-xs bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full inline-block mt-2">
                      High Performance
                    </div>
                  </div>
                </motion.button>
              </div>
            </motion.div>

            {/* Asset Amount */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <label htmlFor="assetAmount" className={labelClasses}>
                <Lock className="w-4 h-4 text-orange-400" />
                <span>Asset Amount ({formData.chainType === 'ethereum' ? 'ETH' : 'SUI'})</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="assetAmount"
                  step="0.001"
                  min="0.001"
                  placeholder="0.1"
                  value={formData.assetAmount}
                  onChange={(e) => setFormData({ ...formData, assetAmount: e.target.value })}
                  className={inputClasses}
                  required
                />
                <motion.div 
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-orange-400 font-medium"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                >
                  {formData.chainType === 'ethereum' ? 'ETH' : 'SUI'}
                </motion.div>
              </div>
              <p className="mt-2 text-xs text-orange-300/60 flex items-center space-x-1">
                <Sparkles className="w-3 h-3" />
                <span>Minimum: 0.001 {formData.chainType === 'ethereum' ? 'ETH' : 'SUI'}</span>
              </p>
            </motion.div>

            {/* Counterparty Address */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <label htmlFor="counterpartyAddress" className={labelClasses}>
                <Users className="w-4 h-4 text-orange-400" />
                <span>Counterparty Address</span>
              </label>
              <input
                type="text"
                id="counterpartyAddress"
                placeholder="0x742d35Cc6e6B1e8c5Ce0e8b0f31f4E4E4E4E4E4E"
                value={formData.counterpartyAddress}
                onChange={(e) => setFormData({ ...formData, counterpartyAddress: e.target.value })}
                className={inputClasses}
                required
              />
              <p className="mt-2 text-xs text-orange-300/60">
                Address of the authorized party who can claim the assets
              </p>
            </motion.div>

            {/* Expiration Time */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              <label htmlFor="expirationHours" className={labelClasses}>
                <Clock className="w-4 h-4 text-orange-400" />
                <span>Expiration Period</span>
              </label>
              <select
                id="expirationHours"
                value={formData.expirationHours}
                onChange={(e) => setFormData({ ...formData, expirationHours: e.target.value })}
                className={inputClasses}
              >
                <option value="1">1 Hour ⚡</option>
                <option value="6">6 Hours 🕐</option>
                <option value="12">12 Hours 🕧</option>
                <option value="24">24 Hours ⭐ (Recommended)</option>
                <option value="48">48 Hours 📅</option>
                <option value="72">72 Hours 🗓️</option>
                <option value="168">7 Days 📆 (Maximum)</option>
              </select>
            </motion.div>

            {/* Secret */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
            >
              <label htmlFor="secret" className={labelClasses}>
                <Lock className="w-4 h-4 text-orange-400" />
                <span>Secret Phrase</span>
              </label>
              <input
                type="password"
                id="secret"
                placeholder="Enter a secure secret phrase"
                value={formData.secret}
                onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
                className={inputClasses}
                required
              />
              <p className="mt-2 text-xs text-orange-300/60">
                🔐 This secret generates the cryptographic commitment. Keep it secure!
              </p>
            </motion.div>

            {/* Security Notice */}
            <motion.div 
              className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-6"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.1 }}
            >
              <div className="flex items-start space-x-4">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Shield className="h-6 w-6 text-amber-400 mt-1 flex-shrink-0" />
                </motion.div>
                <div>
                  <h4 className="text-amber-300 font-semibold mb-2 flex items-center space-x-2">
                    <span>🛡️ Security Notice</span>
                  </h4>
                  <p className="text-amber-200/80 text-sm leading-relaxed">
                    Keep your secret phrase secure and private. You'll need it to claim assets from the counterparty's vault. 
                    Never share it until the atomic swap is ready to be completed.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isCreating}
              className="w-full relative overflow-hidden bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 text-black font-bold py-5 px-8 rounded-2xl hover:from-orange-600 hover:via-amber-600 hover:to-yellow-600 focus:outline-none focus:ring-4 focus:ring-orange-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl shadow-orange-500/25"
              whileHover={{ scale: isCreating ? 1 : 1.02, y: isCreating ? 0 : -2 }}
              whileTap={{ scale: isCreating ? 1 : 0.98 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
            >
              {/* Button shine effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: isCreating ? 0 : [-100, 100] }}
                transition={{ duration: 2, repeat: Infinity, repeatType: "loop" }}
              />
              
              <div className="relative flex items-center justify-center space-x-3">
                {isCreating ? (
                  <>
                    <motion.div
                      className="w-6 h-6 border-3 border-black/30 border-t-black rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <span>Creating Vault...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Create Atomic Vault</span>
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </div>
            </motion.button>
          </motion.form>
        </div>
      </motion.div>
    </div>
  )
}

export default AtomicVaultCreator
