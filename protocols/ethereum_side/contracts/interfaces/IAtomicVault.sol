// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

/**
 * @title IAtomicVault
 * @dev Interface for cross-chain atomic value storage system
 * Defines standardized methods for bilateral asset exchange operations
 * @author Atomic Swap Protocol
 * @notice Enables trustless bilateral asset exchanges across disparate blockchain networks
 */
interface IAtomicVault {
    /// @dev Enumeration of vault state transitions
    enum VaultState {
        Initialized,     // Vault created and ready for deposits
        Secured,         // Assets locked with cryptographic proof
        Claimed,         // Assets withdrawn by authorized party
        Expired,         // Time-based expiration triggered
        Terminated       // Emergency termination executed
    }

    /// @dev Core vault data structure for atomic swaps
    struct VaultEntry {
        bytes32 vaultHash;           // Unique vault identifier
        address initiator;           // Vault creator and asset provider
        address counterparty;        // Authorized asset recipient
        uint256 assetAmount;         // Locked asset quantity
        bytes32 cryptoCommitment;    // Hash-based secret commitment
        uint256 expirationTimestamp; // Unix timestamp for expiration
        bytes32 externalTradeRef;    // Reference to counterpart transaction
        VaultState currentState;     // Current vault status
        uint256 createdAt;           // Vault creation timestamp
        uint256 settledAt;           // Vault settlement timestamp
    }

    // ========== Event Declarations ==========
    
    /// @dev Emitted when a new atomic vault is established
    event VaultEstablished(
        bytes32 indexed vaultHash,
        bytes32 indexed externalTradeRef,
        address indexed initiator,
        uint256 assetAmount,
        uint256 expirationTimestamp,
        bytes32 cryptoCommitment,
        address counterparty
    );

    /// @dev Emitted when assets are withdrawn from vault
    event VaultClaimed(
        bytes32 indexed vaultHash,
        bytes32 indexed externalTradeRef,
        address indexed claimant,
        uint256 withdrawnAmount,
        bytes32 revealedSecret,
        uint256 currentTimestamp
    );

    /// @dev Emitted when vault is cancelled after expiration
    event VaultTerminated(
        bytes32 indexed vaultHash,
        bytes32 indexed externalTradeRef,
        address indexed initiator
    );

    /// @dev Emitted when assets are recovered post-expiration
    event VaultRecovered(
        bytes32 indexed vaultHash,
        bytes32 indexed externalTradeRef,
        address indexed initiator,
        uint256 recoveredAmount
    );

    // ========== Error Declarations ==========
    
    error VaultNotFound();
    error VaultNotSecured();
    error VaultAlreadySettled();
    error VaultStillActive();
    error VaultExpired();
    error InvalidSecretReveal();
    error UnauthorizedInitiator();
    error UnauthorizedCounterparty();
    error VaultAlreadyExists();
    error InvalidExpirationPeriod();
    error InsufficientAssetBalance();

    // ========== Primary Functions ==========
    
    /**
     * @dev Establishes new atomic vault with cryptographic commitment
     * @param assetAmount Quantity of assets to lock in vault
     * @param expirationTimestamp Unix timestamp when vault expires
     * @param cryptoCommitment Hash of secret for atomic reveal
     * @param counterparty Address authorized to claim assets
     * @param externalTradeRef Reference to external blockchain transaction
     * @return vaultHash Unique identifier for created vault
     * @return externalRef Reference identifier for cross-chain coordination
     */
    function establishAtomicVault(
        uint256 assetAmount,
        uint256 expirationTimestamp,
        bytes32 cryptoCommitment,
        address counterparty,
        bytes32 externalTradeRef
    ) external returns (bytes32 vaultHash, bytes32 externalRef);

    /**
     * @dev Claims assets from vault by revealing secret
     * @param vaultHash Unique vault identifier
     * @param secretReveal Secret that matches cryptographic commitment
     */
    function claimVaultAssets(
        bytes32 vaultHash,
        bytes32 secretReveal
    ) external;

    /**
     * @dev Terminates vault after expiration period
     * @param vaultHash Unique vault identifier
     */
    function terminateExpiredVault(bytes32 vaultHash) external;

    /**
     * @dev Recovers assets from expired vault (initiator only)
     * @param vaultHash Unique vault identifier
     */
    function recoverExpiredAssets(bytes32 vaultHash) external;

    // ========== View Functions ==========
    
    /**
     * @dev Retrieves complete vault information
     * @param vaultHash Unique vault identifier
     * @return Complete vault data structure
     */
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
    );

    /**
     * @dev Gets vault associated with external trade reference
     * @param externalTradeRef External blockchain transaction reference
     * @return Associated vault hash
     */
    function getVaultByExternalRef(bytes32 externalTradeRef) external view returns (bytes32);
    
    /**
     * @dev Validates if counterparty can claim specific vault
     * @param vaultHash Unique vault identifier
     * @param claimant Address attempting to claim assets
     * @return True if claim is authorized
     */
    function canClaimVault(bytes32 vaultHash, address claimant) external view returns (bool);
    
    /**
     * @dev Calculates current exchange rate for vault assets
     * @param vaultHash Unique vault identifier
     * @return Current exchange rate
     */
    function getCurrentExchangeRate(bytes32 vaultHash) external view returns (uint256);
    
    /**
     * @dev Checks if vault has passed expiration time
     * @param vaultHash Unique vault identifier
     * @return True if vault is expired
     */
    function isVaultExpired(bytes32 vaultHash) external view returns (bool);
    
    /**
     * @dev Gets current vault state
     * @param vaultHash Unique vault identifier
     * @return Current vault state enumeration
     */
    function getVaultState(bytes32 vaultHash) external view returns (VaultState);
}
