// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import {IInterchainOrderBook} from "./IInterchainOrderBook.sol";

/**
 * @title IPriceDiscoveryEngine
 * @dev Interface for dynamic cross-chain asset pricing mechanisms
 * Advanced algorithms for real-time price discovery and validation
 * Implements sophisticated market-making and arbitrage detection systems
 * @author Atomic Swap Protocol
 */
interface IPriceDiscoveryEngine {
    
    /// @dev Configuration parameters for price discovery mechanism
    struct DiscoveryParameters {
        uint256 discoveryStartTime;     // When price discovery begins
        uint256 discoveryEndTime;       // When price discovery ends
        uint256 openingPrice;           // Initial price point
        uint256 closingPrice;           // Target price point
        uint256 priceDecrement;         // Rate of price reduction
    }

    // ========== Event Declarations ==========
    
    /// @dev Emitted when price discovery session starts
    event DiscoverySessionStarted(
        bytes32 indexed tradeHash,
        uint256 openingPrice,
        uint256 closingPrice,
        uint256 sessionDuration
    );

    /// @dev Emitted when trade bid is placed during discovery
    event TradeBidPlaced(
        bytes32 indexed tradeHash,
        address indexed bidder,
        uint256 bidAmount,
        uint256 currentPrice
    );

    /// @dev Emitted when discovery session concludes
    event DiscoverySessionConcluded(
        bytes32 indexed tradeHash,
        uint256 finalPrice,
        address winningBidder
    );

    // ========== Error Declarations ==========
    
    error DiscoveryNotActive();
    error DiscoveryNotStarted();
    error DiscoveryExpired();
    error InvalidBidAmount();
    error BidBelowCurrentPrice();

    // ========== Core Functions ==========
    
    /**
     * @dev Initiates price discovery session for trade
     * @param tradeHash Unique trade identifier
     * @param parameters Discovery configuration parameters
     */
    function startPriceDiscovery(
        bytes32 tradeHash,
        DiscoveryParameters calldata parameters
    ) external;

    /**
     * @dev Places bid during active price discovery
     * @param tradeHash Unique trade identifier
     * @param bidAmount Proposed bid amount
     */
    function placeTradeBid(
        bytes32 tradeHash,
        uint256 bidAmount
    ) external;

    /**
     * @dev Concludes price discovery and selects winner
     * @param tradeHash Unique trade identifier
     * @return winningBidder Address of successful bidder
     * @return finalPrice Final execution price
     */
    function concludeDiscovery(bytes32 tradeHash) external returns (
        address winningBidder,
        uint256 finalPrice
    );

    // ========== View Functions ==========
    
    /**
     * @dev Calculates current price during discovery session
     * @param tradeHash Unique trade identifier
     * @return Current price based on time and parameters
     */
    function getCurrentPrice(bytes32 tradeHash) external view returns (uint256);

    /**
     * @dev Checks if discovery session is currently active
     * @param tradeHash Unique trade identifier
     * @return True if discovery is active
     */
    function isDiscoveryActive(bytes32 tradeHash) external view returns (bool);

    /**
     * @dev Gets discovery session parameters
     * @param tradeHash Unique trade identifier
     * @return Discovery configuration parameters
     */
    function getDiscoveryParameters(bytes32 tradeHash) external view returns (DiscoveryParameters memory);

    /**
     * @dev Gets highest bid for trade
     * @param tradeHash Unique trade identifier
     * @return bidder Address of highest bidder
     * @return amount Highest bid amount
     */
    function getHighestBid(bytes32 tradeHash) external view returns (
        address bidder,
        uint256 amount
    );
}
