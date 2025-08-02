/**
 * @title verify-bilateral-swap.ts
 * @dev Advanced verification system for cross-chain atomic swap operations
 * @author Atomic Swap Protocol Team
 * @notice Comprehensive verification of bilateral asset exchanges between Ethereum and Sui
 */

import { ethers } from 'ethers';
import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import * as dotenv from 'dotenv';
import chalk from 'chalk';
import ora from 'ora';

dotenv.config();

// ========== Configuration Interface ==========

interface SwapVerificationConfig {
  ethereumRpcUrl: string;
  suiRpcUrl: string;
  ethereumPrivateKey: string;
  suiPrivateKey: string;
  atomicVaultAddress: string;
  interchainOrderBookAddress: string;
  suiPackageId: string;
  wrappedEtherAddress: string;
}

interface BilateralSwapParams {
  sourceAssetAmount: string;
  targetAssetAmount: string;
  secretValue: string;
  expirationDuration: number;
  counterpartyAddress: string;
  ethereumTransactionRef: string;
}

interface SwapVerificationResult {
  success: boolean;
  ethereumVaultHash?: string;
  suiVaultId?: string;
  secretCommitment?: string;
  expirationTimestamp?: number;
  verificationErrors: string[];
  performanceMetrics: {
    ethereumGasUsed?: number;
    suiGasUsed?: number;
    totalExecutionTime: number;
    commitmentVerificationTime: number;
  };
}

// ========== Core Verification Class ==========

class BilateralSwapVerifier {
  private ethereumProvider: ethers.JsonRpcProvider;
  private suiClient: SuiClient;
  private ethereumWallet: ethers.Wallet;
  private suiKeypair: Ed25519Keypair;
  private config: SwapVerificationConfig;

  constructor(config: SwapVerificationConfig) {
    this.config = config;
    this.ethereumProvider = new ethers.JsonRpcProvider(config.ethereumRpcUrl);
    this.suiClient = new SuiClient({ url: config.suiRpcUrl });
    this.ethereumWallet = new ethers.Wallet(config.ethereumPrivateKey, this.ethereumProvider);
    this.suiKeypair = Ed25519Keypair.fromSecretKey(config.suiPrivateKey);
  }

  /**
   * Executes comprehensive bilateral swap verification
   * @param swapParams Parameters for the swap operation
   * @returns Detailed verification results
   */
  async verifyBilateralSwap(swapParams: BilateralSwapParams): Promise<SwapVerificationResult> {
    const startTime = Date.now();
    const spinner = ora('Initiating bilateral swap verification...').start();
    
    const result: SwapVerificationResult = {
      success: false,
      verificationErrors: [],
      performanceMetrics: {
        totalExecutionTime: 0,
        commitmentVerificationTime: 0,
      },
    };

    try {
      // Step 1: Generate cryptographic commitment
      spinner.text = 'Generating cryptographic commitment...';
      const commitmentStartTime = Date.now();
      const secretCommitment = this.generateCryptographicCommitment(swapParams.secretValue);
      result.secretCommitment = secretCommitment;
      result.performanceMetrics.commitmentVerificationTime = Date.now() - commitmentStartTime;

      // Step 2: Establish Ethereum atomic vault
      spinner.text = 'Establishing Ethereum atomic vault...';
      const ethereumResult = await this.establishEthereumVault(swapParams, secretCommitment);
      if (!ethereumResult.success) {
        result.verificationErrors.push(`Ethereum vault creation failed: ${ethereumResult.error}`);
        spinner.fail('Ethereum vault establishment failed');
        return result;
      }
      result.ethereumVaultHash = ethereumResult.vaultHash;
      result.performanceMetrics.ethereumGasUsed = ethereumResult.gasUsed;

      // Step 3: Establish Sui interchain vault
      spinner.text = 'Establishing Sui interchain vault...';
      const suiResult = await this.establishSuiVault(swapParams, secretCommitment);
      if (!suiResult.success) {
        result.verificationErrors.push(`Sui vault creation failed: ${suiResult.error}`);
        spinner.fail('Sui vault establishment failed');
        return result;
      }
      result.suiVaultId = suiResult.vaultId;
      result.performanceMetrics.suiGasUsed = suiResult.gasUsed;

      // Step 4: Cross-verification of vault states
      spinner.text = 'Performing cross-chain state verification...';
      const crossVerification = await this.performCrossChainVerification(
        result.ethereumVaultHash!,
        result.suiVaultId!,
        swapParams
      );
      
      if (!crossVerification.success) {
        result.verificationErrors.push(...crossVerification.errors);
        spinner.fail('Cross-chain verification failed');
        return result;
      }

      // Step 5: Execute atomic settlement test
      spinner.text = 'Testing atomic settlement mechanism...';
      const settlementTest = await this.testAtomicSettlement(
        result.ethereumVaultHash!,
        result.suiVaultId!,
        swapParams.secretValue
      );

      if (!settlementTest.success) {
        result.verificationErrors.push(...settlementTest.errors);
        spinner.fail('Atomic settlement test failed');
        return result;
      }

      result.success = true;
      result.expirationTimestamp = Date.now() + (swapParams.expirationDuration * 1000);
      result.performanceMetrics.totalExecutionTime = Date.now() - startTime;

      spinner.succeed('Bilateral swap verification completed successfully');
      
    } catch (error) {
      result.verificationErrors.push(`Unexpected verification error: ${error}`);
      spinner.fail('Verification process encountered unexpected error');
    }

    return result;
  }

