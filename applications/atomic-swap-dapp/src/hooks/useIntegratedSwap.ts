import { useCallback } from 'react'
import { useAtomicSwap } from '@/stores/AtomicSwapStore'
import { useFusionPlusSwap } from './useFusionPlusSwap'
import { SwapExecutionResult } from '@/services/fusionPlusService'
import toast from 'react-hot-toast'

export interface IntegratedSwapParams {
  direction: 'eth-to-sui' | 'sui-to-eth'
  amount: string
  userEthereumAddress?: string
  userSuiAddress?: string
  useEnhancedMode?: boolean
}

export interface UseIntegratedSwapReturn {
  // Combined state from both stores
  isExecuting: boolean
  executionLogs: any[]
  lastResult: SwapExecutionResult | null
  
  // Store states
  atomicSwapState: ReturnType<typeof useAtomicSwap>
  fusionPlusState: ReturnType<typeof useFusionPlusSwap>
  
  // Combined execution function
  executeIntegratedSwap: (params: IntegratedSwapParams) => Promise<SwapExecutionResult>
  
  // Utility functions
  clearAllLogs: () => void
  resetAllStates: () => void
}

export const useIntegratedSwap = (): UseIntegratedSwapReturn => {
  const atomicSwapState = useAtomicSwap()
  const fusionPlusState = useFusionPlusSwap()
  
  const executeIntegratedSwap = useCallback(async (params: IntegratedSwapParams): Promise<SwapExecutionResult> => {
    const { useEnhancedMode = true, ...swapParams } = params
    
    // Validate required addresses
    if (!swapParams.userEthereumAddress || !swapParams.userSuiAddress) {
      throw new Error('Both Ethereum and Sui addresses are required for swaps');
    }
    
    // Create validated swap params
    const validatedSwapParams = {
      direction: swapParams.direction,
      amount: swapParams.amount,
      userEthereumAddress: swapParams.userEthereumAddress,
      userSuiAddress: swapParams.userSuiAddress
    };
    
    try {
      if (useEnhancedMode) {
        // Use Fusion+ enhanced swap
        toast.success('🚀 Initiating Fusion+ enhanced swap', { duration: 2000 })
        
        // Update atomic swap store with progress
        atomicSwapState.updateSwapProgress({
          step: 1,
          total: 8,
          description: 'Initializing Fusion+ enhanced swap',
          status: 'processing'
        })
        
        const result = await fusionPlusState.executeSwap(validatedSwapParams)
        
        if (result.success) {
          // Update atomic swap store with completion
          atomicSwapState.updateSwapProgress({
            step: 8,
            total: 8,
            description: 'Fusion+ swap completed successfully',
            status: 'completed'
          })
          
          // Create mock vaults in atomic swap store for dashboard
          if (params.direction === 'eth-to-sui') {
            atomicSwapState.addVault({
              vaultId: result.escrowId || `fusion-eth-${Date.now()}`,
              initiator: params.userEthereumAddress || '',
              assetAmount: BigInt(Math.floor(parseFloat(params.amount) * 1e18)),
              commitmentHash: result.hashLock || '',
              expirationTimestamp: Date.now() + 3600000,
              counterpartyAddress: params.userSuiAddress || '',
              isActive: false,
              isSettled: true,
              chainType: 'ethereum'
            })
          } else {
            atomicSwapState.addVault({
              vaultId: result.escrowId || `fusion-sui-${Date.now()}`,
              initiator: params.userSuiAddress || '',
              assetAmount: BigInt(Math.floor(parseFloat(params.amount) * 1e9)),
              commitmentHash: result.hashLock || '',
              expirationTimestamp: Date.now() + 3600000,
              counterpartyAddress: params.userEthereumAddress || '',
              isActive: false,
              isSettled: true,
              chainType: 'sui'
            })
          }
        }
        
        // Convert ExtendedSwapResult to SwapExecutionResult for compatibility
        const compatibleResult: SwapExecutionResult = {
          success: result.success,
          logs: result.logs || [],
          escrowId: result.escrowId,
          secret: result.swapData?.merkleRoot,
          hashLock: result.hashLock,
          transactionHashes: result.transactionHashes || { ethereum: [], sui: [] },
          error: result.error
        };
        
        return compatibleResult;
      } else {
        // Use basic atomic swap (implement basic version here if needed)
        toast('🔄 Using basic atomic swap mode', { duration: 2000 })
        
        // For now, redirect to Fusion+ since that's what we've implemented
        const result = await fusionPlusState.executeSwap(validatedSwapParams);
        
        // Convert ExtendedSwapResult to SwapExecutionResult for compatibility
        const compatibleResult: SwapExecutionResult = {
          success: result.success,
          logs: result.logs || [],
          escrowId: result.escrowId,
          secret: result.swapData?.merkleRoot,
          hashLock: result.hashLock,
          transactionHashes: result.transactionHashes || { ethereum: [], sui: [] },
          error: result.error
        };
        
        return compatibleResult;
      }
    } catch (error) {
      atomicSwapState.updateSwapProgress({
        step: 0,
        total: 8,
        description: 'Swap execution failed',
        status: 'failed'
      })
      
      throw error
    }
  }, [atomicSwapState, fusionPlusState])
  
  const clearAllLogs = useCallback(() => {
    fusionPlusState.clearLogs()
    atomicSwapState.setError(null)
    toast.success('🧹 All logs cleared')
  }, [fusionPlusState, atomicSwapState])
  
  const resetAllStates = useCallback(() => {
    fusionPlusState.clearLogs()
    atomicSwapState.clearState()
    toast.success('🔄 All states reset')
  }, [fusionPlusState, atomicSwapState])
  
  return {
    // Combined state
    isExecuting: fusionPlusState.isExecuting || atomicSwapState.isLoading,
    executionLogs: fusionPlusState.executionLogs,
    lastResult: fusionPlusState.lastResult ? {
      success: fusionPlusState.lastResult.success,
      logs: fusionPlusState.lastResult.logs || [],
      escrowId: fusionPlusState.lastResult.escrowId,
      secret: fusionPlusState.lastResult.swapData?.merkleRoot,
      hashLock: fusionPlusState.lastResult.hashLock,
      transactionHashes: fusionPlusState.lastResult.transactionHashes || { ethereum: [], sui: [] },
      error: fusionPlusState.lastResult.error
    } as SwapExecutionResult : null,
    
    // Store states
    atomicSwapState,
    fusionPlusState,
    
    // Functions
    executeIntegratedSwap,
    clearAllLogs,
    resetAllStates
  }
}

export default useIntegratedSwap
