// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

// Ye imports jaruri hai, ERC20 ke liye aur custom security ke liye
import {IERC20} from "@openzeppelin-contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin-contracts/token/ERC20/utils/SafeERC20.sol";
import {IAtomicVault} from "../interfaces/IAtomicVault.sol";
import {CryptoCommitment} from "../security/CryptoCommitment.sol";
import {TemporalGuard} from "../security/TemporalGuard.sol";

contract NotSoAtomicLocker is IAtomicVault {
    using SafeERC20 for IERC20; // Safe transfer karne ke liye
    using CryptoCommitment for bytes32; // Commitment check karne ke liye
    using TemporalGuard for uint256; // Time check karne ke liye

    // ========== State Variables ==========

    /// @dev
    IERC20 public immutable etherToken;

    /// @dev
    mapping(bytes32 => LockerInfo) public lockers;

    /// @dev
    mapping(bytes32 => bytes32) public refToLocker;

    /// @dev
    mapping(bytes32 => bytes32) public lockerToRef;

    /// @dev
    uint256 public lockersCount;

    /// @dev
    uint256 public claimsDone;

    /**
     * @dev
     * @param _etherToken
     */
    constructor(address _etherToken) {
        if (_etherToken == address(0)) {
            revert WrongAddress();
        }
        etherToken = IERC20(_etherToken);
    }

    /// @inheritdoc IAtomicVault
    function makeLocker(
        uint256 tokenQty,
        uint256 expiryTime,
        bytes32 cryptCommitment,
        address buddy,
        bytes32 externalRef
    ) external returns (bytes32 lockerHash, bytes32 outRef) {
        // Ye check hai, asset zero na ho
        if (tokenQty == 0) revert NotEnoughTokens();
        // Time valid hai ya nahi, yaha check
        if (!expiryTime.isReasonableTimestamp()) revert WrongExpiry();
        // Commitment zero na ho, check
        if (cryptCommitment == bytes32(0)) revert WrongCommitment();
        // Buddy address valid ho
        if (buddy == address(0)) revert WrongAddress();

        // Locker ka unique hash banao
        lockerHash = keccak256(
            abi.encodePacked(
                msg.sender,
                buddy,
                tokenQty,
                cryptCommitment,
                expiryTime,
                block.timestamp,
                lockersCount
            )
        );
        if (lockers[lockerHash].owner != address(0)) revert LockerExists();

        if (etherToken.allowance(msg.sender, address(this)) < tokenQty)
            revert NotEnoughTokens();

        etherToken.safeTransferFrom(msg.sender, address(this), tokenQty);

        // Locker create karo
        lockers[lockerHash] = LockerInfo({
            lockerHash: lockerHash,
            owner: msg.sender,
            buddy: buddy,
            tokenQty: tokenQty,
            cryptCommitment: cryptCommitment,
            expiryTime: expiryTime,
            externalRef: externalRef,
            status: LockerStatus.Locked,
            createdOn: block.timestamp,
            closedOn: 0
        });

        refToLocker[externalRef] = lockerHash;
        lockerToRef[lockerHash] = externalRef;

        lockersCount++;
        ro outRef = externalRef;

        emit LockerMade(
            lockerHash,
            externalRef,
            msg.sender,
            tokenQty,
            expiryTime,
            cryptCommitment,
            buddy
        );
    }

    /// @inheritdoc IAtomicVault
    function unlockTokens(bytes32 lockerHash, bytes32 secretCode) external {
        LockerInfo storage locker = lockers[lockerHash];

        if (locker.owner == address(0)) revert LockerNotFound();
        if (locker.status != LockerStatus.Locked) revert LockerNotLocked();
        if (locker.expiryTime.isExpired()) revert LockerExpired();
        if (msg.sender != locker.buddy) revert NotBuddy();

        if (!secretCode.verifyCommitment(locker.cryptCommitment))
            revert WrongSecret();

        locker.status = LockerStatus.Unlocked;
        locker.closedOn = block.timestamp;

        etherToken.safeTransfer(msg.sender, locker.tokenQty);

        claimsDone++;

        emit LockerUnlocked(
            lockerHash,
            locker.externalRef,
            msg.sender,
            locker.tokenQty,
            secretCode,
            block.timestamp
        );
    }

    /// @inheritdoc IAtomicVault
    function forceCloseLocker(bytes32 lockerHash) external {
        LockerInfo storage locker = lockers[lockerHash];

        if (locker.owner == address(0)) revert LockerNotFound();
        if (locker.status != LockerStatus.Locked) revert LockerAlreadyClosed();
        if (!locker.expiryTime.isExpired()) revert LockerActive();

        locker.status = LockerStatus.Expired;
        locker.closedOn = block.timestamp;

        emit LockerForceClosed(lockerHash, locker.externalRef, locker.owner);
    }

    /// @inheritdoc IAtomicVault
    function getBackExpiredTokens(bytes32 lockerHash) external {
        LockerInfo storage locker = lockers[lockerHash];

        if (locker.owner == address(0)) revert LockerNotFound();
        if (locker.status != LockerStatus.Expired) revert LockerNotExpired();
        if (msg.sender != locker.owner) revert NotOwner();

        locker.status = LockerStatus.Closed;

        etherToken.safeTransfer(msg.sender, locker.tokenQty);

        emit LockerTokensReturned(
            lockerHash,
            locker.externalRef,
            msg.sender,
            locker.tokenQty
        );
    }

    /// @inheritdoc IAtomicVault
    function lockerInfo(
        bytes32 lockerHash
    )
        external
        view
        returns (
            bytes32 hash,
            bytes32 extRef,
            address owner,
            uint256 qty,
            uint256 expiryTime,
            bytes32 commitment,
            address buddy,
            LockerStatus status,
            uint256 createdOn,
            uint256 closedOn
        )
    {
        LockerInfo memory locker = lockers[lockerHash];
        if (locker.owner == address(0)) revert LockerNotFound();

        return (
            locker.lockerHash,
            locker.externalRef,
            locker.owner,
            locker.tokenQty,
            locker.expiryTime,
            locker.cryptCommitment,
            locker.buddy,
            locker.status,
            locker.createdOn,
            locker.closedOn
        );
    }

    /// @inheritdoc IAtomicVault
    function getLockerByRef(
        bytes32 externalRef
    ) external view returns (bytes32) {
        return refToLocker[externalRef];
    }

    /// @inheritdoc IAtomicVault
    function canUnlockLocker(
        bytes32 lockerHash,
        address unlocker
    ) external view returns (bool) {
        LockerInfo memory locker = lockers[lockerHash];
        return (locker.owner != address(0) &&
            locker.status == LockerStatus.Locked &&
            locker.buddy == unlocker &&
            locker.expiryTime.isActive());
    }

    /// @inheritdoc IAtomicVault
    function getDummyRate(bytes32 lockerHash) external view returns (uint256) {
        LockerInfo memory locker = lockers[lockerHash];
        if (locker.owner == address(0)) revert LockerNotFound();
        return 1e18;
    }

    /// @inheritdoc IAtomicVault
    function isLockerExpired(bytes32 lockerHash) external view returns (bool) {
        LockerInfo memory locker = lockers[lockerHash];
        if (locker.owner == address(0)) revert LockerNotFound();
        return locker.expiryTime.isExpired();
    }

    /// @inheritdoc IAtomicVault
    function getLockerStatus(
        bytes32 lockerHash
    ) external view returns (LockerStatus) {
        LockerInfo memory locker = lockers[lockerHash];
        if (locker.owner == address(0)) revert LockerNotFound();
        return locker.status;
    }

    /**
     * @dev
     */
    function totalLockers() external view returns (uint256) {
        return lockersCount;
    }

    /**
     * @dev
     */
    function totalClaimsDone() external view returns (uint256) {
        return claimsDone;
    }

    /**
     * @dev
     */
    function getLockerCreation(
        bytes32 lockerHash
    ) external view returns (uint256) {
        LockerInfo memory locker = lockers[lockerHash];
        if (locker.owner == address(0)) revert LockerNotFound();
        return locker.createdOn;
    }

    error WrongAddress();
    error WrongCommitment();
    error NotEnoughTokens();
    error LockerExists();
    error LockerNotFound();
    error LockerNotLocked();
    error LockerExpired();
    error NotBuddy();
    error WrongSecret();
    error LockerAlreadyClosed();
    error LockerActive();
    error LockerNotExpired();
    error NotOwner();

    enum LockerStatus {
        Locked,
        Unlocked,
        Expired,
        Closed
    }

    struct LockerInfo {
        bytes32 lockerHash;
        address owner;
        address buddy;
        uint256 tokenQty;
        bytes32 cryptCommitment;
        uint256 expiryTime;
        bytes32 externalRef;
        LockerStatus status;
        uint256 createdOn;
        uint256 closedOn;
    }

    event LockerMade(
        bytes32 lockerHash,
        bytes32 externalRef,
        address owner,
        uint256 tokenQty,
        uint256 expiryTime,
        bytes32 cryptCommitment,
        address buddy
    );
    event LockerUnlocked(
        bytes32 lockerHash,
        bytes32 externalRef,
        address buddy,
        uint256 tokenQty,
        bytes32 secretCode,
        uint256 timestamp
    );
    event LockerForceClosed(
        bytes32 lockerHash,
        bytes32 externalRef,
        address owner
    );
    event LockerTokensReturned(
        bytes32 lockerHash,
        bytes32 externalRef,
        address owner,
        uint256 tokenQty
    );
}
