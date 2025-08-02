import { ethers } from 'ethers';
import { Connection, Ed25519Keypair, JsonRpcProvider, RawSigner, TransactionBlock } from '@mysten/sui.js/client';
import { BCS, getSuiMoveConfig } from '@mysten/bcs';
import * as dotenv from 'dotenv';

dotenv.config();

export interface NetworkConfiguration {
  ethereum: {
    rpcUrl: string;
    privateKey: string;
    atomicVaultAddress: string;
    interchainOrderBookAddress: string;
    wrappedEtherAddress: string;
  };
  sui: {
    rpcUrl: string;
    privateKey: string;
    packageId: string;
  };
}

export class AtomicSwapSDK {
  private ethereumProvider: ethers.JsonRpcProvider;
  private ethereumSigner: ethers.Wallet;
  private suiProvider: JsonRpcProvider;
  private suiSigner: RawSigner;
  private config: NetworkConfiguration;

  constructor(config: NetworkConfiguration) {
    this.config = config;
    
    // Initialize Ethereum connection
    this.ethereumProvider = new ethers.JsonRpcProvider(config.ethereum.rpcUrl);
    this.ethereumSigner = new ethers.Wallet(config.ethereum.privateKey, this.ethereumProvider);
    
    // Initialize Sui connection
    this.suiProvider = new JsonRpcProvider({
      url: config.sui.rpcUrl,
    });
    
    const suiKeypair = Ed25519Keypair.fromSecretKey(
      Uint8Array.from(Buffer.from(config.sui.privateKey.replace('0x', ''), 'hex'))
    );
    this.suiSigner = new RawSigner(suiKeypair, this.suiProvider);
  }

  /**
   * Create a new atomic vault on Ethereum
   */
  async initiateAtomicVault(
    assetAmount: bigint,
    commitmentHash: string,
    expirationTimestamp: number,
    counterpartyAddress: string
  ): Promise<string> {
    const atomicVaultABI = [
      "function establishAtomicVault(uint256 assetAmount, bytes32 commitmentHash, uint256 expirationTimestamp, address counterpartyAddress) external payable returns (bytes32)"
    ];

    const atomicVault = new ethers.Contract(
      this.config.ethereum.atomicVaultAddress,
      atomicVaultABI,
      this.ethereumSigner
    );

    const tx = await atomicVault.establishAtomicVault(
      assetAmount,
      commitmentHash,
      expirationTimestamp,
      counterpartyAddress,
      { value: assetAmount }
    );

    const receipt = await tx.wait();
    return receipt.transactionHash;
  }

  /**
   * Create corresponding vault on Sui network
   */
  async createSuiVault(
    assetAmount: bigint,
    commitmentHash: Uint8Array,
    expirationTimestamp: number,
    counterpartyAddress: string
  ): Promise<string> {
    const txb = new TransactionBlock();
    
    txb.moveCall({
      target: `${this.config.sui.packageId}::interchain_vault_protocol::establish_bilateral_vault`,
      arguments: [
        txb.pure(assetAmount.toString()),
        txb.pure(Array.from(commitmentHash)),
        txb.pure(expirationTimestamp),
        txb.pure(counterpartyAddress),
      ],
    });

    const result = await this.suiSigner.signAndExecuteTransactionBlock({
      transactionBlock: txb,
      options: {
        showEffects: true,
      },
    });

    return result.digest;
  }

  /**
   * Claim assets from Ethereum vault
   */
  async claimEthereumAssets(
    vaultId: string,
    secretValue: string,
    saltValue: string
  ): Promise<string> {
    const atomicVaultABI = [
      "function claimVaultAssets(bytes32 vaultId, string memory secretValue, bytes32 saltValue) external"
    ];

    const atomicVault = new ethers.Contract(
      this.config.ethereum.atomicVaultAddress,
      atomicVaultABI,
      this.ethereumSigner
    );

    const tx = await atomicVault.claimVaultAssets(vaultId, secretValue, saltValue);
    const receipt = await tx.wait();
    return receipt.transactionHash;
  }

