// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

/**
 * @title IValidatorNetwork
 * @dev Interface for decentralized cross-chain validation network
 * Defines validator registration, consensus, and slashing mechanisms
 * @author Atomic Swap Protocol
 */
interface IValidatorNetwork {
    
    /// @dev Validator registration information
    struct ValidatorInfo {
        address validatorAddress;       // Validator's Ethereum address
        uint256 stakedAmount;          // Amount of stake deposited
        bool isActive;                 // Validator status
        uint256 registrationTime;     // When validator registered
        uint256 totalExecutions;      // Number of successful executions
        uint256 reputation;            // Validator reputation score
    }

    /// @dev Trade execution bid from validator
    struct ExecutionBid {
        address validator;             // Validator placing bid
        uint256 bidAmount;            // Proposed execution amount
        uint256 bidTimestamp;         // When bid was placed
        bool isActive;                // Bid status
    }

    // ========== Event Declarations ==========
    
    /// @dev Emitted when validator registers with network
    event ValidatorRegistered(
        address indexed validatorAddress,
        uint256 stakedAmount
    );

    /// @dev Emitted when validator is removed from network
    event ValidatorDeregistered(
        address indexed validatorAddress
    );

    /// @dev Emitted when trade is registered with network
    event TradeRegistered(
        bytes32 indexed tradeHash,
        uint256 sourceAmount,
        uint256 targetAmount
    );

    /// @dev Emitted when trade is removed from network
    event TradeDeregistered(
        bytes32 indexed tradeHash
    );

    /// @dev Emitted when validator places execution bid
    event ExecutionBidPlaced(
        bytes32 indexed tradeHash,
        address indexed validator,
        uint256 bidAmount
    );

    /// @dev Emitted when trade is executed by validator
    event TradeExecuted(
        bytes32 indexed tradeHash,
        address indexed validator,
        uint256 executedAmount,
        uint256 currentRate
    );

    /// @dev Emitted when administrator changes
    event AdminChanged(
        address indexed oldAdmin,
        address indexed newAdmin
    );

    // ========== Error Declarations ==========
    
    error OnlyInterchainOrderBook();
    error OnlyAdmin();
    error ValidatorAlreadyRegistered();
    error ValidatorNotRegistered();
    error ValidatorNotAuthorized();
    error InsufficientStake();
    error TradeAlreadyRegistered();
    error TradeNotRegistered();
    error TradeNotActive();
    error InvalidBidAmount();
    error InvalidAddress();

    // ========== Core Functions ==========
    
    /**
     * @dev Registers new validator with required stake
     */
    function registerValidator() external;

    /**
     * @dev Removes validator from network
     */
    function deregisterValidator() external;
    
    /**
     * @dev Registers trade with validator network
     * @param tradeHash Unique trade identifier
     * @param sourceAmount Amount of source assets
     * @param targetAmount Amount of target assets
     */
    function registerTrade(
        bytes32 tradeHash,
        uint256 sourceAmount,
        uint256 targetAmount
    ) external;
    
    /**
     * @dev Removes trade from validator network
     * @param tradeHash Unique trade identifier
     */
    function deregisterTrade(bytes32 tradeHash) external;

    /**
     * @dev Places execution bid for trade
     * @param tradeHash Unique trade identifier
     * @param bidAmount Proposed execution amount
     */
    function placeExecutionBid(
        bytes32 tradeHash,
        uint256 bidAmount
    ) external;

    /**
     * @dev Executes trade through validator network
     * @param tradeHash Unique trade identifier
     * @param executedAmount Amount executed
     * @param currentRate Current exchange rate
     */
    function executeTrade(
        bytes32 tradeHash,
        uint256 executedAmount,
        uint256 currentRate
    ) external;

    // ========== View Functions ==========
    
    /**
     * @dev Checks if address is registered validator
     * @param validator Address to check
     * @return True if validator is registered
     */
    function isRegisteredValidator(address validator) external view returns (bool);

    /**
     * @dev Gets validator information
     * @param validator Validator address
     * @return Validator information struct
     */
    function getValidatorInfo(address validator) external view returns (ValidatorInfo memory);

    /**
     * @dev Gets execution bid for trade
     * @param tradeHash Unique trade identifier
     * @param validator Validator address
     * @return Execution bid information
     */
    function getExecutionBid(
        bytes32 tradeHash,
        address validator
    ) external view returns (ExecutionBid memory);

    /**
     * @dev Checks if trade is registered with network
     * @param tradeHash Unique trade identifier
     * @return True if trade is registered
     */
    function isTradeRegistered(bytes32 tradeHash) external view returns (bool);

    /**
     * @dev Gets required stake amount for validators
     * @return Required stake amount
     */
    function getRequiredStake() external view returns (uint256);
}
