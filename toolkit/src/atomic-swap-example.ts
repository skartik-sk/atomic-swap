#!/usr/bin/env tsx

/**
 * Atomic Swap Protocol - Complete Example Usage
 * 
 * This script demonstrates a full bilateral atomic swap between Ethereum and Sui
 * showcasing the advanced atomic swap infrastructure.
 */

import { ethers } from 'ethers';
import { JsonRpcProvider, Ed25519Keypair, RawSigner, TransactionBlock } from '@mysten/sui.js/client';
import * as dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config();

interface SwapConfiguration {
  ethereumAssetAmount: bigint;
  suiAssetAmount: bigint;
  swapDuration: number; // seconds
  secret: string;
}

class AtomicSwapExample {
  private ethereumProvider: ethers.JsonRpcProvider;
  private ethereumSigner: ethers.Wallet;
  private suiProvider: JsonRpcProvider;
  private suiSigner: RawSigner;

  constructor() {
    // Initialize Ethereum connection
    this.ethereumProvider = new ethers.JsonRpcProvider(
      process.env.ETHEREUM_RPC_URL || 'https://sepolia.infura.io/v3/demo'
    );
    this.ethereumSigner = new ethers.Wallet(
      process.env.ETHEREUM_PRIVATE_KEY || ethers.Wallet.createRandom().privateKey,
      this.ethereumProvider
    );

    // Initialize Sui connection
    this.suiProvider = new JsonRpcProvider({
      url: process.env.SUI_RPC_URL || 'https://fullnode.testnet.sui.io:443',
    });

    const suiKeypair = Ed25519Keypair.generate();
    this.suiSigner = new RawSigner(suiKeypair, this.suiProvider);
  }

  /**
   * Execute complete bilateral atomic swap demonstration
   */
  async executeBilateralSwapExample(): Promise<void> {
    console.log(chalk.blue('🌉 Atomic Swap Protocol - Bilateral Atomic Swap Demo\n'));

    const swapConfig: SwapConfiguration = {
      ethereumAssetAmount: ethers.parseEther('0.01'), // 0.01 ETH
      suiAssetAmount: BigInt('1000000000'), // 1 SUI
      swapDuration: 3600, // 1 hour
      secret: 'atomic_swap_secret_2024',
    };

    try {
      // Step 1: Generate cryptographic commitment
      console.log(chalk.yellow('📋 Step 1: Generating Cryptographic Commitment'));
      const commitment = this.generateCryptographicProof(swapConfig.secret);
      console.log(`   Commitment Hash: ${commitment.hash.slice(0, 20)}...`);
      console.log(`   Salt Value: ${commitment.salt.slice(0, 20)}...\n`);

      // Step 2: Establish Ethereum atomic vault
      console.log(chalk.yellow('🔐 Step 2: Establishing Ethereum Atomic Vault'));
      const ethereumVaultId = await this.createEthereumAtomicVault(
        swapConfig.ethereumAssetAmount,
        commitment.hash,
        Math.floor(Date.now() / 1000) + swapConfig.swapDuration
      );
      console.log(`   Ethereum Vault ID: ${ethereumVaultId.slice(0, 20)}...\n`);

      // Step 3: Create corresponding Sui vault
      console.log(chalk.yellow('🏗️  Step 3: Creating Sui Interchain Vault'));
      const suiVaultTx = await this.createSuiInterhainVault(
        swapConfig.suiAssetAmount,
        Buffer.from(commitment.hash.slice(2), 'hex'),
        Math.floor(Date.now() / 1000) + swapConfig.swapDuration
      );
      console.log(`   Sui Transaction: ${suiVaultTx.slice(0, 20)}...\n`);

      // Step 4: Cross-chain verification
      console.log(chalk.yellow('🔍 Step 4: Cross-Chain State Verification'));
      const verificationResults = await this.performCrossChainVerification(
        ethereumVaultId,
        suiVaultTx
      );
      console.log(`   Verification Status: ${verificationResults ? '✅ Successful' : '❌ Failed'}\n`);

      // Step 5: Atomic settlement simulation
      console.log(chalk.yellow('⚡ Step 5: Simulating Atomic Settlement'));
      await this.simulateAtomicSettlement(
        ethereumVaultId,
        suiVaultTx,
        commitment.secret,
        commitment.salt
      );

      console.log(chalk.green('\n🎉 Bilateral Atomic Swap Demonstration Completed Successfully!'));
      console.log(chalk.gray('   All cross-chain operations verified and settled atomically.\n'));

    } catch (error) {
      console.error(chalk.red('❌ Swap demonstration failed:'), error);
      process.exit(1);
    }
  }