  /**
   * Claim assets from Sui vault
   */
  async claimSuiAssets(
    vaultId: string,
    secretValue: string,
    saltValue: Uint8Array
  ): Promise<string> {
    const txb = new TransactionBlock();
    
    txb.moveCall({
      target: `${this.config.sui.packageId}::interchain_vault_protocol::claim_vault_assets`,
      arguments: [
        txb.pure(vaultId),
        txb.pure(secretValue),
        txb.pure(Array.from(saltValue)),
      ],
    });

    const result = await this.suiSigner.signAndExecuteTransactionBlock({
      transactionBlock: txb,
      options: {
        showEffects: true,
      },
    });

    return result.digest;
  }

  /**
   * Get vault status from Ethereum
   */
  async getEthereumVaultStatus(vaultId: string): Promise<any> {
    const atomicVaultABI = [
      "function getVaultInformation(bytes32 vaultId) external view returns (address initiator, uint256 assetAmount, bytes32 commitmentHash, uint256 expirationTimestamp, address counterpartyAddress, bool isActive, bool isSettled)"
    ];

    const atomicVault = new ethers.Contract(
      this.config.ethereum.atomicVaultAddress,
      atomicVaultABI,
      this.ethereumProvider
    );

    return await atomicVault.getVaultInformation(vaultId);
  }

  /**
   * Get vault status from Sui
   */
  async getSuiVaultStatus(vaultId: string): Promise<any> {
    // This would use Sui's view function capabilities
    const result = await this.suiProvider.getObject({
      id: vaultId,
      options: {
        showContent: true,
      },
    });

    return result;
  }

  /**
   * Generate cryptographic commitment
   */
  generateCommitment(secretValue: string, saltValue?: string): {
    hash: string;
    secret: string;
    salt: string;
  } {
    const salt = saltValue || ethers.hexlify(ethers.randomBytes(32));
    const combined = ethers.solidityPacked(['string', 'bytes32'], [secretValue, salt]);
    const hash = ethers.keccak256(combined);

    return {
      hash,
      secret: secretValue,
      salt,
    };
  }

  /**
   * Verify cross-chain vault pair consistency
   */
  async verifyCrossChainConsistency(
    ethereumVaultId: string,
    suiVaultId: string
  ): Promise<boolean> {
    try {
      const [ethVault, suiVault] = await Promise.all([
        this.getEthereumVaultStatus(ethereumVaultId),
        this.getSuiVaultStatus(suiVaultId),
      ]);

      // Verify matching parameters
      const commitmentMatch = ethVault.commitmentHash === suiVault.commitmentHash;
      const amountMatch = ethVault.assetAmount.toString() === suiVault.assetAmount.toString();
      const expirationMatch = ethVault.expirationTimestamp === suiVault.expirationTimestamp;

      return commitmentMatch && amountMatch && expirationMatch;
    } catch (error) {
      console.error('Cross-chain verification failed:', error);
      return false;
    }
  }
}

// Export utility functions
export function loadConfiguration(): NetworkConfiguration {
  return {
    ethereum: {
      rpcUrl: process.env.ETHEREUM_RPC_URL || '',
      privateKey: process.env.ETHEREUM_PRIVATE_KEY || '',
      atomicVaultAddress: process.env.ATOMIC_VAULT_ADDRESS || '',
      interchainOrderBookAddress: process.env.INTERCHAIN_ORDER_BOOK_ADDRESS || '',
      wrappedEtherAddress: process.env.WRAPPED_ETHER_ADDRESS || '',
    },
    sui: {
      rpcUrl: process.env.SUI_RPC_URL || '',
      privateKey: process.env.SUI_PRIVATE_KEY || '',
      packageId: process.env.SUI_PACKAGE_ID || '',
    },
  };
}

export default AtomicSwapSDK;
