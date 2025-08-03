import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  TestTube, 
  Play, 
  CheckCircle, 
  XCircle, 
  Loader,
  Copy,
  ExternalLink
} from 'lucide-react'
import { useAccount } from 'wagmi'
import { useFusionPlusSwap } from '@/hooks/useFusionPlusSwap'
import toast from 'react-hot-toast'

interface TestScenario {
  id: string
  name: string
  description: string
  direction: 'eth-to-sui' | 'sui-to-eth'
  amount: string
  expectedFeatures: string[]
}

const FusionTestSuite: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState<string>('')
  const [testSuiAddress] = useState('0x1234567890abcdef1234567890abcdef12345678901234567890abcdef123456')
  const [isRunningTest, setIsRunningTest] = useState(false)
  const [testResults, setTestResults] = useState<Record<string, any>>({})
  
  const { address: connectedEthAddress } = useAccount()
  const {
    isExecuting,
    executionLogs,
    executeSwap,
    clearLogs,
    totalLogs,
    successCount,
    errorCount
  } = useFusionPlusSwap()
  
  const testScenarios: TestScenario[] = [
    {
      id: 'eth-to-sui-small',
      name: 'ETH → SUI Small Amount',
      description: 'Test 0.0001 ETH to SUI swap with all Fusion+ features',
      direction: 'eth-to-sui',
      amount: '0.0001',
      expectedFeatures: [
        'Dutch Auction pricing',
        'Safety deposit calculation',
        'Finality lock confirmation',
        'Merkle tree secret generation',
        'Security checks',
        'Gas optimization'
      ]
    },
    {
      id: 'sui-to-eth-medium',
      name: 'SUI → ETH Medium Amount',
      description: 'Test 100 SUI to ETH swap with enhanced features',
      direction: 'sui-to-eth',
      amount: '100',
      expectedFeatures: [
        'Reverse auction mechanics',
        'Cross-chain finality',
        'Secret sharing protocols',
        'Resolver incentives',
        'Partial fill support',
        'Real-time monitoring'
      ]
    },
    {
      id: 'eth-to-sui-large',
      name: 'ETH → SUI Large Amount',
      description: 'Test 0.01 ETH to SUI with maximum safety features',
      direction: 'eth-to-sui',
      amount: '0.01',
      expectedFeatures: [
        'Enhanced safety deposits',
        'Multi-resolver coordination',
        'Advanced gas optimization',
        'Extended finality locks',
        'Comprehensive logging',
        'Error recovery'
      ]
    }
  ]
  
  const runTest = async (scenario: TestScenario) => {
    if (!connectedEthAddress) {
      toast.error('🚫 Please connect your Ethereum wallet first')
      return
    }
    
    setIsRunningTest(true)
    setSelectedScenario(scenario.id)
    clearLogs()
    
    try {
      toast.loading(`🧪 Running test: ${scenario.name}`, { id: 'test-run' })
      
      const result = await executeSwap({
        direction: scenario.direction,
        amount: scenario.amount,
        userEthereumAddress: connectedEthAddress,
        userSuiAddress: testSuiAddress
      })
      
      setTestResults(prev => ({
        ...prev,
        [scenario.id]: {
          ...result,
          scenario: scenario.name,
          timestamp: new Date().toISOString(),
          features: scenario.expectedFeatures,
          logCount: totalLogs,
          successRate: successCount / Math.max(totalLogs, 1) * 100
        }
      }))
      
      if (result.success) {
        toast.success(`✅ Test "${scenario.name}" passed!`, { id: 'test-run' })
      } else {
        toast.error(`❌ Test "${scenario.name}" failed: ${result.error}`, { id: 'test-run' })
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast.error(`❌ Test failed: ${errorMessage}`, { id: 'test-run' })
      
      setTestResults(prev => ({
        ...prev,
        [scenario.id]: {
          success: false,
          error: errorMessage,
          scenario: scenario.name,
          timestamp: new Date().toISOString(),
          logCount: totalLogs
        }
      }))
    } finally {
      setIsRunningTest(false)
    }
  }
  
  const runAllTests = async () => {
    if (!connectedEthAddress) {
      toast.error('🚫 Please connect your Ethereum wallet first')
      return
    }
    
    toast.success('🧪 Running complete Fusion+ test suite...')
    
    for (const scenario of testScenarios) {
      await runTest(scenario)
      // Wait between tests
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
    
    toast.success('🎉 Test suite completed!')
  }
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('📋 Copied to clipboard!')
  }
  
  const exportTestResults = () => {
    const resultsText = JSON.stringify(testResults, null, 2)
    const blob = new Blob([resultsText], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fusion-test-results-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('📄 Test results exported!')
  }
  
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-black/40 backdrop-blur-xl border border-orange-500/20 rounded-3xl p-8"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <motion.div
              className="p-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl"
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              <TestTube className="w-8 h-8 text-white" />
            </motion.div>
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Fusion+ Test Suite
              </h2>
              <p className="text-purple-200/80 mt-1">
                Comprehensive testing of enhanced atomic swap features
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <motion.button
              onClick={runAllTests}
              disabled={isExecuting || isRunningTest}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all disabled:opacity-50"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="flex items-center space-x-2">
                <Play className="w-5 h-5" />
                <span>Run All Tests</span>
              </div>
            </motion.button>
            
            {Object.keys(testResults).length > 0 && (
              <motion.button
                onClick={exportTestResults}
                className="px-4 py-3 bg-green-500/20 text-green-300 rounded-xl hover:bg-green-500/30 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Export Results
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
      
      {/* Test Scenarios */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {testScenarios.map((scenario) => {
          const testResult = testResults[scenario.id]
          const isSelected = selectedScenario === scenario.id
          
          return (
            <motion.div
              key={scenario.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`bg-black/30 backdrop-blur-sm border rounded-2xl p-6 transition-all cursor-pointer ${
                isSelected 
                  ? 'border-purple-500/50 bg-purple-500/10' 
                  : 'border-purple-500/20 hover:border-purple-500/40'
              }`}
              whileHover={{ scale: 1.02, y: -2 }}
              onClick={() => !isExecuting && !isRunningTest && runTest(scenario)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-xl ${
                    scenario.direction === 'eth-to-sui' 
                      ? 'bg-blue-500/20 text-blue-300' 
                      : 'bg-purple-500/20 text-purple-300'
                  }`}>
                    {scenario.direction === 'eth-to-sui' ? '🔷' : '🌊'}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{scenario.name}</h3>
                    <p className="text-gray-400 text-sm">
                      {scenario.amount} {scenario.direction === 'eth-to-sui' ? 'ETH' : 'SUI'}
                    </p>
                  </div>
                </div>
                
                {testResult && (
                  <div className="flex items-center space-x-2">
                    {testResult.success ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                )}
                
                {isSelected && (isExecuting || isRunningTest) && (
                  <Loader className="w-5 h-5 text-purple-400 animate-spin" />
                )}
              </div>
              
              <p className="text-gray-300 text-sm mb-4">{scenario.description}</p>
              
              <div className="space-y-2">
                <h4 className="text-purple-300 font-medium text-sm">Expected Features:</h4>
                <div className="flex flex-wrap gap-1">
                  {scenario.expectedFeatures.map((feature) => (
                    <span
                      key={feature}
                      className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
              
              {testResult && (
                <div className="mt-4 pt-4 border-t border-purple-500/20">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">
                      Logs: {testResult.logCount || 0}
                    </span>
                    {testResult.successRate && (
                      <span className="text-green-400">
                        {testResult.successRate.toFixed(1)}% success
                      </span>
                    )}
                  </div>
                  {testResult.error && (
                    <p className="text-red-400 text-xs mt-2 break-words">
                      {testResult.error}
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          )
        })}
      </div>
      
      {/* Live Execution Logs */}
      {(isExecuting || executionLogs.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/40 backdrop-blur-xl border border-purple-500/20 rounded-3xl overflow-hidden"
        >
          <div className="p-6 border-b border-purple-500/10">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-purple-200">Live Test Execution</h3>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-400">
                  Total: {totalLogs} | Success: {successCount} | Errors: {errorCount}
                </div>
                <motion.button
                  onClick={clearLogs}
                  className="px-3 py-1 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
                  whileHover={{ scale: 1.05 }}
                >
                  Clear
                </motion.button>
              </div>
            </div>
          </div>
          
          <div className="max-h-[400px] overflow-y-auto p-4">
            {executionLogs.map((log, index) => (
              <motion.div
                key={`${log.timestamp}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start space-x-3 py-2 border-b border-purple-500/10 last:border-0"
              >
                <div className="text-sm">
                  {log.status === 'success' && '✅'}
                  {log.status === 'error' && '❌'}
                  {log.status === 'warning' && '⚠️'}
                  {log.status === 'info' && 'ℹ️'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-bold text-purple-300">{log.step}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-white text-sm">{log.message}</p>
                  {log.transactionHash && (
                    <div className="flex items-center space-x-2 mt-1">
                      <code className="text-xs bg-black/30 px-2 py-1 rounded text-purple-300 font-mono">
                        {log.transactionHash.slice(0, 10)}...{log.transactionHash.slice(-10)}
                      </code>
                      <button
                        onClick={() => copyToClipboard(log.transactionHash!)}
                        className="p-1 hover:bg-white/10 rounded transition-colors"
                      >
                        <Copy className="w-3 h-3 text-gray-400" />
                      </button>
                      {log.explorerUrl && (
                        <a
                          href={log.explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 hover:bg-white/10 rounded transition-colors"
                        >
                          <ExternalLink className="w-3 h-3 text-gray-400" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
      
      {/* Test Results Summary */}
      {Object.keys(testResults).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/40 backdrop-blur-xl border border-green-500/20 rounded-3xl p-8"
        >
          <h3 className="text-xl font-bold text-green-300 mb-6">Test Results Summary</h3>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(testResults).map(([testId, result]) => (
              <div
                key={testId}
                className={`bg-black/20 rounded-xl p-4 border ${
                  result.success 
                    ? 'border-green-500/20 bg-green-500/5' 
                    : 'border-red-500/20 bg-red-500/5'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-white font-medium text-sm">{result.scenario}</h4>
                  {result.success ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400" />
                  )}
                </div>
                
                <div className="text-xs text-gray-400 space-y-1">
                  <div>Logs: {result.logCount}</div>
                  {result.successRate && (
                    <div>Success Rate: {result.successRate.toFixed(1)}%</div>
                  )}
                  <div>Time: {new Date(result.timestamp).toLocaleTimeString()}</div>
                </div>
                
                {result.error && (
                  <div className="mt-2 text-xs text-red-400 break-words">
                    Error: {result.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default FusionTestSuite
