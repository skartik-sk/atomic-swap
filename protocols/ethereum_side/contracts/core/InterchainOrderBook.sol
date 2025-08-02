// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin-contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin-contracts/token/ERC20/utils/SafeERC20.sol";
import {IInterchainOrderBook} from "../interfaces/IInterchainOrderBook.sol";
import {IAtomicVault} from "../interfaces/IAtomicVault.sol";
import {IPriceDiscoveryEngine} from "../interfaces/IPriceDiscoveryEngine.sol";
import {IValidatorNetwork} from "../interfaces/IValidatorNetwork.sol";
import {CryptoCommitment} from "../security/CryptoCommitment.sol";
import {TemporalGuard} from "../security/TemporalGuard.sol";

/**
 * @title InterchainOrderBook
 * @dev Cross-chain order management with advanced matching algorithms
 * Sophisticated multi-asset order book implementation for atomic swaps
 * Implements dynamic pricing mechanisms and cross-chain order validation
 * Optimized for high-frequency trading with minimal latency
 * @author Atomic Swap Protocol
 */
contract InterchainOrderBook is IInterchainOrderBook {
    using SafeERC20 for IERC20;
    using CryptoCommitment for bytes32;
    using TemporalGuard for uint256;

    // ========== State Variables ==========
    
    /// @dev Mapping from trade hash to trade order data
    mapping(bytes32 => InterchainTradeOrder) public interchainTrades;
    
    /// @dev Mapping from trade hash to vault reference
    mapping(bytes32 => bytes32) public tradeToVault;
    
    /// @dev Mapping from vault reference to trade hash  
    mapping(bytes32 => bytes32) public vaultToTrade;

    /// @dev Contract dependencies
    IAtomicVault public immutable atomicVaultContract;
    IPriceDiscoveryEngine public immutable priceDiscoveryEngine;
    IValidatorNetwork public immutable validatorNetwork;
    IERC20 public immutable wrappedEther;

    /// @dev Analytics counters
    uint256 public totalTradesCreated;
    uint256 public totalTradesCompleted;

    // ========== Constructor ==========
    
    /**
     * @dev Initializes interchain order book with required dependencies
     * @param _atomicVaultContract Address of atomic vault contract
     * @param _priceDiscoveryEngine Address of price discovery engine
     * @param _validatorNetwork Address of validator network
     * @param _wrappedEther Address of WETH token contract
     */
    constructor(
        address _atomicVaultContract,
        address _priceDiscoveryEngine,
        address _validatorNetwork,
        address _wrappedEther
    ) {
        if (_atomicVaultContract == address(0) || 
            _priceDiscoveryEngine == address(0) || 
            _validatorNetwork == address(0) || 
            _wrappedEther == address(0)) {
            revert InvalidAddress();
        }
        
        atomicVaultContract = IAtomicVault(_atomicVaultContract);
        priceDiscoveryEngine = IPriceDiscoveryEngine(_priceDiscoveryEngine);
        validatorNetwork = IValidatorNetwork(_validatorNetwork);
        wrappedEther = IERC20(_wrappedEther);
    }

    // ========== Core Functions ==========
    
    /// @inheritdoc IInterchainOrderBook
    function createInterchainTrade(
        uint256 sourceAssetAmount,
        uint256 targetAssetAmount,
        PricingConfiguration calldata pricingConfig,
        bytes32 cryptoCommitment,
        uint256 expirationTimestamp,
        bytes32 destinationChainRef
    ) external returns (bytes32 tradeHash, bytes32 vaultReference) {
        // Input validation
        if (sourceAssetAmount == 0 || targetAssetAmount == 0) {
            revert InvalidAmount();
        }
        if (!expirationTimestamp.isReasonableTimestamp()) {
            revert InvalidExpirationPeriod();
        }
        if (cryptoCommitment == bytes32(0)) {
            revert InvalidCommitment();
        }
        if (!_isValidPricingConfig(pricingConfig)) {
            revert AuctionNotStarted();
        }

        // Generate unique trade identifier
        tradeHash = keccak256(abi.encodePacked(
            msg.sender,
            sourceAssetAmount,
            targetAssetAmount,
            cryptoCommitment,
            expirationTimestamp,
            block.timestamp,
            totalTradesCreated
        ));

        // Ensure trade doesn't already exist
        if (interchainTrades[tradeHash].orderCreator != address(0)) {
            revert TradeAlreadyExists();
        }

        // Approve vault contract to spend WETH
        wrappedEther.safeTransferFrom(msg.sender, address(this), sourceAssetAmount);
        wrappedEther.approve(address(atomicVaultContract), sourceAssetAmount);

        // Create atomic vault for this trade
        (bytes32 vaultHash, bytes32 externalRef) = atomicVaultContract.establishAtomicVault(
            sourceAssetAmount,
            expirationTimestamp,
            cryptoCommitment,
            address(0), // Open to any validator
            destinationChainRef
        );

        // Create trade order data
        interchainTrades[tradeHash] = InterchainTradeOrder({
            tradeHash: tradeHash,
            vaultReference: vaultHash,
            orderCreator: msg.sender,
            sourceAssetAmount: sourceAssetAmount,
            targetAssetAmount: targetAssetAmount,
            cryptoCommitment: cryptoCommitment,
            expirationTimestamp: expirationTimestamp,
            destinationChainRef: destinationChainRef,
            currentStatus: TradeStatus.Active,
            orderCreatedAt: block.timestamp,
            orderSettledAt: 0
        });

        // Create bidirectional mappings
        tradeToVault[tradeHash] = vaultHash;
        vaultToTrade[vaultHash] = tradeHash;

        // Register with validator network
        validatorNetwork.registerTrade(
            tradeHash,
            sourceAssetAmount,
            targetAssetAmount
        );

        // Initialize price discovery
        IPriceDiscoveryEngine.DiscoveryParameters memory discoveryParams = IPriceDiscoveryEngine.DiscoveryParameters({
            discoveryStartTime: pricingConfig.auctionStartTime,
            discoveryEndTime: pricingConfig.auctionEndTime,
            openingPrice: pricingConfig.initialRate,
            closingPrice: pricingConfig.finalRate,
            priceDecrement: pricingConfig.adjustmentFactor
        });
        
        priceDiscoveryEngine.startPriceDiscovery(tradeHash, discoveryParams);

        // Update analytics
        totalTradesCreated++;
        
        // Set return values
        vaultReference = vaultHash;

        emit InterchainTradeCreated(
            tradeHash,
            vaultHash,
            msg.sender,
            sourceAssetAmount,
            targetAssetAmount,
            cryptoCommitment,
            expirationTimestamp,
            destinationChainRef
        );
    }

    /// @inheritdoc IInterchainOrderBook
    function fulfillInterchainTrade(
        bytes32 tradeHash,
        bytes32 secretReveal
    ) external {
        InterchainTradeOrder storage trade = interchainTrades[tradeHash];
        
        // Validate trade exists and state
        if (trade.orderCreator == address(0)) {
            revert TradeNotFound();
        }
        if (trade.currentStatus != TradeStatus.Active) {
            revert TradeNotActive();
        }
        if (trade.expirationTimestamp.isExpired()) {
            revert TradeExpired();
        }
        
        // Verify cryptographic commitment
        if (!secretReveal.verifyCommitment(trade.cryptoCommitment)) {
            revert InvalidSecretReveal();
        }
        
        // Get current execution rate from price discovery
        uint256 currentRate = priceDiscoveryEngine.getCurrentPrice(tradeHash);
        
        // Calculate executed amount based on current rate
        uint256 executedAmount = (trade.sourceAssetAmount * currentRate) / 1e18;
        
        // Notify validator network
        validatorNetwork.executeTrade(tradeHash, executedAmount, currentRate);
        
        emit TradeFulfilled(
            tradeHash,
            trade.vaultReference,
            msg.sender,
            executedAmount,
            secretReveal,
            currentRate
        );
    }

    /// @inheritdoc IInterchainOrderBook
    function completeInterchainTrade(
        bytes32 tradeHash,
        bytes32 secretReveal
    ) external {
        InterchainTradeOrder storage trade = interchainTrades[tradeHash];
        
        // Validate trade exists and state
        if (trade.orderCreator == address(0)) {
            revert TradeNotFound();
        }
        if (trade.currentStatus != TradeStatus.Active) {
            revert TradeNotActive();
        }
        
        // Verify cryptographic commitment
        if (!secretReveal.verifyCommitment(trade.cryptoCommitment)) {
            revert InvalidSecretReveal();
        }
        
        // Update trade state
        trade.currentStatus = TradeStatus.Fulfilled;
        trade.orderSettledAt = block.timestamp;
        
        // Deregister from validator network
        validatorNetwork.deregisterTrade(tradeHash);
        
        // Update analytics
        totalTradesCompleted++;
        
        emit TradeCompleted(
            tradeHash,
            trade.vaultReference,
            msg.sender,
            secretReveal
        );
    }

    /// @inheritdoc IInterchainOrderBook
    function cancelInterchainTrade(bytes32 tradeHash) external {
        InterchainTradeOrder storage trade = interchainTrades[tradeHash];
        
        // Validate trade exists and authorization
        if (trade.orderCreator == address(0)) {
            revert TradeNotFound();
        }
        if (msg.sender != trade.orderCreator) {
            revert UnauthorizedCreator();
        }
        if (trade.currentStatus != TradeStatus.Active) {
            revert TradeNotActive();
        }
        if (!trade.expirationTimestamp.isExpired()) {
            revert TradeNotExpired();
        }
        
        // Update trade state
        trade.currentStatus = TradeStatus.Cancelled;
        trade.orderSettledAt = block.timestamp;
        
        // Deregister from validator network
        validatorNetwork.deregisterTrade(tradeHash);
        
        emit TradeCancelled(
            tradeHash,
            trade.vaultReference,
            msg.sender
        );
    }

    /// @inheritdoc IInterchainOrderBook
    function processEmergencyRefund(bytes32 tradeHash) external {
        InterchainTradeOrder storage trade = interchainTrades[tradeHash];
        
        // Validate trade exists and authorization
        if (trade.orderCreator == address(0)) {
            revert TradeNotFound();
        }
        if (msg.sender != trade.orderCreator) {
            revert UnauthorizedCreator();
        }
        if (trade.currentStatus != TradeStatus.Cancelled) {
            revert TradeNotCancelled();
        }
        
        // Update trade state
        trade.currentStatus = TradeStatus.Refunded;
        
        emit TradeRefunded(
            tradeHash,
            trade.vaultReference,
            msg.sender
        );
    }

    // ========== View Functions ==========
    
    /// @inheritdoc IInterchainOrderBook
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
    ) {
        InterchainTradeOrder memory trade = interchainTrades[tradeHash];
        
        if (trade.orderCreator == address(0)) {
            revert TradeNotFound();
        }
        
        return (
            trade.tradeHash,
            trade.vaultReference,
            trade.orderCreator,
            trade.sourceAssetAmount,
            trade.targetAssetAmount,
            trade.cryptoCommitment,
            trade.expirationTimestamp,
            trade.destinationChainRef,
            trade.currentStatus,
            trade.orderCreatedAt,
            trade.orderSettledAt
        );
    }

    /// @inheritdoc IInterchainOrderBook
    function getVaultForTrade(bytes32 tradeHash) external view returns (bytes32) {
        return tradeToVault[tradeHash];
    }
    
    /// @inheritdoc IInterchainOrderBook
    function getTradeForVault(bytes32 vaultReference) external view returns (bytes32) {
        return vaultToTrade[vaultReference];
    }
    
    /// @inheritdoc IInterchainOrderBook
    function canExecuteTrade(bytes32 tradeHash, address executor) external view returns (bool) {
        InterchainTradeOrder memory trade = interchainTrades[tradeHash];
        
        return (
            trade.orderCreator != address(0) &&
            trade.currentStatus == TradeStatus.Active &&
            trade.expirationTimestamp.isActive() &&
            validatorNetwork.isRegisteredValidator(executor)
        );
    }
    
    /// @inheritdoc IInterchainOrderBook
    function getCurrentRate(bytes32 tradeHash) external view returns (uint256) {
        if (interchainTrades[tradeHash].orderCreator == address(0)) {
            revert TradeNotFound();
        }
        
        return priceDiscoveryEngine.getCurrentPrice(tradeHash);
    }
    
    /// @inheritdoc IInterchainOrderBook
    function isTradeExpired(bytes32 tradeHash) external view returns (bool) {
        InterchainTradeOrder memory trade = interchainTrades[tradeHash];
        
        if (trade.orderCreator == address(0)) {
            revert TradeNotFound();
        }
        
        return trade.expirationTimestamp.isExpired();
    }
    
    /// @inheritdoc IInterchainOrderBook
    function getTradeStatus(bytes32 tradeHash) external view returns (TradeStatus) {
        InterchainTradeOrder memory trade = interchainTrades[tradeHash];
        
        if (trade.orderCreator == address(0)) {
            revert TradeNotFound();
        }
        
        return trade.currentStatus;
    }

    // ========== Internal Functions ==========
    
    /**
     * @dev Validates pricing configuration parameters
     * @param config Pricing configuration to validate
     * @return isValid True if configuration is valid
     */
    function _isValidPricingConfig(PricingConfiguration memory config) internal view returns (bool isValid) {
        return (
            config.auctionStartTime <= block.timestamp &&
            config.auctionEndTime > config.auctionStartTime &&
            config.initialRate > 0 &&
            config.finalRate > 0 &&
            config.adjustmentFactor > 0
        );
    }

    // ========== Error Definitions ==========
    
    error InvalidAddress();
    error InvalidAmount();
    error InvalidExpirationPeriod();
    error InvalidCommitment();
    error TradeAlreadyExists();
    error TradeNotCancelled();
}
