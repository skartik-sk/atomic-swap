// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

/**
 * @title IInterchainOrderBook
 * @dev Interface for cross-chain order management and matching
 * Defines advanced order book operations for atomic swap protocol
 * @author Atomic Swap Protocol
 */
interface IInterchainOrderBook {
    
    /// @dev Current status of interchain trade order
    enum TradeStatus {
        Active,         // Order is live and accepting fills
        Fulfilled,      // Order completely executed
        Cancelled,      // Order cancelled by creator
        Refunded        // Assets returned after expiration
    }

    /// @dev Configuration for dynamic pricing mechanism
    struct PricingConfiguration {
        uint256 auctionStartTime;    // When price discovery begins
        uint256 auctionEndTime;      // When price discovery ends
        uint256 initialRate;         // Starting exchange rate
        uint256 finalRate;           // Ending exchange rate
        uint256 adjustmentFactor;    // Rate of price change
    }

    /// @dev Complete trade order data structure
    struct InterchainTradeOrder {
        bytes32 tradeHash;              // Unique trade identifier
        bytes32 vaultReference;         // Associated vault reference
        address orderCreator;           // Trade initiator
        uint256 sourceAssetAmount;     // Assets offered
        uint256 targetAssetAmount;     // Assets requested
        bytes32 cryptoCommitment;      // Secret commitment hash
        uint256 expirationTimestamp;   // Order expiration time
        bytes32 destinationChainRef;   // Reference to other chain
        TradeStatus currentStatus;     // Current order state
        uint256 orderCreatedAt;        // Order creation time
        uint256 orderSettledAt;        // Order completion time
    }

    // ========== Event Declarations ==========
    
    /// @dev Emitted when new interchain trade order is created
    event InterchainTradeCreated(
        bytes32 indexed tradeHash,
        bytes32 indexed vaultReference,
        address indexed orderCreator,
        uint256 sourceAssetAmount,
        uint256 targetAssetAmount,
        bytes32 cryptoCommitment,
        uint256 expirationTimestamp,
        bytes32 destinationChainRef
    );

    /// @dev Emitted when trade order is partially or fully executed
    event TradeFulfilled(
        bytes32 indexed tradeHash,
        bytes32 indexed vaultReference,
        address indexed executor,
        uint256 executedAmount,
        bytes32 secretReveal,
        uint256 currentRate
    );

    /// @dev Emitted when trade order is successfully completed
    event TradeCompleted(
        bytes32 indexed tradeHash,
        bytes32 indexed vaultReference,
        address indexed executor,
        bytes32 secretReveal
    );

    /// @dev Emitted when trade order is cancelled
    event TradeCancelled(
        bytes32 indexed tradeHash,
        bytes32 indexed vaultReference,
        address indexed orderCreator
    );

    /// @dev Emitted when assets are refunded after expiration
    event TradeRefunded(
        bytes32 indexed tradeHash,
        bytes32 indexed vaultReference,
        address indexed orderCreator
    );

    // ========== Error Declarations ==========
    
    error TradeNotFound();
    error TradeNotActive();
    error TradeExpired();
    error TradeNotExpired();
    error InvalidSecretReveal();
    error UnauthorizedCreator();
    error UnauthorizedExecutor();
    error VaultNotFound();
    error AuctionNotStarted();
    error InsufficientAllowance();

    // ========== Core Functions ==========
    
    /**
     * @dev Creates new interchain trade order with atomic vault
     * @param sourceAssetAmount Amount of assets to offer
     * @param targetAssetAmount Amount of assets to request
     * @param pricingConfig Dynamic pricing configuration
     * @param cryptoCommitment Hash-based secret commitment
     * @param expirationTimestamp Order expiration time
     * @param destinationChainRef Reference to counterpart chain transaction
     * @return tradeHash Unique trade identifier
     * @return vaultReference Associated atomic vault reference
     */
    function createInterchainTrade(
        uint256 sourceAssetAmount,
        uint256 targetAssetAmount,
        PricingConfiguration calldata pricingConfig,
        bytes32 cryptoCommitment,
        uint256 expirationTimestamp,
        bytes32 destinationChainRef
    ) external returns (bytes32 tradeHash, bytes32 vaultReference);

    /**
     * @dev Executes interchain trade by revealing secret
     * @param tradeHash Unique trade identifier
     * @param secretReveal Secret that matches commitment
     */
    function fulfillInterchainTrade(
        bytes32 tradeHash,
        bytes32 secretReveal
    ) external;

    /**
     * @dev Completes interchain trade after successful execution
     * @param tradeHash Unique trade identifier
     * @param secretReveal Revealed secret for verification
     */
    function completeInterchainTrade(
        bytes32 tradeHash,
        bytes32 secretReveal
    ) external;

    /**
     * @dev Cancels active trade order
     * @param tradeHash Unique trade identifier
     */
    function cancelInterchainTrade(bytes32 tradeHash) external;

    /**
     * @dev Processes refund for expired trade
     * @param tradeHash Unique trade identifier
     */
    function processEmergencyRefund(bytes32 tradeHash) external;

    // ========== View Functions ==========
    
    /**
     * @dev Retrieves complete trade order information
     * @param tradeHash Unique trade identifier
     * @return Complete trade order data
     */
    function getInterchainTrade(bytes32 tradeHash) external view returns (
        bytes32 tradeHashReturn,
        bytes32 vaultReference,
        address orderCreator,
        uint256 sourceAssetAmount,
        uint256 targetAssetAmount,
        bytes32 cryptoCommitment,
        uint256 expirationTimestamp,
        bytes32 destinationChainRef,
        TradeStatus currentStatus,
        uint256 orderCreatedAt,
        uint256 orderSettledAt
    );

    /**
     * @dev Gets vault reference for specific trade
     * @param tradeHash Unique trade identifier
     * @return Associated vault reference
     */
    function getVaultForTrade(bytes32 tradeHash) external view returns (bytes32);
    
    /**
     * @dev Gets trade reference for specific vault
     * @param vaultReference Vault reference identifier
     * @return Associated trade hash
     */
    function getTradeForVault(bytes32 vaultReference) external view returns (bytes32);
    
    /**
     * @dev Validates if executor can fulfill specific trade
     * @param tradeHash Unique trade identifier
     * @param executor Address attempting to execute trade
     * @return True if execution is authorized
     */
    function canExecuteTrade(bytes32 tradeHash, address executor) external view returns (bool);
    
    /**
     * @dev Calculates current exchange rate for trade
     * @param tradeHash Unique trade identifier
     * @return Current exchange rate
     */
    function getCurrentRate(bytes32 tradeHash) external view returns (uint256);
    
    /**
     * @dev Checks if trade order has expired
     * @param tradeHash Unique trade identifier
     * @return True if trade is expired
     */
    function isTradeExpired(bytes32 tradeHash) external view returns (bool);
    
    /**
     * @dev Gets current trade status
     * @param tradeHash Unique trade identifier
     * @return Current trade status
     */
    function getTradeStatus(bytes32 tradeHash) external view returns (TradeStatus);
}