  /**
   * Generates cryptographic commitment for secret value
   * @param secretValue Secret to create commitment for
   * @returns Hexadecimal commitment hash
   */
  private generateCryptographicCommitment(secretValue: string): string {
    const secretBytes = ethers.toUtf8Bytes(secretValue);
    return ethers.keccak256(secretBytes);
  }

  /**
   * Establishes atomic vault on Ethereum network
   * @param swapParams Swap parameters
   * @param commitment Cryptographic commitment
   * @returns Ethereum vault creation result
   */
  private async establishEthereumVault(
    swapParams: BilateralSwapParams,
    commitment: string
  ): Promise<{ success: boolean; vaultHash?: string; gasUsed?: number; error?: string }> {
    try {
      // Atomic Vault contract ABI (simplified for example)
      const atomicVaultAbi = [
        "function establishAtomicVault(uint256 assetAmount, uint256 expirationTimestamp, bytes32 cryptoCommitment, address counterparty, bytes32 externalTradeRef) external returns (bytes32 vaultHash, bytes32 externalRef)",
        "function getVaultDetails(bytes32 vaultHash) external view returns (bytes32, bytes32, address, uint256, uint256, bytes32, address, uint8, uint256, uint256)"
      ];

      const atomicVaultContract = new ethers.Contract(
        this.config.atomicVaultAddress,
        atomicVaultAbi,
        this.ethereumWallet
      );

      const expirationTimestamp = Math.floor(Date.now() / 1000) + swapParams.expirationDuration;
      const assetAmount = ethers.parseEther(swapParams.sourceAssetAmount);
      const externalTradeRef = ethers.keccak256(ethers.toUtf8Bytes(swapParams.ethereumTransactionRef));

      const tx = await atomicVaultContract.establishAtomicVault(
        assetAmount,
        expirationTimestamp,
        commitment,
        swapParams.counterpartyAddress,
        externalTradeRef
      );

      const receipt = await tx.wait();
      const gasUsed = Number(receipt?.gasUsed || 0);

      // Extract vault hash from transaction logs
      const vaultHash = receipt?.logs[0]?.topics[1] || '';

      return {
        success: true,
        vaultHash,
        gasUsed,
      };

    } catch (error) {
      return {
        success: false,
        error: `Ethereum vault establishment failed: ${error}`,
      };
    }
  }

