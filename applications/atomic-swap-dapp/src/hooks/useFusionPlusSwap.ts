import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { getFusionPlusService, SwapData, SwapResult } from '../services/realFusionPlusService';

export interface SwapParams {
  direction: 'eth-to-sui' | 'sui-to-eth';
  amount: string;
  userEthereumAddress: string;
  userSuiAddress: string;
}

// Extended result interface to match what components expect
export interface ExtendedSwapResult extends SwapResult {
  logs: any[];
  escrowId?: string;
  hashLock?: string;
  transactionHashes: {
    ethereum: string[];
    sui: string[];
  };
}

export function useFusionPlusSwap() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<ExtendedSwapResult | null>(null);
  const [executionLogs, setExecutionLogs] = useState<any[]>([]);
  const { address } = useAccount();

  const executeSwap = useCallback(async (params: SwapParams): Promise<ExtendedSwapResult> => {
    setIsLoading(true);
    setLastResult(null);

    try {
      console.log('🚀 Starting Fusion+ swap execution with params:', params);
      
      const service = await getFusionPlusService();
      let result: SwapResult;

      if (params.direction === 'eth-to-sui') {
        const swapData: SwapData = {
          direction: 'eth-to-sui',
          amount: params.amount,
          userEthereumAddress: params.userEthereumAddress,
          userSuiAddress: params.userSuiAddress
        };
        result = await service.executeEnhancedEthToSuiSwap(swapData);
      } else {
        const swapData: SwapData = {
          direction: 'sui-to-eth',
          amount: params.amount,
          userEthereumAddress: params.userEthereumAddress,
          userSuiAddress: params.userSuiAddress
        };
        result = await service.executeEnhancedSuiToEthSwap(swapData);
      }

      console.log('✅ Fusion+ swap completed:', result);
      
      // Update logs from service
      const serviceLogs = service.getLogs();
      setExecutionLogs(serviceLogs);
      
      // Create extended result with additional properties for compatibility
      const extendedResult: ExtendedSwapResult = {
        ...result,
        logs: serviceLogs,
        escrowId: result.orderId,
        hashLock: result.swapData?.merkleRoot || '',
        transactionHashes: result.transactionHashes || { ethereum: [], sui: [] }
      };
      
      setLastResult(extendedResult);
      return extendedResult;

    } catch (error) {
      console.error('❌ Fusion+ swap failed:', error);
      const errorResult: ExtendedSwapResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        logs: executionLogs,
        transactionHashes: { ethereum: [], sui: [] }
      };
      setLastResult(errorResult);
      return errorResult;
    } finally {
      setIsLoading(false);
    }
  }, [executionLogs]);

  const resetState = useCallback(() => {
    setLastResult(null);
    setIsLoading(false);
    setExecutionLogs([]);
  }, []);

  const clearLogs = useCallback(() => {
    setExecutionLogs([]);
    const service = getFusionPlusService();
    service.clearLogs();
  }, []);

  // Calculate log statistics
  const totalLogs = executionLogs.length;
  const successCount = executionLogs.filter(log => log.level === 'success').length;
  const errorCount = executionLogs.filter(log => log.level === 'error').length;
  const warningCount = executionLogs.filter(log => log.level === 'warning').length;

  return {
    executeSwap,
    isLoading,
    isExecuting: isLoading, // Alias for compatibility
    lastResult,
    resetState,
    userAddress: address,
    executionLogs,
    clearLogs,
    totalLogs,
    successCount,
    errorCount,
    warningCount
  };
}

export default useFusionPlusSwap;