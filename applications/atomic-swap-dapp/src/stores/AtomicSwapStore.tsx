import React, { createContext, useContext, ReactNode } from 'react'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { ethers } from 'ethers'

// Atomic Swap Store Types
export interface AtomicVaultState {
  vaultId: string
  initiator: string
  assetAmount: bigint
  commitmentHash: string
  expirationTimestamp: number
  counterpartyAddress: string
  isActive: boolean
  isSettled: boolean
  chainType: 'ethereum' | 'sui'
}

export interface SwapProgress {
  step: number
  total: number
  description: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  transactionHash?: string
}

export interface AtomicSwapState {
  // Connection State
  isEthereumConnected: boolean
  isSuiConnected: boolean
  ethereumAddress: string | null
  suiAddress: string | null
  
  // Vault Management
  activeVaults: AtomicVaultState[]
  vaultHistory: AtomicVaultState[]
  
  // Swap State
  currentSwap: {
    ethereumVaultId: string | null
    suiVaultId: string | null
    progress: SwapProgress | null
    secret: string | null
    commitment: {
      hash: string
      salt: string
    } | null
  }
  
  // UI State
  isLoading: boolean
  error: string | null
  
  // Actions
  setEthereumConnection: (connected: boolean, address?: string) => void
  setSuiConnection: (connected: boolean, address?: string) => void
  addVault: (vault: AtomicVaultState) => void
  updateVault: (vaultId: string, updates: Partial<AtomicVaultState>) => void
  startSwap: (ethereumVaultId: string, suiVaultId: string) => void
  updateSwapProgress: (progress: SwapProgress) => void
  completeSwap: () => void
  setError: (error: string | null) => void
  setLoading: (loading: boolean) => void
  generateCommitment: (secret: string) => { hash: string; salt: string }
  clearState: () => void
}

// Create Zustand Store
export const useAtomicSwapStore = create<AtomicSwapState>()(
  devtools(
    (set) => ({
      // Initial State
      isEthereumConnected: false,
      isSuiConnected: false,
      ethereumAddress: null,
      suiAddress: null,
      activeVaults: [],
      vaultHistory: [],
      currentSwap: {
        ethereumVaultId: null,
        suiVaultId: null,
        progress: null,
        secret: null,
        commitment: null,
      },
      isLoading: false,
      error: null,

      // Actions
      setEthereumConnection: (connected, address) =>
        set({
          isEthereumConnected: connected,
          ethereumAddress: address || null,
        }),

      setSuiConnection: (connected, address) =>
        set({
          isSuiConnected: connected,
          suiAddress: address || null,
        }),

      addVault: (vault) =>
        set((state) => ({
          activeVaults: [...state.activeVaults, vault],
        })),

      updateVault: (vaultId, updates) =>
        set((state) => ({
          activeVaults: state.activeVaults.map((vault) =>
            vault.vaultId === vaultId ? { ...vault, ...updates } : vault
          ),
        })),

      startSwap: (ethereumVaultId, suiVaultId) =>
        set({
          currentSwap: {
            ethereumVaultId,
            suiVaultId,
            progress: {
              step: 1,
              total: 5,
              description: 'Initiating bilateral atomic swap',
              status: 'processing',
            },
            secret: null,
            commitment: null,
          },
        }),

      updateSwapProgress: (progress) =>
        set((state) => ({
          currentSwap: {
            ...state.currentSwap,
            progress,
          },
        })),

      completeSwap: () =>
        set((state) => ({
          currentSwap: {
            ethereumVaultId: null,
            suiVaultId: null,
            progress: null,
            secret: null,
            commitment: null,
          },
          vaultHistory: [
            ...state.vaultHistory,
            ...state.activeVaults.filter(
              (v) =>
                v.vaultId === state.currentSwap.ethereumVaultId ||
                v.vaultId === state.currentSwap.suiVaultId
            ),
          ],
          activeVaults: state.activeVaults.filter(
            (v) =>
              v.vaultId !== state.currentSwap.ethereumVaultId &&
              v.vaultId !== state.currentSwap.suiVaultId
          ),
        })),

      setError: (error) => set({ error }),
      setLoading: (loading) => set({ isLoading: loading }),

      generateCommitment: (secret: string) => {
        const salt = ethers.hexlify(ethers.randomBytes(32))
        const combined = ethers.solidityPacked(['string', 'bytes32'], [secret, salt])
        const hash = ethers.keccak256(combined)
        
        set((state) => ({
          currentSwap: {
            ...state.currentSwap,
            secret,
            commitment: { hash, salt },
          },
        }))
        
        return { hash, salt }
      },

      clearState: () =>
        set({
          activeVaults: [],
          vaultHistory: [],
          currentSwap: {
            ethereumVaultId: null,
            suiVaultId: null,
            progress: null,
            secret: null,
            commitment: null,
          },
          error: null,
          isLoading: false,
        }),
    }),
    {
      name: 'atomic-swap-store',
    }
  )
)

// React Context Provider
const AtomicSwapContext = createContext<AtomicSwapState | null>(null)

export const AtomicSwapProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const store = useAtomicSwapStore()

  return (
    <AtomicSwapContext.Provider value={store}>
      {children}
    </AtomicSwapContext.Provider>
  )
}

// Custom Hook
export const useAtomicSwap = () => {
  const context = useContext(AtomicSwapContext)
  if (!context) {
    throw new Error('useAtomicSwap must be used within AtomicSwapProvider')
  }
  return context
}

export default useAtomicSwapStore