  /**
   * Establishes interchain vault on Sui network
   * @param swapParams Swap parameters
   * @param commitment Cryptographic commitment
   * @returns Sui vault creation result
   */
  private async establishSuiVault(
    swapParams: BilateralSwapParams,
    commitment: string
  ): Promise<{ success: boolean; vaultId?: string; gasUsed?: number; error?: string }> {
    try {
      const tx = new TransactionBlock();
      
      // Convert commitment to Move-compatible format
      const commitmentBytes = Array.from(ethers.getBytes(commitment));
      
      const expirationTimestamp = Date.now() + (swapParams.expirationDuration * 1000);
      const assetAmount = Math.floor(parseFloat(swapParams.targetAssetAmount) * 1e9); // Convert to MIST

      // Call establish_and_share_vault function
      tx.moveCall({
        target: `${this.config.suiPackageId}::interchain_vault_protocol::establish_and_share_vault`,
        typeArguments: ['0x2::sui::SUI'],
        arguments: [
          tx.splitCoins(tx.gas, [tx.pure(assetAmount)]),
          tx.pure(swapParams.counterpartyAddress),
          tx.pure(commitmentBytes),
          tx.pure(expirationTimestamp),
          tx.pure(swapParams.ethereumTransactionRef),
          tx.object('0x6'), // Clock object
        ],
      });

      const result = await this.suiClient.signAndExecuteTransactionBlock({
        signer: this.suiKeypair,
        transactionBlock: tx,
        options: {
          showEvents: true,
          showEffects: true,
        },
      });

      if (result.effects?.status?.status !== 'success') {
        return {
          success: false,
          error: `Sui transaction failed: ${result.effects?.status?.error}`,
        };
      }

      // Extract vault ID from events
      const vaultEvent = result.events?.find(
        event => event.type.includes('VaultEstablished')
      );
      
      const vaultId = vaultEvent?.parsedJson?.vault_identifier || '';
      const gasUsed = Number(result.effects?.gasUsed?.computationCost || 0);

      return {
        success: true,
        vaultId,
        gasUsed,
      };

    } catch (error) {
      return {
        success: false,
        error: `Sui vault establishment failed: ${error}`,
      };
    }
  }

  /**
   * Performs cross-chain state verification
   * @param ethereumVaultHash Ethereum vault hash
   * @param suiVaultId Sui vault ID
   * @param swapParams Original swap parameters
   * @returns Cross-verification result
   */
  private async performCrossChainVerification(
    ethereumVaultHash: string,
    suiVaultId: string,
    swapParams: BilateralSwapParams
  ): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // Verify Ethereum vault state
      const ethereumVaultState = await this.getEthereumVaultState(ethereumVaultHash);
      if (!ethereumVaultState) {
        errors.push('Failed to retrieve Ethereum vault state');
      } else {
        // Verify vault parameters match expectations
        if (ethereumVaultState.assetAmount !== ethers.parseEther(swapParams.sourceAssetAmount)) {
          errors.push('Ethereum vault asset amount mismatch');
        }
      }

      // Verify Sui vault state
      const suiVaultState = await this.getSuiVaultState(suiVaultId);
      if (!suiVaultState) {
        errors.push('Failed to retrieve Sui vault state');
      } else {
        // Verify vault parameters match expectations
        const expectedAmount = Math.floor(parseFloat(swapParams.targetAssetAmount) * 1e9);
        if (suiVaultState.totalAssetAmount !== expectedAmount) {
          errors.push('Sui vault asset amount mismatch');
        }
      }

      // Verify cryptographic commitments match
      if (ethereumVaultState?.cryptoCommitment !== suiVaultState?.cryptographicCommitment) {
        errors.push('Cryptographic commitments do not match between chains');
      }

