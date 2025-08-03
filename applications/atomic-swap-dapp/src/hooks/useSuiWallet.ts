import { useState, useEffect } from 'react'
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'

export function useSuiWallet() {
  const account = useCurrentAccount()
  const suiClient = useSuiClient()
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction()
  const [balance, setBalance] = useState<string>('0')
  const [isLoading, setIsLoading] = useState(false)

  // Get balance
  useEffect(() => {
    if (account?.address) {
      updateBalance()
    }
  }, [account?.address])

  const updateBalance = async () => {
    if (!account?.address) return

    try {
      const coins = await suiClient.getCoins({
        owner: account.address,
        coinType: '0x2::sui::SUI'
      })

      let totalBalance = BigInt(0)
      for (const coin of coins.data) {
        totalBalance += BigInt(coin.balance)
      }

      setBalance((Number(totalBalance) / 1e9).toFixed(6)) // Convert to SUI units
    } catch (error) {
      console.error('Failed to get balance:', error)
    }
  }

  // Connect wallet (handled by dapp-kit provider)
  const connectWallet = async () => {
    // This will be handled by the SUI wallet connection UI component
    return account?.address || null
  }

  // Disconnect wallet (handled by dapp-kit provider)
  const disconnectWallet = () => {
    // This will be handled by the SUI wallet connection UI component
  }

  // Sign and execute transaction
  const executeTransaction = async (transaction: Transaction): Promise<string> => {
    return new Promise((resolve, reject) => {
      signAndExecuteTransaction(
        {
          transaction,
        },
        {
          onSuccess: (result: any) => {
            resolve(result.digest)
          },
          onError: (error: any) => {
            reject(error)
          },
        }
      )
    })
  }

  return {
    account,
    balance,
    isLoading,
    updateBalance,
    connectWallet,
    disconnectWallet,
    executeTransaction,
    isConnected: !!account?.address,
  }
}
