import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Layers, Search, Filter, Clock, CheckCircle, XCircle, AlertCircle, Eye, MoreHorizontal, Activity } from 'lucide-react'
import { useAtomicSwap } from '@/stores/AtomicSwapStore'

const VaultDashboard: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'settled' | 'expired'>('all')
  const [selectedVault, setSelectedVault] = useState<string | null>(null)

  const { activeVaults, vaultHistory } = useAtomicSwap()

  const allVaults = [...activeVaults, ...vaultHistory]

  const filteredVaults = allVaults.filter(vault => {
    const matchesSearch = vault.vaultId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vault.counterpartyAddress.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'active' && vault.isActive && !vault.isSettled) ||
                         (filterStatus === 'settled' && vault.isSettled) ||
                         (filterStatus === 'expired' && !vault.isActive && !vault.isSettled)
    
    return matchesSearch && matchesFilter
  })

  const getVaultStatus = (vault: any) => {
    if (vault.isSettled) return { label: 'Settled', color: 'emerald', icon: CheckCircle }
    if (!vault.isActive) return { label: 'Expired', color: 'red', icon: XCircle }
    if (vault.expirationTimestamp < Date.now() / 1000) return { label: 'Expiring', color: 'amber', icon: AlertCircle }
    return { label: 'Active', color: 'blue', icon: Clock }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatAmount = (amount: bigint) => {
    return (Number(amount) / 1e18).toFixed(4)
  }

  const getTimeUntilExpiration = (expirationTimestamp: number) => {
    const now = Date.now() / 1000
    const timeLeft = expirationTimestamp - now
    
    if (timeLeft <= 0) return 'Expired'
    
    const hours = Math.floor(timeLeft / 3600)
    const minutes = Math.floor((timeLeft % 3600) / 60)
    
    if (hours > 24) {
      const days = Math.floor(hours / 24)
      return `${days}d ${hours % 24}h`
    }
    
    return `${hours}h ${minutes}m`
  }

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden"
      >
        {/* Background decorations */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-amber-500/5 rounded-3xl" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl" />
        
        <div className="relative bg-black/40 backdrop-blur-xl border border-orange-500/20 rounded-3xl p-8 md:p-10">
          {/* Header */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-8 space-y-4 lg:space-y-0">
            <motion.div 
              className="flex items-center space-x-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <motion.div 
                className="relative"
                whileHover={{ scale: 1.1, rotateY: 180 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="p-4 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl shadow-2xl shadow-orange-500/30">
                  <Layers className="h-8 w-8 text-white" />
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
                  Vault Dashboard
                </motion.h2>
                <motion.p 
                  className="text-orange-200/80 mt-1 flex items-center space-x-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <Activity className="w-4 h-4" />
                  <span>Monitor and manage your atomic vaults across chains</span>
                </motion.p>
              </div>
            </motion.div>

            {/* Statistics Cards */}
            <motion.div 
              className="grid grid-cols-3 gap-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              <motion.div 
                className="text-center bg-black/20 rounded-2xl p-4 border border-orange-500/20"
                whileHover={{ scale: 1.05, y: -2 }}
              >
                <motion.div 
                  className="text-2xl font-bold text-orange-400"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  {activeVaults.length}
                </motion.div>
                <div className="text-xs text-orange-300/80 font-medium">Active Vaults</div>
              </motion.div>
              <motion.div 
                className="text-center bg-black/20 rounded-2xl p-4 border border-emerald-500/20"
                whileHover={{ scale: 1.05, y: -2 }}
              >
                <motion.div 
                  className="text-2xl font-bold text-emerald-400"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                >
                  {vaultHistory.length}
                </motion.div>
                <div className="text-xs text-emerald-300/80 font-medium">Completed</div>
              </motion.div>
              <motion.div 
                className="text-center bg-black/20 rounded-2xl p-4 border border-blue-500/20"
                whileHover={{ scale: 1.05, y: -2 }}
              >
                <motion.div 
                  className="text-2xl font-bold text-blue-400"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 2 }}
                >
                  {allVaults.length}
                </motion.div>
                <div className="text-xs text-blue-300/80 font-medium">Total Vaults</div>
              </motion.div>
            </motion.div>
          </div>

          {/* Search and Filter Controls */}
          <motion.div 
            className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            {/* Search */}
            <motion.div 
              className="relative flex-1"
              whileHover={{ scale: 1.01 }}
            >
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-orange-400" />
              <input
                type="text"
                placeholder="Search by Vault ID or Address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-6 py-4 bg-black/30 border border-orange-500/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-300 backdrop-blur-sm"
              />
            </motion.div>

            {/* Filter */}
            <motion.div 
              className="relative"
              whileHover={{ scale: 1.01 }}
            >
              <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-orange-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="pl-12 pr-8 py-4 bg-black/30 border border-orange-500/20 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-300 backdrop-blur-sm appearance-none cursor-pointer"
              >
                <option value="all">All Vaults</option>
                <option value="active">Active</option>
                <option value="settled">Settled</option>
                <option value="expired">Expired</option>
              </select>
            </motion.div>
          </motion.div>

          {/* Vault Grid */}
          {filteredVaults.length === 0 ? (
            <motion.div 
              className="text-center py-16"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 }}
            >
              <motion.div 
                className="w-24 h-24 mx-auto mb-6 bg-orange-500/10 rounded-full flex items-center justify-center"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Layers className="h-12 w-12 text-orange-400" />
              </motion.div>
              <h3 className="text-xl font-semibold text-orange-200 mb-2">No Vaults Found</h3>
              <p className="text-orange-300/60">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Create your first atomic vault to get started'
                }
              </p>
            </motion.div>
          ) : (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              {filteredVaults.map((vault, index) => {
                const status = getVaultStatus(vault)
                const StatusIcon = status.icon

                return (
                  <motion.div
                    key={vault.vaultId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="group relative"
                  >
                    <motion.div
                      className="relative bg-black/30 backdrop-blur-sm border border-orange-500/20 rounded-2xl p-6 hover:border-orange-500/40 transition-all duration-300 cursor-pointer"
                      whileHover={{ 
                        scale: 1.02, 
                        y: -4,
                        boxShadow: "0 20px 40px rgba(239, 125, 33, 0.1)"
                      }}
                      onClick={() => setSelectedVault(selectedVault === vault.vaultId ? null : vault.vaultId)}
                    >
                      {/* Vault Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <motion.div 
                            className={`p-2 rounded-xl ${
                              status.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-400' :
                              status.color === 'red' ? 'bg-red-500/20 text-red-400' :
                              status.color === 'amber' ? 'bg-amber-500/20 text-amber-400' :
                              'bg-blue-500/20 text-blue-400'
                            }`}
                            whileHover={{ scale: 1.1, rotate: 5 }}
                          >
                            <StatusIcon className="h-5 w-5" />
                          </motion.div>
                          <div>
                            <div className="text-sm font-mono text-orange-200">
                              {formatAddress(vault.vaultId)}
                            </div>
                            <div className={`text-xs font-medium ${
                              status.color === 'emerald' ? 'text-emerald-400' :
                              status.color === 'red' ? 'text-red-400' :
                              status.color === 'amber' ? 'text-amber-400' :
                              'text-blue-400'
                            }`}>
                              {status.label}
                            </div>
                          </div>
                        </div>
                        
                        <motion.button
                          className="p-2 text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 rounded-lg transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </motion.button>
                      </div>

                      {/* Vault Details */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-orange-300/60 text-sm">Amount</span>
                          <span className="text-orange-200 font-mono">
                            {formatAmount(vault.assetAmount)} {vault.chainType === 'ethereum' ? 'ETH' : 'SUI'}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-orange-300/60 text-sm">Counterparty</span>
                          <span className="text-orange-200 font-mono text-sm">
                            {formatAddress(vault.counterpartyAddress)}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-orange-300/60 text-sm">Expires</span>
                          <span className="text-orange-200 text-sm">
                            {getTimeUntilExpiration(vault.expirationTimestamp)}
                          </span>
                        </div>

                        {vault.isActive && (
                          <div className="pt-2 border-t border-orange-500/20">
                            <div className="flex justify-between items-center">
                              <span className="text-orange-300/60 text-sm">Status</span>
                              <span className="text-amber-400 text-sm font-medium">
                                Active Vault
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Expanded Details */}
                      <motion.div
                        initial={false}
                        animate={{ 
                          height: selectedVault === vault.vaultId ? 'auto' : 0,
                          opacity: selectedVault === vault.vaultId ? 1 : 0
                        }}
                        className="overflow-hidden"
                      >
                        <div className="pt-4 mt-4 border-t border-orange-500/20 space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-orange-300/60 text-sm">Commitment Hash</span>
                            <span className="text-orange-200 font-mono text-xs">
                              {formatAddress(vault.commitmentHash)}
                            </span>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-orange-300/60 text-sm">Chain Type</span>
                            <span className="text-orange-200 text-sm">
                              {vault.chainType.toUpperCase()}
                            </span>
                          </div>

                          <motion.button 
                            className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all duration-300 flex items-center justify-center space-x-2"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Eye className="h-4 w-4" />
                            <span>View Details</span>
                          </motion.button>
                        </div>
                      </motion.div>
                    </motion.div>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default VaultDashboard