      return {
        success: errors.length === 0,
        errors,
      };

    } catch (error) {
      errors.push(`Cross-chain verification error: ${error}`);
      return { success: false, errors };
    }
  }

  /**
   * Tests atomic settlement mechanism
   * @param ethereumVaultHash Ethereum vault hash
   * @param suiVaultId Sui vault ID
   * @param secretValue Secret for settlement
   * @returns Settlement test result
   */
  private async testAtomicSettlement(
    ethereumVaultHash: string,
    suiVaultId: string,
    secretValue: string
  ): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // Test Sui settlement first (since it reveals the secret)
      const suiSettlementResult = await this.testSuiSettlement(suiVaultId, secretValue);
      if (!suiSettlementResult.success) {
        errors.push(`Sui settlement test failed: ${suiSettlementResult.error}`);
      }

      // Test Ethereum settlement with revealed secret
      const ethereumSettlementResult = await this.testEthereumSettlement(ethereumVaultHash, secretValue);
      if (!ethereumSettlementResult.success) {
        errors.push(`Ethereum settlement test failed: ${ethereumSettlementResult.error}`);
      }

      return {
        success: errors.length === 0,
        errors,
      };

    } catch (error) {
      errors.push(`Settlement test error: ${error}`);
      return { success: false, errors };
    }
  }

  /**
   * Retrieves Ethereum vault state
   * @param vaultHash Vault hash to query
   * @returns Vault state or null
   */
  private async getEthereumVaultState(vaultHash: string): Promise<any> {
    try {
      const atomicVaultAbi = [
        "function getVaultDetails(bytes32 vaultHash) external view returns (bytes32, bytes32, address, uint256, uint256, bytes32, address, uint8, uint256, uint256)"
      ];

      const atomicVaultContract = new ethers.Contract(
        this.config.atomicVaultAddress,
        atomicVaultAbi,
        this.ethereumProvider
      );

      const vaultDetails = await atomicVaultContract.getVaultDetails(vaultHash);
      
      return {
        vaultHash: vaultDetails[0],
        externalRef: vaultDetails[1],
        initiator: vaultDetails[2],
        assetAmount: vaultDetails[3],
        expirationTimestamp: vaultDetails[4],
        cryptoCommitment: vaultDetails[5],
        counterparty: vaultDetails[6],
        currentState: vaultDetails[7],
        createdAt: vaultDetails[8],
        settledAt: vaultDetails[9],
      };

    } catch (error) {
      console.error('Failed to retrieve Ethereum vault state:', error);
      return null;
    }
  }

  /**
   * Retrieves Sui vault state
   * @param vaultId Vault ID to query
   * @returns Vault state or null
   */
  private async getSuiVaultState(vaultId: string): Promise<any> {
    try {
      const vaultObject = await this.suiClient.getObject({
        id: vaultId,
        options: { showContent: true },
      });

      if (vaultObject.data?.content?.dataType === 'moveObject') {
        const fields = (vaultObject.data.content as any).fields;
        
        return {
          vaultInitiator: fields.vault_initiator,
          authorizedCounterparty: fields.authorized_counterparty,
          totalAssetAmount: parseInt(fields.total_asset_amount),
          remainingAssetBalance: parseInt(fields.remaining_asset_balance),
          cryptographicCommitment: fields.cryptographic_commitment,
          temporalExpiration: parseInt(fields.temporal_expiration),
          settlementStatus: fields.settlement_status,
          creationTimestamp: parseInt(fields.creation_timestamp),
          ethereumTransactionReference: fields.ethereum_transaction_reference,
        };
      }

      return null;

    } catch (error) {
      console.error('Failed to retrieve Sui vault state:', error);
      return null;
    }
  }

  /**
   * Tests Sui vault settlement
   * @param vaultId Vault ID
   * @param secretValue Secret for settlement
   * @returns Test result
   */
  private async testSuiSettlement(
    vaultId: string,
    secretValue: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const tx = new TransactionBlock();
      const secretBytes = Array.from(ethers.toUtf8Bytes(secretValue));

      tx.moveCall({
        target: `${this.config.suiPackageId}::bilateral_swap_examples::verify_settlement_eligibility`,
        typeArguments: ['0x2::sui::SUI'],
        arguments: [
          tx.object(vaultId),
          tx.pure(secretBytes),
          tx.object('0x6'), // Clock object
        ],
      });

      const result = await this.suiClient.devInspectTransactionBlock({
        sender: this.suiKeypair.getPublicKey().toSuiAddress(),
        transactionBlock: tx,
      });

      return {
        success: result.effects.status.status === 'success',
        error: result.effects.status.error,
      };

    } catch (error) {
      return {
        success: false,
        error: `Sui settlement test failed: ${error}`,
      };
    }
  }

  /**
   * Tests Ethereum vault settlement
   * @param vaultHash Vault hash
   * @param secretValue Secret for settlement
   * @returns Test result
   */
  private async testEthereumSettlement(
    vaultHash: string,
    secretValue: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const atomicVaultAbi = [
        "function canClaimVault(bytes32 vaultHash, address claimant) external view returns (bool)"
      ];

      const atomicVaultContract = new ethers.Contract(
        this.config.atomicVaultAddress,
        atomicVaultAbi,
        this.ethereumProvider
      );

      const canClaim = await atomicVaultContract.canClaimVault(
        vaultHash,
        this.ethereumWallet.address
      );

      return {
        success: canClaim,
        error: canClaim ? undefined : 'Vault cannot be claimed by current address',
      };

    } catch (error) {
      return {
        success: false,
        error: `Ethereum settlement test failed: ${error}`,
      };
    }
  }
}

