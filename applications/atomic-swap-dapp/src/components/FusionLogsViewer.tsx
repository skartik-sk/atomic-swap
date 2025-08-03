import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Terminal, 
  Copy, 
  ExternalLink, 
  Download, 
  Trash2, 
  Filter,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info
} from 'lucide-react'
import { SwapExecutionLog } from '../services/fusionPlusService'
import toast from 'react-hot-toast'

interface FusionLogsViewerProps {
  logs: SwapExecutionLog[]
  onClearLogs: () => void
  totalLogs: number
  successCount: number
  errorCount: number
  warningCount: number
}

const FusionLogsViewer: React.FC<FusionLogsViewerProps> = ({
  logs,
  onClearLogs,
  totalLogs,
  successCount,
  errorCount,
  warningCount
}) => {
  const [filter, setFilter] = useState<'all' | 'success' | 'error' | 'warning' | 'info'>('all')
  const [isExpanded, setIsExpanded] = useState(false)
  
  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true
    return log.status === filter
  })
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'error': return <XCircle className="w-4 h-4 text-red-400" />
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-400" />
      default: return <Info className="w-4 h-4 text-blue-400" />
    }
  }
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-400 bg-green-400/10 border-green-400/20'
      case 'error': return 'text-red-400 bg-red-400/10 border-red-400/20'
      case 'warning': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
      default: return 'text-blue-400 bg-blue-400/10 border-blue-400/20'
    }
  }
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('📋 Copied to clipboard!')
  }
  
  const exportLogs = () => {
    const logText = logs.map(log => {
      const timestamp = new Date(log.timestamp).toISOString()
      return `[${timestamp}] ${log.step} (${log.status.toUpperCase()}): ${log.message}${log.transactionHash ? ` | TX: ${log.transactionHash}` : ''}`
    }).join('\n')
    
    const blob = new Blob([logText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fusion-swap-logs-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('📄 Logs exported successfully!')
  }
  
  if (logs.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-black/40 backdrop-blur-xl border border-orange-500/20 rounded-3xl p-8"
      >
        <div className="text-center">
          <Terminal className="w-16 h-16 text-orange-400/50 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-orange-200 mb-2">No Execution Logs</h3>
          <p className="text-orange-300/60">Execute a Fusion+ swap to see detailed logs here</p>
        </div>
      </motion.div>
    )
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-black/40 backdrop-blur-xl border border-orange-500/20 rounded-3xl overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 border-b border-orange-500/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <motion.div
              className="p-2 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl"
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              <Terminal className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h3 className="text-xl font-bold text-orange-200">Fusion+ Execution Logs</h3>
              <p className="text-orange-300/80 text-sm">Real-time swap execution tracking</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <motion.button
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-4 py-2 bg-orange-500/20 text-orange-300 rounded-xl hover:bg-orange-500/30 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </motion.button>
            
            <motion.button
              onClick={exportLogs}
              className="p-2 bg-blue-500/20 text-blue-300 rounded-xl hover:bg-blue-500/30 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Download className="w-5 h-5" />
            </motion.button>
            
            <motion.button
              onClick={onClearLogs}
              className="p-2 bg-red-500/20 text-red-300 rounded-xl hover:bg-red-500/30 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Trash2 className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
        
        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-gray-500/10 rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-gray-300">{totalLogs}</div>
            <div className="text-xs text-gray-400">Total</div>
          </div>
          <div className="bg-green-500/10 rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-green-400">{successCount}</div>
            <div className="text-xs text-green-300">Success</div>
          </div>
          <div className="bg-red-500/10 rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-red-400">{errorCount}</div>
            <div className="text-xs text-red-300">Errors</div>
          </div>
          <div className="bg-yellow-500/10 rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-yellow-400">{warningCount}</div>
            <div className="text-xs text-yellow-300">Warnings</div>
          </div>
        </div>
        
        {/* Filter buttons */}
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-orange-400" />
          <span className="text-sm text-orange-300 mr-2">Filter:</span>
          {['all', 'success', 'error', 'warning', 'info'].map((filterType) => (
            <motion.button
              key={filterType}
              onClick={() => setFilter(filterType as any)}
              className={`px-3 py-1 text-xs rounded-full transition-all ${
                filter === filterType
                  ? 'bg-orange-500 text-white'
                  : 'bg-orange-500/20 text-orange-300 hover:bg-orange-500/30'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
            </motion.button>
          ))}
        </div>
      </div>
      
      {/* Logs container */}
      <AnimatePresence mode="wait">
        <motion.div
          key={filter}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`transition-all duration-300 ${
            isExpanded ? 'max-h-[600px]' : 'max-h-[300px]'
          } overflow-y-auto`}
        >
          <div className="p-4 space-y-2">
            {filteredLogs.map((log, index) => (
              <motion.div
                key={`${log.timestamp}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-4 rounded-xl border ${getStatusColor(log.status)} hover:bg-white/5 transition-all group`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {getStatusIcon(log.status)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-bold text-orange-300">{log.step}</span>
                        <div className="flex items-center space-x-1 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </div>
                      <p className="text-white text-sm leading-relaxed">{log.message}</p>
                      
                      {log.transactionHash && (
                        <div className="mt-2 flex items-center space-x-2">
                          <span className="text-xs text-gray-400">TX:</span>
                          <code className="text-xs bg-black/30 px-2 py-1 rounded text-orange-300 font-mono">
                            {log.transactionHash.length > 20 
                              ? `${log.transactionHash.slice(0, 10)}...${log.transactionHash.slice(-10)}`
                              : log.transactionHash
                            }
                          </code>
                          <motion.button
                            onClick={() => copyToClipboard(log.transactionHash!)}
                            className="p-1 hover:bg-white/10 rounded transition-colors opacity-0 group-hover:opacity-100"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Copy className="w-3 h-3 text-gray-400" />
                          </motion.button>
                          {log.explorerUrl && (
                            <motion.a
                              href={log.explorerUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 hover:bg-white/10 rounded transition-colors opacity-0 group-hover:opacity-100"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <ExternalLink className="w-3 h-3 text-gray-400" />
                            </motion.a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            
            {filteredLogs.length === 0 && (
              <div className="text-center py-8">
                <div className="text-gray-400">No logs match the current filter</div>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}

export default FusionLogsViewer
