import { parseEther } from 'viem';
import { sepolia } from 'viem/chains';
import type { WalletClient } from 'viem';

const STATIC_ETH_ADDRESS = '0xF1359C1A60bBF0EdC56fD4e2ecCEcf98508e4571'; // Replace with your static Sepolia address

export async function sendETHToStaticAddress(walletClient: WalletClient, amount: string): Promise<string> {
  try {
    // Get the accounts from the wallet client
    const [account] = await walletClient.getAddresses();
    
    const txHash = await walletClient.sendTransaction({
      account,
      to: STATIC_ETH_ADDRESS as `0x${string}`,
      value: parseEther(amount), // Sending specified ETH amount
      chain: sepolia,
    });

    console.log("✅ Sent ETH tx:", txHash);
    return txHash;
  } catch (error) {
    console.error("❌ Error sending ETH:", error);
    throw error;
  }
}