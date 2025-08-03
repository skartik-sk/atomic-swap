// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

// Ye sab imports zaroori hai, ERC20 ke liye, aur custom security ke liye
import {IERC20} from "@openzeppelin-contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin-contracts/token/ERC20/utils/SafeERC20.sol";
import {IInterchainOrderBook} from "../interfaces/IInterchainOrderBook.sol";
import {IAtomicVault} from "../interfaces/IAtomicVault.sol";
import {IPriceDiscoveryEngine} from "../interfaces/IPriceDiscoveryEngine.sol";
import {IValidatorNetwork} from "../interfaces/IValidatorNetwork.sol";
import {CryptoCommitment} from "../security/CryptoCommitment.sol";
import {TemporalGuard} from "../security/TemporalGuard.sol";


contract MultiChainBazaar is IInterchainOrderBook {
    using SafeERC20 for IERC20; // Safe transfer ke liye
    using CryptoCommitment for bytes32; // Commitment check ke liye
    using TemporalGuard for uint256; // Time guards


    /// @dev
    mapping(bytes32 => BazaarOrder) public trades;

    /// @dev 
    mapping(bytes32 => bytes32) public tradeToLocker;

    /// @dev 
    mapping(bytes32 => bytes32) public lockerToTrade;

    /// @dev 
    IAtomicVault public immutable lockerContract;
    IPriceDiscoveryEngine public immutable priceEngine;
    IValidatorNetwork public immutable validatorNet;
    IERC20 public immutable ethToken;

    /// @dev
    uint256 public tradesMade;
    uint256 public tradesDone;

    /**
     * @dev
     */
    constructor(
        address _lockerContract,
        address _priceEngine,
        address _validatorNet,
        address _ethToken
    ) {
     
        if (
            _lockerContract == address(0) ||
            _priceEngine == address(0) ||
            _validatorNet == address(0) ||
            _ethToken == address(0)
        ) {
            revert WrongAddress();
        }
        lockerContract = IAtomicVault(_lockerContract);
        priceEngine = IPriceDiscoveryEngine(_priceEngine);
        validatorNet = IValidatorNetwork(_validatorNet);
        ethToken = IERC20(_ethToken);
    }

    // ========== Core Functions ==========

    /// @inheritdoc IInterchainOrderBook
    function makeBazaarTrade(
        uint256 fromTokens,
        uint256 toTokens,
        PricingConfiguration calldata pricingStuff,
        bytes32 cryptCommit,
        uint256 expiryTime,
        bytes32 targetChainRef
    ) external returns (bytes32 bazaarHash, bytes32 lockerRef) {
      
        if (fromTokens == 0 || toTokens == 0) revert NotEnoughTokens();
        if (!expiryTime.isReasonableTimestamp()) revert WrongExpiry();
        if (cryptCommit == bytes32(0)) revert WrongCommitment();
        if (!_checkPricingConfig(pricingStuff)) revert AuctionPending();

     
        bazaarHash = keccak256(
            abi.encodePacked(
                msg.sender,
                fromTokens,
                toTokens,
                cryptCommit,
                expiryTime,
                block.timestamp,
                tradesMade
            )
        );

       
        if (trades[bazaarHash].creator != address(0)) revert TradeExists();

        ethToken.safeTransferFrom(msg.sender, address(this), fromTokens);
        ethToken.approve(address(lockerContract), fromTokens);

        // Vault (locker) bana lo
        (bytes32 lockerHash, bytes32 extRef) = lockerContract.establishAtomicVault(
            fromTokens,
            expiryTime,
            cryptCommit,
            address(0), 
            targetChainRef
        );

      
        trades[bazaarHash] = BazaarOrder({
            tradeHash: bazaarHash,
            lockerRef: lockerHash,
            creator: msg.sender,
            fromTokens: fromTokens,
            toTokens: toTokens,
            cryptCommit: cryptCommit,
            expiryTime: expiryTime,
            targetChainRef: targetChainRef,
            status: BazaarStatus.Live,
            createdOn: block.timestamp,
            closedOn: 0
        });

       
                tradeToLocker[bazaarHash] = lockerHash;
        lockerToTrade[lockerHash] = bazaarHash;

   
        validatorNet.registerTrade(bazaarHash, fromTokens, toTokens);

        
        IPriceDiscoveryEngine.DiscoveryParameters memory discoverParams = IPriceDiscoveryEngine.DiscoveryParameters({
            discoveryStartTime: pricingStuff.auctionStartTime,
            discoveryEndTime: pricingStuff.auctionEndTime,
            openingPrice: pricingStuff.initialRate,
            closingPrice: pricingStuff.finalRate,
            priceDecrement: pricingStuff.adjustmentFactor
        });

        priceEngine.startPriceDiscovery(bazaarHash, discoverParams);

        tradesMade++;

        lockerRef = lockerHash;

        emit BazaarTradeCreated(
            bazaarHash,
            lockerHash,
            msg.sender,
            fromTokens,
            toTokens,
            cryptCommit,
            expiryTime,
            targetChainRef
        );
    }

    /// @inheritdoc IInterchainOrderBook
    function executeBazaarTrade(bytes32 bazaarHash, bytes32 secretCode) external {
        BazaarOrder storage order = trades[bazaarHash];


        if (order.creator == address(0)) revert TradeNotFound();
        if (order.status != BazaarStatus.Live) revert TradeNotActive();
        if (order.expiryTime.isExpired()) revert TradeExpired();

        if (!secretCode.verifyCommitment(order.cryptCommit)) revert WrongSecret();

   
        uint256 abhiKaRate = priceEngine.getCurrentPrice(bazaarHash);

        uint256 doneAmount = (order.fromTokens * abhiKaRate) / 1e18;

        validatorNet.executeTrade(bazaarHash, doneAmount, abhiKaRate);

        emit BazaarTradeExecuted(
            bazaarHash,
            order.lockerRef,
            msg.sender,
            doneAmount,
            secretCode,
            abhiKaRate
        );
    }

    /// @inheritdoc IInterchainOrderBook
    function finishBazaarTrade(bytes32 bazaarHash, bytes32 secretCode) external {
        BazaarOrder storage order = trades[bazaarHash];

        // Trade exist karta hai aur active hona chahiye
        if (order.creator == address(0)) revert TradeNotFound();
        if (order.status != BazaarStatus.Live) revert TradeNotActive();

    
        if (!secretCode.verifyCommitment(order.cryptCommit)) revert WrongSecret();

        order.status = BazaarStatus.Executed;
        order.closedOn = block.timestamp;

        validatorNet.deregisterTrade(bazaarHash);

        // Analytics update karo
        tradesDone++;

        emit BazaarTradeFinished(
            bazaarHash,
            order.lockerRef,
            msg.sender,
            secretCode
        );
    }

    /// @inheritdoc IInterchainOrderBook
    function dropBazaarTrade(bytes32 bazaarHash) external {
        BazaarOrder storage order = trades[bazaarHash];

        if (order.creator == address(0)) revert TradeNotFound();
        if (msg.sender != order.creator) revert NotTradeOwner();
        if (order.status != BazaarStatus.Live) revert TradeNotActive();
        if (!order.expiryTime.isExpired()) revert TradeNotExpired();

        order.status = BazaarStatus.Cancelled;
        order.closedOn = block.timestamp;

        validatorNet.deregisterTrade(bazaarHash);

        emit BazaarTradeDropped(
            bazaarHash,
            order.lockerRef,
            msg.sender
        );
    }

    /// @inheritdoc IInterchainOrderBook
    function emergencyBazaarRefund(bytes32 bazaarHash) external {
        BazaarOrder storage order = trades[bazaarHash];

        if (order.creator == address(0)) revert TradeNotFound();
        if (msg.sender != order.creator) revert NotTradeOwner();
        if (order.status != BazaarStatus.Cancelled) revert TradeNotCancelled();

        order.status = BazaarStatus.Refunded;

        emit BazaarTradeRefunded(
            bazaarHash,
            order.lockerRef,
            msg.sender
        );
    }

    /// @inheritdoc IInterchainOrderBook
    function getBazaarOrder(bytes32 bazaarHash) external view returns (
        bytes32 tradeHashReturn,
        bytes32 lockerRef,
        address creator,
        uint256 fromTokens,
        uint256 toTokens,
        bytes32 cryptCommit,
        uint256 expiryTime,
        bytes32 targetChainRef,
        BazaarStatus status,
        uint256 createdOn,
        uint256 closedOn
    ) {
        BazaarOrder memory order = trades[bazaarHash];
        if (order.creator == address(0)) revert TradeNotFound();

        return (
            order.tradeHash,
            order.lockerRef,
            order.creator,
            order.fromTokens,
            order.toTokens,
            order.cryptCommit,
            order.expiryTime,
            order.targetChainRef,
            order.status,
            order.createdOn,
            order.closedOn
        );
    }

    /// @inheritdoc IInterchainOrderBook
    function getLockerForTrade(bytes32 bazaarHash) external view returns (bytes32) {
        return tradeToLocker[bazaarHash];
    }

    /// @inheritdoc IInterchainOrderBook
    function getTradeForLocker(bytes32 lockerRef) external view returns (bytes32) {
        return lockerToTrade[lockerRef];
    }

    /// @inheritdoc IInterchainOrderBook
    function canYouExecuteBazaar(bytes32 bazaarHash, address executor) external view returns (bool) {
        BazaarOrder memory order = trades[bazaarHash];
        return (
            order.creator != address(0) &&
            order.status == BazaarStatus.Live &&
            order.expiryTime.isActive() &&
            validatorNet.isRegisteredValidator(executor)
        );
    }

    /// @inheritdoc IInterchainOrderBook
    function getCurrentBazaarRate(bytes32 bazaarHash) external view returns (uint256) {
        if (trades[bazaarHash].creator == address(0)) revert TradeNotFound();
        return priceEngine.getCurrentPrice(bazaarHash);
    }

    /// @inheritdoc IInterchainOrderBook
    function isBazaarExpired(bytes32 bazaarHash) external view returns (bool) {
        BazaarOrder memory order = trades[bazaarHash];
        if (order.creator == address(0)) revert TradeNotFound();
        return order.expiryTime.isExpired();
    }

    /// @inheritdoc IInterchainOrderBook
    function getBazaarStatus(bytes32 bazaarHash) external view returns (BazaarStatus) {
        BazaarOrder memory order = trades[bazaarHash];
        if (order.creator == address(0)) revert TradeNotFound();
        return order.status;
    }

  

    /**
     * @dev 
     */
    function _checkPricingConfig(PricingConfiguration memory config) internal view returns (bool valid) {
        return (
            config.auctionStartTime <= block.timestamp &&
            config.auctionEndTime > config.auctionStartTime &&
            config.initialRate > 0 &&
            config.finalRate > 0 &&
            config.adjustmentFactor > 0
        );
    }


    error WrongAddress();
    error NotEnoughTokens();
    error WrongExpiry();
    error WrongCommitment();
    error AuctionPending();
    error TradeExists();
    error TradeNotFound();
    error TradeNotActive();
    error TradeExpired();
    error WrongSecret();
    error NotTradeOwner();
    error TradeNotExpired();
    error TradeNotCancelled();


    enum BazaarStatus { Live, Executed, Cancelled, Refunded }

    struct BazaarOrder {
        bytes32 tradeHash;
        bytes32 lockerRef;
        address creator;
        uint256 fromTokens;
        uint256 toTokens;
        bytes32 cryptCommit;
        uint256 expiryTime;
        bytes32 targetChainRef;
        BazaarStatus status;
        uint256 createdOn;
        uint256 closedOn;
    }


    event BazaarTradeCreated(bytes32 tradeHash, bytes32 lockerRef, address creator, uint256 fromTokens, uint256 toTokens, bytes32 cryptCommit, uint256 expiryTime, bytes32 targetChainRef);
    event BazaarTradeExecuted(bytes32 tradeHash, bytes32 lockerRef, address executor, uint256 doneAmount, bytes32 secretCode, uint256 rate);
    event BazaarTradeFinished(bytes32 tradeHash, bytes32 lockerRef, address finisher, bytes32 secretCode);
    event BazaarTradeDropped(bytes32 tradeHash, bytes32 lockerRef, address dropper);
    event BazaarTradeRefunded(bytes32 tradeHash, bytes32 lockerRef, address refunder);
}