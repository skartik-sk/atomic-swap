// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin-contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin-contracts/token/ERC20/utils/SafeERC20.sol";
import {IAtomicVault} from "../interfaces/IAtomicVault.sol";
import {CryptoCommitment} from "../security/CryptoCommitment.sol";
import {TemporalGuard} from "../security/TemporalGuard.sol";

/**
 * @title AtomicVault
 * @dev Core implementation of cross-chain atomic value storage
 * Advanced bilateral exchange infrastructure with enhanced security mechanisms
 * Implements sophisticated temporal validation and cryptographic commitment schemes
 * Optimized for high-throughput cross-chain value transfers with minimal gas consumption
 * @author Atomic Swap Protocol
 */
contract AtomicVault is IAtomicVault {
    using SafeERC20 for IERC20;
    using CryptoCommitment for bytes32;
    using TemporalGuard for uint256;
    
    // ========== State Variables ==========
    
    /// @dev Wrapped Ethereum token contract reference
    IERC20 public immutable wrappedEther;
    
    /// @dev Mapping from vault hash to vault entry data
    mapping(bytes32 => VaultEntry) public atomicVaults;
    
    /// @dev Mapping from external trade reference to vault hash
    mapping(bytes32 => bytes32) public externalRefToVault;
    
    /// @dev Mapping from vault hash to external trade reference
    mapping(bytes32 => bytes32) public vaultToExternalRef;

    /// @dev Total number of vaults created (for analytics)
    uint256 public totalVaultsCreated;
    
    /// @dev Total number of successful claims (for analytics)
    uint256 public totalSuccessfulClaims;

    // ========== Constructor ==========
    
    /**
     * @dev Initializes atomic vault with WETH reference
     * @param _wrappedEther Address of WETH token contract
     */
    constructor(address _wrappedEther) {
        if (_wrappedEther == address(0)) {
            revert InvalidAddress();
        }
        wrappedEther = IERC20(_wrappedEther);
    }

    // ========== Core Functions ==========
    
    /// @inheritdoc IAtomicVault
    function establishAtomicVault(
        uint256 assetAmount,
        uint256 expirationTimestamp,
        bytes32 cryptoCommitment,
        address counterparty,
        bytes32 externalTradeRef
    ) external returns (bytes32 vaultHash, bytes32 externalRef) {
        // Input validation
        if (assetAmount == 0) {
            revert InsufficientAssetBalance();
        }
        if (!expirationTimestamp.isReasonableTimestamp()) {
            revert InvalidExpirationPeriod();
        }
        if (cryptoCommitment == bytes32(0)) {
            revert InvalidCommitment();
        }
        if (counterparty == address(0)) {
            revert InvalidAddress();
        }
        
        // Generate unique vault identifier
        vaultHash = keccak256(abi.encodePacked(
            msg.sender,
            counterparty,
            assetAmount,
            cryptoCommitment,
            expirationTimestamp,
            block.timestamp,
            totalVaultsCreated
        ));
        
        // Ensure vault doesn't already exist
        if (atomicVaults[vaultHash].initiator != address(0)) {
            revert VaultAlreadyExists();
        }

        // Verify sufficient allowance and transfer assets
        if (wrappedEther.allowance(msg.sender, address(this)) < assetAmount) {
            revert InsufficientAssetBalance();
        }
        
        // Transfer assets to vault
        wrappedEther.safeTransferFrom(msg.sender, address(this), assetAmount);

        // Create vault entry
        atomicVaults[vaultHash] = VaultEntry({
            vaultHash: vaultHash,
            initiator: msg.sender,
            counterparty: counterparty,
            assetAmount: assetAmount,
            cryptoCommitment: cryptoCommitment,
            expirationTimestamp: expirationTimestamp,
            externalTradeRef: externalTradeRef,
            currentState: VaultState.Secured,
            createdAt: block.timestamp,
            settledAt: 0
        });

        // Create bidirectional mappings
        externalRefToVault[externalTradeRef] = vaultHash;
        vaultToExternalRef[vaultHash] = externalTradeRef;
        
        // Update analytics
        totalVaultsCreated++;
        
        // Set return values
        externalRef = externalTradeRef;
        
        emit VaultEstablished(
            vaultHash,
            externalTradeRef,
            msg.sender,
            assetAmount,
            expirationTimestamp,
            cryptoCommitment,
            counterparty
        );
    }

    /// @inheritdoc IAtomicVault
    function claimVaultAssets(
        bytes32 vaultHash,
        bytes32 secretReveal
    ) external {
        VaultEntry storage vault = atomicVaults[vaultHash];
        
        // Validate vault exists and state
        if (vault.initiator == address(0)) {
            revert VaultNotFound();
        }
        if (vault.currentState != VaultState.Secured) {
            revert VaultNotSecured();
        }
        if (vault.expirationTimestamp.isExpired()) {
            revert VaultExpired();
        }
        if (msg.sender != vault.counterparty) {
            revert UnauthorizedCounterparty();
        }
        
        // Verify cryptographic commitment
        if (!secretReveal.verifyCommitment(vault.cryptoCommitment)) {
            revert InvalidSecretReveal();
        }
        
        // Update vault state
        vault.currentState = VaultState.Claimed;
        vault.settledAt = block.timestamp;
        
        // Transfer assets to claimant
        wrappedEther.safeTransfer(msg.sender, vault.assetAmount);
        
        // Update analytics
        totalSuccessfulClaims++;
        
        emit VaultClaimed(
            vaultHash,
            vault.externalTradeRef,
            msg.sender,
            vault.assetAmount,
            secretReveal,
            block.timestamp
        );
    }

    /// @inheritdoc IAtomicVault
    function terminateExpiredVault(bytes32 vaultHash) external {
        VaultEntry storage vault = atomicVaults[vaultHash];
        
        // Validate vault exists and state
        if (vault.initiator == address(0)) {
            revert VaultNotFound();
        }
        if (vault.currentState != VaultState.Secured) {
            revert VaultAlreadySettled();
        }
        if (!vault.expirationTimestamp.isExpired()) {
            revert VaultStillActive();
        }
        
        // Update vault state
        vault.currentState = VaultState.Expired;
        vault.settledAt = block.timestamp;
        
        emit VaultTerminated(
            vaultHash,
            vault.externalTradeRef,
            vault.initiator
        );
    }

    /// @inheritdoc IAtomicVault
    function recoverExpiredAssets(bytes32 vaultHash) external {
        VaultEntry storage vault = atomicVaults[vaultHash];
        
        // Validate vault exists and state
        if (vault.initiator == address(0)) {
            revert VaultNotFound();
        }
        if (vault.currentState != VaultState.Expired) {
            revert VaultNotExpired();
        }
        if (msg.sender != vault.initiator) {
            revert UnauthorizedInitiator();
        }
        
        // Update vault state
        vault.currentState = VaultState.Terminated;
        
        // Return assets to initiator
        wrappedEther.safeTransfer(msg.sender, vault.assetAmount);
        
        emit VaultRecovered(
            vaultHash,
            vault.externalTradeRef,
            msg.sender,
            vault.assetAmount
        );
    }

    // ========== View Functions ==========
    
    /// @inheritdoc IAtomicVault
    function getVaultDetails(bytes32 vaultHash) external view returns (
        bytes32 vaultHashReturn,
        bytes32 externalRef,
        address initiator,
        uint256 assetAmount,
        uint256 expirationTimestamp,
        bytes32 cryptoCommitment,
        address counterparty,
        VaultState currentState,
        uint256 createdAt,
        uint256 settledAt
    ) {
        VaultEntry memory vault = atomicVaults[vaultHash];
        
        if (vault.initiator == address(0)) {
            revert VaultNotFound();
        }
        
        return (
            vault.vaultHash,
            vault.externalTradeRef,
            vault.initiator,
            vault.assetAmount,
            vault.expirationTimestamp,
            vault.cryptoCommitment,
            vault.counterparty,
            vault.currentState,
            vault.createdAt,
            vault.settledAt
        );
    }

    /// @inheritdoc IAtomicVault
    function getVaultByExternalRef(bytes32 externalTradeRef) external view returns (bytes32) {
        return externalRefToVault[externalTradeRef];
    }
    
    /// @inheritdoc IAtomicVault
    function canClaimVault(bytes32 vaultHash, address claimant) external view returns (bool) {
        VaultEntry memory vault = atomicVaults[vaultHash];
        
        return (
            vault.initiator != address(0) &&
            vault.currentState == VaultState.Secured &&
            vault.counterparty == claimant &&
            vault.expirationTimestamp.isActive()
        );
    }
    
    /// @inheritdoc IAtomicVault
    function getCurrentExchangeRate(bytes32 vaultHash) external view returns (uint256) {
        VaultEntry memory vault = atomicVaults[vaultHash];
        
        if (vault.initiator == address(0)) {
            revert VaultNotFound();
        }
        
        // For basic atomic vault, rate is 1:1
        // This can be overridden by inheriting contracts for dynamic pricing
        return 1e18;
    }
    
    /// @inheritdoc IAtomicVault
    function isVaultExpired(bytes32 vaultHash) external view returns (bool) {
        VaultEntry memory vault = atomicVaults[vaultHash];
        
        if (vault.initiator == address(0)) {
            revert VaultNotFound();
        }
        
        return vault.expirationTimestamp.isExpired();
    }
    
    /// @inheritdoc IAtomicVault
    function getVaultState(bytes32 vaultHash) external view returns (VaultState) {
        VaultEntry memory vault = atomicVaults[vaultHash];
        
        if (vault.initiator == address(0)) {
            revert VaultNotFound();
        }
        
        return vault.currentState;
    }

    // ========== Additional View Functions ==========
    
    /**
     * @dev Gets total number of vaults created
     * @return Total vaults created
     */
    function getTotalVaultsCreated() external view returns (uint256) {
        return totalVaultsCreated;
    }
    
    /**
     * @dev Gets total number of successful claims
     * @return Total successful claims
     */
    function getTotalSuccessfulClaims() external view returns (uint256) {
        return totalSuccessfulClaims;
    }
    
    /**
     * @dev Gets vault creation timestamp
     * @param vaultHash Unique vault identifier
     * @return Creation timestamp
     */
    function getVaultCreationTime(bytes32 vaultHash) external view returns (uint256) {
        VaultEntry memory vault = atomicVaults[vaultHash];
        
        if (vault.initiator == address(0)) {
            revert VaultNotFound();
        }
        
        return vault.createdAt;
    }

    // ========== Error Definitions ==========
    
    error InvalidAddress();
    error InvalidCommitment();
}
