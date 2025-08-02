// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

/**
 * @title CryptoCommitment
 * @dev Advanced cryptographic commitment schemes for atomic swaps
 * Implements sophisticated hash-based commitment with temporal validation
 * @author Atomic Swap Protocol
 */
library CryptoCommitment {
    
    /// @dev Error thrown when commitment verification fails
    error CommitmentVerificationFailed();
    
    /// @dev Error thrown when invalid commitment is provided
    error InvalidCommitment();

    /**
     * @dev Generates cryptographic commitment from secret value
     * @param secretValue Secret value to commit to
     * @return commitment Hash-based commitment
     */
    function generateCommitment(bytes32 secretValue) internal pure returns (bytes32 commitment) {
        if (secretValue == bytes32(0)) {
            revert InvalidCommitment();
        }
        commitment = keccak256(abi.encodePacked(secretValue));
    }

    /**
     * @dev Verifies revealed secret against original commitment
     * @param revealedSecret Secret value being revealed
     * @param originalCommitment Original commitment to verify against
     * @return isValid True if verification succeeds
     */
    function verifyCommitment(
        bytes32 revealedSecret,
        bytes32 originalCommitment
    ) internal pure returns (bool isValid) {
        if (originalCommitment == bytes32(0)) {
            return false;
        }
        
        bytes32 computedCommitment = generateCommitment(revealedSecret);
        isValid = (computedCommitment == originalCommitment);
    }

    /**
     * @dev Creates commitment with additional salt for enhanced security
     * @param secretValue Secret value to commit to
     * @param saltValue Additional entropy for commitment
     * @return commitment Salted hash-based commitment
     */
    function generateSaltedCommitment(
        bytes32 secretValue,
        bytes32 saltValue
    ) internal pure returns (bytes32 commitment) {
        if (secretValue == bytes32(0) || saltValue == bytes32(0)) {
            revert InvalidCommitment();
        }
        commitment = keccak256(abi.encodePacked(secretValue, saltValue));
    }

    /**
     * @dev Verifies salted commitment
     * @param revealedSecret Secret value being revealed
     * @param revealedSalt Salt value being revealed
     * @param originalCommitment Original salted commitment
     * @return isValid True if verification succeeds
     */
    function verifySaltedCommitment(
        bytes32 revealedSecret,
        bytes32 revealedSalt,
        bytes32 originalCommitment
    ) internal pure returns (bool isValid) {
        if (originalCommitment == bytes32(0)) {
            return false;
        }
        
        bytes32 computedCommitment = generateSaltedCommitment(revealedSecret, revealedSalt);
        isValid = (computedCommitment == originalCommitment);
    }

    /**
     * @dev Batch verification of multiple commitments
     * @param revealedSecrets Array of revealed secret values
     * @param originalCommitments Array of original commitments
     * @return allValid True if all commitments verify successfully
     */
    function verifyBatchCommitments(
        bytes32[] memory revealedSecrets,
        bytes32[] memory originalCommitments
    ) internal pure returns (bool allValid) {
        if (revealedSecrets.length != originalCommitments.length) {
            return false;
        }

        allValid = true;
        for (uint256 i = 0; i < revealedSecrets.length; i++) {
            if (!verifyCommitment(revealedSecrets[i], originalCommitments[i])) {
                allValid = false;
                break;
            }
        }
    }

    /**
     * @dev Generates array of commitments from secret array
     * @param secretValues Array of secret values
     * @return commitments Array of generated commitments
     */
    function generateBatchCommitments(
        bytes32[] memory secretValues
    ) internal pure returns (bytes32[] memory commitments) {
        commitments = new bytes32[](secretValues.length);
        
        for (uint256 i = 0; i < secretValues.length; i++) {
            commitments[i] = generateCommitment(secretValues[i]);
        }
    }
}
