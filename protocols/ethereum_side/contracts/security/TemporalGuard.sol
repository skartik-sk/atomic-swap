// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

/**
 * @title TemporalGuard
 * @dev Temporal security enforcement for cross-chain operations
 * Advanced time-based validation with multiple security layers
 * @author Atomic Swap Protocol
 * @notice Provides temporal validation and expiration control functionality
 */
library TemporalGuard {
    
    /// @dev Standard duration constants (in seconds)
    uint256 public constant MINIMUM_DURATION = 300;        // 5 minutes
    uint256 public constant STANDARD_DURATION = 3600;      // 1 hour
    uint256 public constant EXTENDED_DURATION = 86400;     // 24 hours
    uint256 public constant MAXIMUM_DURATION = 604800;     // 7 days

    /// @dev Error thrown when invalid duration is provided
    error InvalidDuration();
    
    /// @dev Error thrown when timestamp validation fails
    error InvalidTimestamp();

    /**
     * @dev Creates expiration timestamp with specified duration
     * @param durationSeconds Duration in seconds from current time
     * @return expirationTimestamp Future timestamp when expiration occurs
     */
    function createExpirationTimestamp(
        uint256 durationSeconds
    ) internal view returns (uint256 expirationTimestamp) {
        if (durationSeconds < MINIMUM_DURATION || durationSeconds > MAXIMUM_DURATION) {
            revert InvalidDuration();
        }
        
        expirationTimestamp = block.timestamp + durationSeconds;
    }

    /**
     * @dev Validates if given duration is within acceptable bounds
     * @param durationSeconds Duration to validate
     * @return isValid True if duration is valid
     */
    function isValidDuration(uint256 durationSeconds) internal pure returns (bool isValid) {
        isValid = (durationSeconds >= MINIMUM_DURATION && durationSeconds <= MAXIMUM_DURATION);
    }

    /**
     * @dev Checks if timestamp has passed (expired)
     * @param expirationTimestamp Timestamp to check against current time
     * @return isExpired True if timestamp has passed
     */
    function isExpired(uint256 expirationTimestamp) internal view returns (bool isExpired) {
        isExpired = (block.timestamp >= expirationTimestamp);
    }

    /**
     * @dev Checks if timestamp is still active (not expired)
     * @param expirationTimestamp Timestamp to check against current time
     * @return isActive True if timestamp is still in future
     */
    function isActive(uint256 expirationTimestamp) internal view returns (bool isActive) {
        isActive = (block.timestamp < expirationTimestamp);
    }

    /**
     * @dev Calculates remaining time until expiration
     * @param expirationTimestamp Future timestamp
     * @return remainingSeconds Seconds remaining (0 if expired)
     */
    function getRemainingTime(
        uint256 expirationTimestamp
    ) internal view returns (uint256 remainingSeconds) {
        if (block.timestamp >= expirationTimestamp) {
            remainingSeconds = 0;
        } else {
            remainingSeconds = expirationTimestamp - block.timestamp;
        }
    }

    /**
     * @dev Validates timestamp is reasonable (not too far in past/future)
     * @param timestamp Timestamp to validate
     * @return isReasonable True if timestamp is reasonable
     */
    function isReasonableTimestamp(uint256 timestamp) internal view returns (bool isReasonable) {
        // Cannot be in past (with 1 minute tolerance for block timestamp variance)
        if (timestamp < block.timestamp - 60) {
            return false;
        }
        
        // Cannot be more than maximum duration in future
        if (timestamp > block.timestamp + MAXIMUM_DURATION) {
            return false;
        }
        
        isReasonable = true;
    }

    /**
     * @dev Creates timestamp for standard duration from now
     * @return standardTimestamp Timestamp set to standard duration ahead
     */
    function createStandardExpiration() internal view returns (uint256 standardTimestamp) {
        standardTimestamp = block.timestamp + STANDARD_DURATION;
    }

    /**
     * @dev Creates timestamp for extended duration from now
     * @return extendedTimestamp Timestamp set to extended duration ahead
     */
    function createExtendedExpiration() internal view returns (uint256 extendedTimestamp) {
        extendedTimestamp = block.timestamp + EXTENDED_DURATION;
    }

    /**
     * @dev Validates that first timestamp expires before second timestamp
     * @param firstExpiration Earlier expiration timestamp
     * @param secondExpiration Later expiration timestamp
     * @return isProperSequence True if timing sequence is valid
     */
    function validateTemporalSequence(
        uint256 firstExpiration,
        uint256 secondExpiration
    ) internal pure returns (bool isProperSequence) {
        isProperSequence = (firstExpiration < secondExpiration);
    }

    /**
     * @dev Calculates percentage of time elapsed for given duration
     * @param startTimestamp When duration started
     * @param expirationTimestamp When duration ends
     * @return percentageElapsed Percentage (0-100) of time that has passed
     */
    function getElapsedPercentage(
        uint256 startTimestamp,
        uint256 expirationTimestamp
    ) internal view returns (uint256 percentageElapsed) {
        if (startTimestamp >= expirationTimestamp) {
            revert InvalidTimestamp();
        }
        
        uint256 totalDuration = expirationTimestamp - startTimestamp;
        
        if (block.timestamp <= startTimestamp) {
            percentageElapsed = 0;
        } else if (block.timestamp >= expirationTimestamp) {
            percentageElapsed = 100;
        } else {
            uint256 elapsedTime = block.timestamp - startTimestamp;
            percentageElapsed = (elapsedTime * 100) / totalDuration;
        }
    }
}
