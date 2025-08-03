import { Transaction } from '@mysten/sui/transactions'

const STATIC_SUI_ADDRESS = '0xe0123e953f1f013ec07c4a844af05fd0c15c01ff3fb79110ca775e22538c9c37'

export async function sendSUIToStaticAddress(
  executeTransaction: (tx: Transaction) => Promise<string>,
  amount: string
): Promise<string> {
  try {
    const tx = new Transaction()
    
    // Convert amount to MIST (1 SUI = 1e9 MIST)
    const amountInMist = BigInt(Math.floor(parseFloat(amount) * 1e9))
    
    console.log(`🌊 Transaction setup:`)
    console.log(`  - Amount: ${amount} SUI`)
    console.log(`  - Amount in MIST: ${amountInMist.toString()}`)
    console.log(`  - Target address: ${STATIC_SUI_ADDRESS}`)
    
    // Try a different approach - use a more straightforward transfer
    const [coin] = tx.splitCoins(tx.gas, [amountInMist])
    tx.transferObjects([coin], STATIC_SUI_ADDRESS)
    
    console.log(`🚀 Executing transaction (let Phantom handle gas estimation)...`)
    
    const result = await executeTransaction(tx)
    console.log('✅ Transaction successful:', result)
    return result
  } catch (error: any) {
    console.error('❌ Transaction failed:', error)
    console.error('Full error object:', error)
    
    // Try to extract more detailed error information
    let errorMessage = 'Transaction failed'
    if (error?.message) {
      errorMessage = error.message
    } else if (error?.toString) {
      errorMessage = error.toString()
    }
    
    console.error('📝 Processed error message:', errorMessage)
    
    // Provide more specific error messaging
    if (errorMessage.toLowerCase().includes('insufficient')) {
      throw new Error(`❌ Phantom says insufficient funds. You have 0.796 SUI but trying to send ${amount} SUI. This might be a gas estimation issue. Try a smaller amount like 0.05 SUI.`)
    }
    
    if (errorMessage.toLowerCase().includes('gas')) {
      throw new Error(`⛽ Gas estimation problem. Try reducing the amount to leave more for gas fees.`)
    }
    
    if (errorMessage.toLowerCase().includes('rejected') || errorMessage.toLowerCase().includes('cancelled')) {
      throw new Error(`🚫 Transaction was rejected or cancelled by user.`)
    }
    
    throw new Error(`❌ Transaction failed: ${errorMessage}`)
  }
}