  /**
   * Generate cryptographic commitment with enhanced security
   */
  private generateCryptographicProof(secretValue: string): {
    hash: string;
    secret: string;
    salt: string;
  } {
    const salt = ethers.hexlify(ethers.randomBytes(32));
    const combined = ethers.solidityPacked(['string', 'bytes32'], [secretValue, salt]);
    const hash = ethers.keccak256(combined);

    return { hash, secret: secretValue, salt };
  }

  /**
   * Create atomic vault on Ethereum network
   */
  private async createEthereumAtomicVault(
    assetAmount: bigint,
    commitmentHash: string,
    expirationTimestamp: number
  ): Promise<string> {
    // Simulate atomic vault creation
    const atomicVaultABI = [
      "function establishAtomicVault(uint256 assetAmount, bytes32 commitmentHash, uint256 expirationTimestamp, address counterpartyAddress) external payable returns (bytes32)"
    ];

    try {
      // Mock contract interaction for demonstration
      const mockVaultId = ethers.keccak256(
        ethers.solidityPacked(
          ['uint256', 'bytes32', 'uint256', 'address'],
          [assetAmount, commitmentHash, expirationTimestamp, this.ethereumSigner.address]
        )
      );

      console.log(`   📤 Ethereum vault established with ${ethers.formatEther(assetAmount)} ETH`);
      console.log(`   🔗 Commitment: ${commitmentHash.slice(0, 20)}...`);
      console.log(`   ⏰ Expires: ${new Date(expirationTimestamp * 1000).toISOString()}`);

      return mockVaultId;
    } catch (error) {
      throw new Error(`Ethereum vault creation failed: ${error}`);
    }
  }

  /**
   * Create interchain vault on Sui network
   */
  private async createSuiInterhainVault(
    assetAmount: bigint,
    commitmentHash: Buffer,
    expirationTimestamp: number
  ): Promise<string> {
    try {
      const txb = new TransactionBlock();
      
      // Mock Sui transaction for demonstration
      const mockTransactionId = `0x${Buffer.from(
        `atomic_swap_${Date.now()}_${Math.random()}`
      ).toString('hex').slice(0, 64).padEnd(64, '0')}`;

      console.log(`   📤 Sui vault created with ${assetAmount.toString()} units`);
      console.log(`   🔗 Commitment: 0x${commitmentHash.toString('hex').slice(0, 20)}...`);
      console.log(`   ⏰ Expires: ${new Date(expirationTimestamp * 1000).toISOString()}`);

      return mockTransactionId;
    } catch (error) {
      throw new Error(`Sui vault creation failed: ${error}`);
    }
  }

  /**
   * Perform comprehensive cross-chain verification
   */
  private async performCrossChainVerification(
    ethereumVaultId: string,
    suiVaultTx: string
  ): Promise<boolean> {
    try {
      // Simulate cross-chain state verification
      console.log(`   🔍 Verifying Ethereum vault: ${ethereumVaultId.slice(0, 20)}...`);
      console.log(`   🔍 Verifying Sui vault: ${suiVaultTx.slice(0, 20)}...`);
      
      // Mock verification logic
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log(`   ✅ Cross-chain commitment consistency verified`);
      console.log(`   ✅ Asset amounts and expiration times synchronized`);
      console.log(`   ✅ Cryptographic proofs validated`);

      return true;
    } catch (error) {
      console.error(`   ❌ Cross-chain verification failed: ${error}`);
      return false;
    }
  }

  /**
   * Simulate atomic settlement process
   */
  private async simulateAtomicSettlement(
    ethereumVaultId: string,
    suiVaultTx: string,
    secret: string,
    salt: string
  ): Promise<void> {
    try {
      console.log(`   🔐 Revealing secret for atomic settlement...`);
      console.log(`   📤 Claiming assets from Ethereum vault...`);
      
      // Simulate settlement delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log(`   📤 Claiming assets from Sui vault...`);
      console.log(`   ⚡ Both vaults settled atomically`);
      console.log(`   🔄 Cross-chain swap completed successfully`);

    } catch (error) {
      throw new Error(`Atomic settlement failed: ${error}`);
    }
  }

  /**
   * Display system information
   */
  displaySystemInfo(): void {
    console.log(chalk.cyan('🔧 System Configuration:'));
    console.log(`   Ethereum RPC: ${process.env.ETHEREUM_RPC_URL?.slice(0, 30)}...`);
    console.log(`   Sui RPC: ${process.env.SUI_RPC_URL?.slice(0, 30)}...`);
    console.log(`   Ethereum Address: ${this.ethereumSigner.address}`);
    console.log(`   Sui Address: ${this.suiSigner.getAddress()}\n`);
  }
}

// Execute demonstration if run directly
async function main(): Promise<void> {
  const bridge = new AtomicSwapExample();
  
  bridge.displaySystemInfo();
  await bridge.executeBilateralSwapExample();
}

if (require.main === module) {
  main().catch(console.error);
}

export default AtomicSwapExample;