// ========== Main Execution Function ==========

async function main() {
  const config: SwapVerificationConfig = {
    ethereumRpcUrl: process.env.ETHEREUM_RPC_URL || 'http://localhost:8545',
    suiRpcUrl: process.env.SUI_RPC_URL || getFullnodeUrl('testnet'),
    ethereumPrivateKey: process.env.ETHEREUM_PRIVATE_KEY || '',
    suiPrivateKey: process.env.SUI_PRIVATE_KEY || '',
    atomicVaultAddress: process.env.ATOMIC_VAULT_ADDRESS || '',
    interchainOrderBookAddress: process.env.INTERCHAIN_ORDER_BOOK_ADDRESS || '',
    suiPackageId: process.env.SUI_PACKAGE_ID || '',
    wrappedEtherAddress: process.env.WRAPPED_ETHER_ADDRESS || '',
  };

  const swapParams: BilateralSwapParams = {
    sourceAssetAmount: '1.0', // 1 ETH
    targetAssetAmount: '1000.0', // 1000 SUI
    secretValue: 'atomic_swap_secret_2024',
    expirationDuration: 3600, // 1 hour
    counterpartyAddress: '0x742d35Cc6643C0532Eb5e8b8b4bA29f3b6b1C2C5',
    ethereumTransactionRef: 'bilateral_swap_verification_test',
  };

  console.log(chalk.blue('🌉 Atomic Swap Bilateral Swap Verification'));
  console.log(chalk.gray('=====================================\n'));

  const verifier = new BilateralSwapVerifier(config);
  const result = await verifier.verifyBilateralSwap(swapParams);

  console.log('\n' + chalk.blue('📊 Verification Results'));
  console.log(chalk.gray('======================'));

  if (result.success) {
    console.log(chalk.green('✅ Verification Status: SUCCESS'));
    console.log(chalk.cyan(`🔗 Ethereum Vault Hash: ${result.ethereumVaultHash}`));
    console.log(chalk.cyan(`🟣 Sui Vault ID: ${result.suiVaultId}`));
    console.log(chalk.cyan(`🔒 Secret Commitment: ${result.secretCommitment}`));
    console.log(chalk.cyan(`⏰ Expiration: ${new Date(result.expirationTimestamp!).toISOString()}`));
  } else {
    console.log(chalk.red('❌ Verification Status: FAILED'));
    result.verificationErrors.forEach((error, index) => {
      console.log(chalk.red(`   ${index + 1}. ${error}`));
    });
  }

  console.log('\n' + chalk.blue('⚡ Performance Metrics'));
  console.log(chalk.gray('======================'));
  console.log(chalk.yellow(`⏱️  Total Execution Time: ${result.performanceMetrics.totalExecutionTime}ms`));
  console.log(chalk.yellow(`🔐 Commitment Generation: ${result.performanceMetrics.commitmentVerificationTime}ms`));
  if (result.performanceMetrics.ethereumGasUsed) {
    console.log(chalk.yellow(`⛽ Ethereum Gas Used: ${result.performanceMetrics.ethereumGasUsed}`));
  }
  if (result.performanceMetrics.suiGasUsed) {
    console.log(chalk.yellow(`💨 Sui Gas Used: ${result.performanceMetrics.suiGasUsed}`));
  }

  process.exit(result.success ? 0 : 1);
}

if (require.main === module) {
  main().catch(error => {
    console.error(chalk.red('💥 Fatal Error:'), error);
    process.exit(1);
  });
}

export { BilateralSwapVerifier, SwapVerificationConfig, BilateralSwapParams, SwapVerificationResult };
