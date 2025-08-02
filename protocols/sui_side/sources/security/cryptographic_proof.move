/// @title cryptographic_proof
/// @dev Advanced cryptographic commitment and verification system for atomic swaps
/// @author Atomic Swap Protocol Team
/// @notice Implements sophisticated hash-based commitment schemes with enhanced security
module atomic_swap_sui::cryptographic_proof {
    use std::hash;
    use std::vector;

    /// Error constants with unique identifiers
    const E_INVALID_PROOF_DATA: u64 = 0x1001;
    const E_PROOF_VERIFICATION_FAILED: u64 = 0x1002;
    const E_EMPTY_SECRET_VALUE: u64 = 0x1003;
    const E_MISMATCHED_PROOF_LENGTH: u64 = 0x1004;
    const E_INVALID_SALT_PARAMETER: u64 = 0x1005;

    /// Creates cryptographic commitment from secret input
    /// @param secret_input The confidential value to create commitment for
    /// @return Generated cryptographic commitment as bytes
    public fun create_commitment(secret_input: vector<u8>): vector<u8> {
        assert!(!vector::is_empty(&secret_input), E_EMPTY_SECRET_VALUE);
        hash::sha3_256(secret_input)
    }

    /// Verifies revealed secret against previously created commitment
    /// @param revealed_secret The secret being revealed for verification
    /// @param original_commitment The commitment to verify against
    /// @return True if verification succeeds, false otherwise
    public fun verify_commitment(
        revealed_secret: vector<u8>, 
        original_commitment: vector<u8>
    ): bool {
        if (vector::is_empty(&revealed_secret) || vector::is_empty(&original_commitment)) {
            return false
        };
        
        let computed_commitment = create_commitment(revealed_secret);
        computed_commitment == original_commitment
    }

    /// Creates enhanced commitment with additional entropy salt
    /// @param secret_input The confidential value to commit to
    /// @param entropy_salt Additional randomness for enhanced security
    /// @return Salted cryptographic commitment
    public fun create_salted_commitment(
        secret_input: vector<u8>, 
        entropy_salt: vector<u8>
    ): vector<u8> {
        assert!(!vector::is_empty(&secret_input), E_EMPTY_SECRET_VALUE);
        assert!(!vector::is_empty(&entropy_salt), E_INVALID_SALT_PARAMETER);
        
        let mut combined_data = vector::empty<u8>();
        vector::append(&mut combined_data, secret_input);
        vector::append(&mut combined_data, entropy_salt);
        
        hash::sha3_256(combined_data)
    }

    /// Verifies salted commitment with both secret and salt
    /// @param revealed_secret The secret being revealed
    /// @param revealed_salt The salt being revealed
    /// @param original_commitment The salted commitment to verify
    /// @return True if verification succeeds
    public fun verify_salted_commitment(
        revealed_secret: vector<u8>,
        revealed_salt: vector<u8>,
        original_commitment: vector<u8>
    ): bool {
        if (vector::is_empty(&revealed_secret) || 
            vector::is_empty(&revealed_salt) || 
            vector::is_empty(&original_commitment)) {
            return false
        };
        
        let computed_commitment = create_salted_commitment(revealed_secret, revealed_salt);
        computed_commitment == original_commitment
    }

    /// Batch processing of multiple secret commitments
    /// @param secret_batch Array of secrets to create commitments for
    /// @return Array of corresponding commitments
    public fun create_batch_commitments(secret_batch: vector<vector<u8>>): vector<vector<u8>> {
        let mut commitment_batch = vector::empty<vector<u8>>();
        let batch_length = vector::length(&secret_batch);
        let mut index = 0;
        
        while (index < batch_length) {
            let secret = vector::borrow(&secret_batch, index);
            let commitment = create_commitment(*secret);
            vector::push_back(&mut commitment_batch, commitment);
            index = index + 1;
        };
        
        commitment_batch
    }

    /// Batch verification of multiple commitments
    /// @param revealed_secrets Array of revealed secrets
    /// @param original_commitments Array of original commitments
    /// @return True if all verifications succeed
    public fun verify_batch_commitments(
        revealed_secrets: vector<vector<u8>>,
        original_commitments: vector<vector<u8>>
    ): bool {
        let secrets_length = vector::length(&revealed_secrets);
        let commitments_length = vector::length(&original_commitments);
        
        if (secrets_length != commitments_length) {
            return false
        };
        
        let mut index = 0;
        while (index < secrets_length) {
            let secret = vector::borrow(&revealed_secrets, index);
            let commitment = vector::borrow(&original_commitments, index);
            
            if (!verify_commitment(*secret, *commitment)) {
                return false
            };
            
            index = index + 1;
        };
        
        true
    }

    /// Advanced commitment with multiple layers of hashing
    /// @param secret_input The confidential input value
    /// @param iteration_count Number of hash iterations for enhanced security
    /// @return Multi-layered cryptographic commitment
    public fun create_multilayer_commitment(
        secret_input: vector<u8>, 
        iteration_count: u64
    ): vector<u8> {
        assert!(!vector::is_empty(&secret_input), E_EMPTY_SECRET_VALUE);
        assert!(iteration_count > 0 && iteration_count <= 10, E_INVALID_PROOF_DATA);
        
        let mut current_hash = secret_input;
        let mut counter = 0;
        
        while (counter < iteration_count) {
            current_hash = hash::sha3_256(current_hash);
            counter = counter + 1;
        };
        
        current_hash
    }

    /// Verifies multilayer commitment
    /// @param revealed_secret The secret being revealed
    /// @param iteration_count Number of hash iterations used
    /// @param original_commitment The multilayer commitment to verify
    /// @return True if verification succeeds
    public fun verify_multilayer_commitment(
        revealed_secret: vector<u8>,
        iteration_count: u64,
        original_commitment: vector<u8>
    ): bool {
        if (vector::is_empty(&revealed_secret) || vector::is_empty(&original_commitment)) {
            return false
        };
        
        let computed_commitment = create_multilayer_commitment(revealed_secret, iteration_count);
        computed_commitment == original_commitment
    }

    /// Generates random salt for enhanced security
    /// @param context_data Context-specific data for salt generation
    /// @return Generated salt value
    public fun generate_entropy_salt(context_data: vector<u8>): vector<u8> {
        let mut salt_input = vector::empty<u8>();
        vector::append(&mut salt_input, context_data);
        vector::append(&mut salt_input, b"atomic_swap_entropy");
        
        hash::sha3_256(salt_input)
    }

    #[test]
    fun test_commitment_creation() {
        let secret = b"test_secret_value";
        let commitment = create_commitment(secret);
        assert!(!vector::is_empty(&commitment), 0);
    }

    #[test]
    fun test_commitment_verification() {
        let secret = b"verification_test";
        let commitment = create_commitment(secret);
        assert!(verify_commitment(secret, commitment), 0);
        
        let wrong_secret = b"wrong_secret";
        assert!(!verify_commitment(wrong_secret, commitment), 0);
    }

    #[test]
    fun test_salted_commitment() {
        let secret = b"salted_secret";
        let salt = b"random_salt";
        let commitment = create_salted_commitment(secret, salt);
        assert!(verify_salted_commitment(secret, salt, commitment), 0);
    }

    #[test]
    fun test_batch_operations() {
        let secrets = vector[b"secret1", b"secret2", b"secret3"];
        let commitments = create_batch_commitments(secrets);
        assert!(verify_batch_commitments(secrets, commitments), 0);
    }
}
