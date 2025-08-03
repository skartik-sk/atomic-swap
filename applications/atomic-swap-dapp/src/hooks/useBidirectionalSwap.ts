import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { parseEther } from 'viem';
import { toast } from 'react-hot-toast';
import { BidirectionalSwapService } from '../services/bidirectionalSwapService';
import { ethtosui, suiToEth } from '@/services/atomic-swap';

export interface ExtendedSwapResult {
  success: boolean;
  logs: SwapLog[];
  escrowId?: string;
  secret?: string;
  hashLock?: string;
  error?: string;
  transactionHashes: {
    ethereum: string[];
    sui: string[];
  };
  swapData?: any;
}

export interface SwapLog {
  id: string;
  timestamp: number;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  step: string;
  details?: any;
  transactionHash?: string;
  explorerUrl?: string;
}

export function useBidirectionalSwap() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [lastResult, setLastResult] = useState<ExtendedSwapResult | null>(null);
  const [executionLogs, setExecutionLogs] = useState<SwapLog[]>([]);
  const [swapService] = useState(() => new BidirectionalSwapService());
  const { address } = useAccount();

  const addLog = useCallback((level: SwapLog['level'], message: string, step: string, details?: any) => {
    const log: SwapLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      level,
      message,
      step,
      details,
      transactionHash: details?.transactionHash,
      explorerUrl: details?.explorerUrl
    };
    
    setExecutionLogs(prev => [...prev, log]);
    
    // Show toast notification
    const emoji = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    }[level];
    
    const toastMessage = `${emoji} ${message}`;
    
    switch (level) {
      case 'success':
        toast.success(toastMessage);
        break;
      case 'error':
        toast.error(toastMessage);
        break;
      case 'warning':
        toast(toastMessage, { icon: '⚠️' });
        break;
      default:
        toast(toastMessage);
    }
  }, []);

  const executeEthToSuiSwap = useCallback(async (
    ethAmount: string,
    userEthereumAddress: string,
    userSuiAddress: string
  ): Promise<void> => {
    setIsLoading(true);
    setCurrentStep('Initializing ETH → SUI swap');
    setLastResult(null);
    setExecutionLogs([]);

    try {
      addLog('info', 'Starting ETH → SUI swap', 'initialization', {
        ethAmount,
        userEthereumAddress,
        userSuiAddress
      });

      // Step 1: Validate inputs
      setCurrentStep('Validating swap parameters');
      addLog('info', 'Validating swap parameters', 'validation');
      
      if (!userEthereumAddress || !userSuiAddress || !ethAmount) {
        throw new Error('Missing required swap parameters');
      }

      const ethAmountBigInt = parseEther(ethAmount);
      if (ethAmountBigInt <= 0n) {
        throw new Error('Invalid ETH amount');
      }

      // Step 2: Execute the swap using the service
      setCurrentStep('Executing cross-chain swap');
      addLog('info', 'Executing enhanced cross-chain swap', 'execution');

      await ethtosui(
        (step: string, status: 'info' | 'success' | 'warning' | 'error', message: string, details?: any) => {
          setCurrentStep(step);
          addLog(status, message, step, details);
          
          // Check if swap is completed successfully
          if (details?.swapComplete || (status === 'success' && step.includes('Completion'))) {
            setCurrentStep('Swap completed successfully');
            
            // Create a successful result with transaction hashes
            const successResult: ExtendedSwapResult = {
              success: true,
              logs: executionLogs,
              transactionHashes: details?.transactionHashes || { ethereum: [], sui: [] },
              swapData: {
                direction: 'eth-to-sui',
                ethAmount: ethAmount,
                status: 'completed'
              }
            };
            setLastResult(successResult);
          }
        },
        ethAmount // Pass the user's ETH amount to the service
      );

      // if (result) {
      //   addLog('success', 'ETH → SUI swap completed successfully!', 'completion', result);
      //   setCurrentStep('Swap completed successfully');
      // } else {
      //   throw new Error(result.error || 'Swap execution failed');
      // }

      // const extendedResult: ExtendedSwapResult = {
      //   ...result,
      //   logs: executionLogs,
      //   transactionHashes: result.transactionHashes || { ethereum: [], sui: [] }
      // };

      // setLastResult(extendedResult);
      // return extendedResult;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addLog('error', `ETH → SUI swap failed: ${errorMessage}`, 'error');
      setCurrentStep('Swap failed');

      const errorResult: ExtendedSwapResult = {
        success: false,
        error: errorMessage,
        logs: executionLogs,
        transactionHashes: { ethereum: [], sui: [] },
        swapData: {
          direction: 'eth-to-sui',
          ethAmount: ethAmount,
          status: 'failed'
        }
      };

      setLastResult(errorResult);
     // return errorResult;
    } finally {
      setIsLoading(false);
    }
  }, [addLog, executionLogs, swapService]);

  const executeSuiToEthSwap = useCallback(async (
    suiAmount: string,
    userSuiAddress: string,
    userEthereumAddress: string
  ): Promise<void> => {
    setIsLoading(true);
    setCurrentStep('Initializing SUI → ETH swap');
    setLastResult(null);
    setExecutionLogs([]);

    try {
      addLog('info', 'Starting SUI → ETH swap', 'initialization', {
        suiAmount,
        userSuiAddress,
        userEthereumAddress
      });

      // Step 1: Validate inputs
      setCurrentStep('Validating swap parameters');
      addLog('info', 'Validating swap parameters', 'validation');
      
      if (!userEthereumAddress || !userSuiAddress || !suiAmount) {
        throw new Error('Missing required swap parameters');
      }

      const suiAmountNumber = parseFloat(suiAmount);
      if (suiAmountNumber <= 0) {
        throw new Error('Invalid SUI amount');
      }

      const suiAmountBigInt = BigInt(Math.floor(suiAmountNumber * 1e9)); // SUI has 9 decimals

      // Step 2: Execute the swap using the service
      setCurrentStep('Executing cross-chain swap');
      addLog('info', 'Executing enhanced cross-chain swap', 'execution');

      await suiToEth(
        (step: string, status: 'info' | 'success' | 'warning' | 'error', message: string, details?: any) => {
          setCurrentStep(step);
          addLog(status, message, step, details);
          
          // Check if swap is completed successfully
          if (details?.swapComplete || (status === 'success' && step.includes('Completion'))) {
            setCurrentStep('Swap completed successfully');
            
            // Create a successful result with transaction hashes
            const successResult: ExtendedSwapResult = {
              success: true,
              logs: executionLogs,
              transactionHashes: details?.transactionHashes || { ethereum: [], sui: [] },
              swapData: {
                direction: 'sui-to-eth',
                suiAmount: suiAmount,
                status: 'completed'
              }
            };
            setLastResult(successResult);
          }
        },
        suiAmount // Pass the user's SUI amount to the service
      );

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addLog('error', `SUI → ETH swap failed: ${errorMessage}`, 'error');
      setCurrentStep('Swap failed');

      const errorResult: ExtendedSwapResult = {
        success: false,
        error: errorMessage,
        logs: executionLogs,
        transactionHashes: { ethereum: [], sui: [] },
        swapData: {
          direction: 'sui-to-eth',
          suiAmount: suiAmount,
          status: 'failed'
        }
      };

      setLastResult(errorResult);
      // return errorResult;
    } finally {
      setIsLoading(false);
    }
  }, [addLog, executionLogs, swapService]);

  const resetState = useCallback(() => {
    setLastResult(null);
    setIsLoading(false);
    setCurrentStep('');
    setExecutionLogs([]);
    swapService.clearLogs();
  }, [swapService]);

  const clearLogs = useCallback(() => {
    setExecutionLogs([]);
    swapService.clearLogs();
  }, [swapService]);

  // Calculate log statistics
  const totalLogs = executionLogs.length;
  const successCount = executionLogs.filter(log => log.level === 'success').length;
  const errorCount = executionLogs.filter(log => log.level === 'error').length;
  const warningCount = executionLogs.filter(log => log.level === 'warning').length;

  return {
    // Swap execution
    executeEthToSuiSwap,
    executeSuiToEthSwap,
    
    // State
    isLoading,
    isExecuting: isLoading,
    currentStep,
    lastResult,
    userAddress: address,
    
    // Logs
    executionLogs,
    clearLogs,
    totalLogs,
    successCount,
    errorCount,
    warningCount,
    
    // Utilities
    resetState,
    swapService
  };
}

export default useBidirectionalSwap;
