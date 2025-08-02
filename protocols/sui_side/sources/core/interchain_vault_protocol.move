/// @title interchain_vault_protocol
/// @dev Core implementation of cross-chain atomic value storage system
/// @author Atomic Swap Protocol Team
/// @notice Advanced bilateral asset exchange mechanism with cryptographic security
module atomic_swap_sui::interchain_vault_protocol {
    use sui::balance::{Self, Balance};
    use sui::coin::{Self, Coin};
    use sui::clock::{Self, Clock};
    use sui::event;
    use sui::object;
    use std::string::String;
    use std::vector;
    use atomic_swap_sui::cryptographic_proof;
    use atomic_swap_sui::temporal_validation;

    /// Comprehensive error code definitions
    const E_INVALID_TEMPORAL_CONFIGURATION: u64 = 0x3001;
    const E_INSUFFICIENT_ASSET_AMOUNT: u64 = 0x3002;
    const E_UNAUTHORIZED_COUNTERPARTY: u64 = 0x3003;
    const E_VAULT_ALREADY_SETTLED: u64 = 0x3004;
    const E_TEMPORAL_WINDOW_EXPIRED: u64 = 0x3005;
    const E_CRYPTOGRAPHIC_VERIFICATION_FAILED: u64 = 0x3006;
    const E_UNAUTHORIZED_INITIATOR: u64 = 0x3007;
    const E_TEMPORAL_WINDOW_NOT_EXPIRED: u64 = 0x3008;
    const E_SECRET_ALREADY_CONSUMED: u64 = 0x3009;
    const E_INSUFFICIENT_REMAINING_BALANCE: u64 = 0x3010;
    const E_INVALID_WITHDRAWAL_AMOUNT: u64 = 0x3011;
    const E_VAULT_INITIALIZATION_FAILED: u64 = 0x3012;

    /// Global registry for tracking consumed cryptographic secrets
    public struct ConsumedSecretsRegistry has key {
        id: object::UID,
        consumed_secrets: vector<vector<u8>>,
    }

    /// Initialization function for secret registry
    fun init(ctx: &mut sui::tx_context::TxContext) {
        let registry = ConsumedSecretsRegistry {
            id: object::new(ctx),
            consumed_secrets: vector::empty(),
        };
        sui::transfer::share_object(registry);
    }

    /// Test-only initialization function
    #[test_only]
    public fun init_for_testing(ctx: &mut sui::tx_context::TxContext) {
        init(ctx);
    }

    /// Primary vault data structure for atomic cross-chain operations
    public struct InterchainVaultContainer<phantom T> has key, store {
        id: object::UID,
        vault_initiator: address,
        authorized_counterparty: address, // @0x0 for open access
        total_asset_amount: u64,
        remaining_asset_balance: u64,
        asset_balance: Balance<T>,
        cryptographic_commitment: vector<u8>,
        temporal_expiration: u64,
        settlement_status: bool,
        creation_timestamp: u64,
        ethereum_transaction_reference: String,
        revealed_secret: vector<u8>, // Stored after successful revelation
    }

    /// Event structure for vault establishment
    public struct VaultEstablished has copy, drop {
        vault_identifier: object::ID,
        vault_initiator: address,
        authorized_counterparty: address,
        asset_amount: u64,
        cryptographic_commitment: vector<u8>,
        temporal_expiration: u64,
        ethereum_transaction_reference: String,
    }

    /// Event structure for partial asset withdrawal
    public struct PartialAssetWithdrawal has copy, drop {
        vault_identifier: object::ID,
        executor_address: address,
        withdrawn_amount: u64,
        remaining_balance: u64,
        revealed_secret: vector<u8>,
        ethereum_transaction_reference: String,
    }
    
    /// Event structure for complete vault settlement
    public struct VaultCompletelySettled has copy, drop {
        vault_identifier: object::ID,
        final_executor: address,
        revealed_secret: vector<u8>,
        ethereum_transaction_reference: String,
    }

    /// Event structure for vault cancellation
    public struct VaultCancellationExecuted has copy, drop {
        vault_identifier: object::ID,
        vault_initiator: address,
        ethereum_transaction_reference: String,
    }

    /// Event structure for asset recovery
    public struct AssetRecoveryCompleted has copy, drop {
        vault_identifier: object::ID,
        vault_initiator: address,
        recovered_amount: u64,
        ethereum_transaction_reference: String,
    }

    /// Creates new interchain vault with cryptographic security
    /// @param asset_coin Digital asset to lock in vault
    /// @param authorized_counterparty Authorized recipient address
    /// @param cryptographic_commitment Hash commitment for secret
    /// @param temporal_expiration Vault expiration timestamp
    /// @param ethereum_transaction_reference Cross-chain reference
    /// @param clock_reference System clock reference
    /// @param ctx Transaction context
    /// @return Newly created vault container
    public fun establish_interchain_vault<T>(
        asset_coin: Coin<T>,
        authorized_counterparty: address,
        cryptographic_commitment: vector<u8>,
        temporal_expiration: u64,
        ethereum_transaction_reference: String,
        clock_reference: &Clock,
        ctx: &mut sui::tx_context::TxContext
    ): InterchainVaultContainer<T> {
        let asset_amount = coin::value(&asset_coin);
        let vault_initiator = sui::tx_context::sender(ctx);
        let current_timestamp = clock::timestamp_ms(clock_reference);
        
        assert!(temporal_validation::is_reasonable_timestamp(temporal_expiration, clock_reference), E_INVALID_TEMPORAL_CONFIGURATION);
        assert!(asset_amount > 0, E_INSUFFICIENT_ASSET_AMOUNT);
        
        let vault_uid = object::new(ctx);
        let vault_identifier = object::uid_to_inner(&vault_uid);
        
        let vault_container = InterchainVaultContainer<T> {
            id: vault_uid,
            vault_initiator,
            authorized_counterparty,
            total_asset_amount: asset_amount,
            remaining_asset_balance: asset_amount,
            asset_balance: coin::into_balance(asset_coin),
            cryptographic_commitment,
            temporal_expiration,
            settlement_status: false,
            creation_timestamp: current_timestamp,
            ethereum_transaction_reference,
            revealed_secret: vector::empty(),
        };

        event::emit(VaultEstablished {
            vault_identifier,
            vault_initiator,
            authorized_counterparty,
            asset_amount,
            cryptographic_commitment,
            temporal_expiration,
            ethereum_transaction_reference,
        });

        vault_container
    }

    /// Creates and immediately shares vault as global object
    /// @param asset_coin Digital asset to lock
    /// @param authorized_counterparty Authorized recipient
    /// @param cryptographic_commitment Hash commitment
    /// @param temporal_expiration Expiration timestamp
    /// @param ethereum_transaction_reference Cross-chain reference
    /// @param clock_reference System clock
    /// @param ctx Transaction context
    /// @return Vault object identifier
    public fun establish_and_share_vault<T>(
        asset_coin: Coin<T>,
        authorized_counterparty: address,
        cryptographic_commitment: vector<u8>,
        temporal_expiration: u64,
        ethereum_transaction_reference: String,
        clock_reference: &Clock,
        ctx: &mut sui::tx_context::TxContext
    ): object::ID {
        let asset_amount = coin::value(&asset_coin);
        let vault_initiator = sui::tx_context::sender(ctx);
        let current_timestamp = clock::timestamp_ms(clock_reference);
        
        assert!(temporal_validation::is_reasonable_timestamp(temporal_expiration, clock_reference), E_INVALID_TEMPORAL_CONFIGURATION);
        assert!(asset_amount > 0, E_INSUFFICIENT_ASSET_AMOUNT);
        
        let vault_uid = object::new(ctx);
        let vault_identifier = object::uid_to_inner(&vault_uid);
        
        let vault_container = InterchainVaultContainer<T> {
            id: vault_uid,
            vault_initiator,
            authorized_counterparty,
            total_asset_amount: asset_amount,
            remaining_asset_balance: asset_amount,
            asset_balance: coin::into_balance(asset_coin),
            cryptographic_commitment,
            temporal_expiration,
            settlement_status: false,
            creation_timestamp: current_timestamp,
            ethereum_transaction_reference,
            revealed_secret: vector::empty(),
        };

        event::emit(VaultEstablished {
            vault_identifier,
            vault_initiator,
            authorized_counterparty,
            asset_amount,
            cryptographic_commitment,
            temporal_expiration,
            ethereum_transaction_reference,
        });

        // Share as global object
        sui::transfer::share_object(vault_container);
        
        // Return identifier
        vault_identifier
    }

    /// Converts owned vault to shared global object
    /// @param vault_container Vault to share globally
    public fun share_vault_globally<T>(vault_container: InterchainVaultContainer<T>) {
        sui::transfer::share_object(vault_container);
    }

    /// Executes partial asset withdrawal from vault
    /// @param vault_container Vault to withdraw from
    /// @param secrets_registry Global secrets registry
    /// @param withdrawal_amount Amount to withdraw
    /// @param revealed_secret Secret for cryptographic verification
    /// @param clock_reference System clock
    /// @param ctx Transaction context
    /// @return Withdrawn asset coin
    public fun execute_partial_withdrawal<T>(
        vault_container: &mut InterchainVaultContainer<T>,
        secrets_registry: &mut ConsumedSecretsRegistry,
        withdrawal_amount: u64,
        revealed_secret: vector<u8>,
        clock_reference: &Clock,
        ctx: &mut sui::tx_context::TxContext
    ): Coin<T> {
        let executor_address = sui::tx_context::sender(ctx);
        let _current_timestamp = clock::timestamp_ms(clock_reference);
        
        // Validate access permissions
        if (vault_container.authorized_counterparty != @0x0) {
            assert!(executor_address == vault_container.authorized_counterparty, E_UNAUTHORIZED_COUNTERPARTY);
        };
        assert!(!vault_container.settlement_status, E_VAULT_ALREADY_SETTLED);
        assert!(!temporal_validation::is_temporal_window_expired(vault_container.temporal_expiration, clock_reference), E_TEMPORAL_WINDOW_EXPIRED);
        assert!(cryptographic_proof::verify_commitment(revealed_secret, vault_container.cryptographic_commitment), E_CRYPTOGRAPHIC_VERIFICATION_FAILED);
        
        // Handle secret revelation logic
        if (!vector::is_empty(&vault_container.revealed_secret)) {
            assert!(vault_container.revealed_secret == revealed_secret, E_CRYPTOGRAPHIC_VERIFICATION_FAILED);
        } else {
            assert!(!is_secret_consumed(secrets_registry, &revealed_secret), E_SECRET_ALREADY_CONSUMED);
        };
        assert!(withdrawal_amount > 0, E_INVALID_WITHDRAWAL_AMOUNT);
        assert!(withdrawal_amount <= vault_container.remaining_asset_balance, E_INSUFFICIENT_REMAINING_BALANCE);
        
        // Update vault state
        vault_container.remaining_asset_balance = vault_container.remaining_asset_balance - withdrawal_amount;
        
        // Store secret on first revelation
        if (vector::is_empty(&vault_container.revealed_secret)) {
            vault_container.revealed_secret = revealed_secret;
            vector::push_back(&mut secrets_registry.consumed_secrets, revealed_secret);
        };
        
        // Check for complete settlement
        let is_complete_settlement = vault_container.remaining_asset_balance == 0;
        if (is_complete_settlement) {
            vault_container.settlement_status = true;
        };
        
        // Extract specified amount from balance
        let withdrawal_coin = coin::from_balance(balance::split(&mut vault_container.asset_balance, withdrawal_amount), ctx);
        
        if (is_complete_settlement) {
            event::emit(VaultCompletelySettled {
                vault_identifier: object::uid_to_inner(&vault_container.id),
                final_executor: executor_address,
                revealed_secret,
                ethereum_transaction_reference: vault_container.ethereum_transaction_reference,
            });
        } else {
            event::emit(PartialAssetWithdrawal {
                vault_identifier: object::uid_to_inner(&vault_container.id),
                executor_address,
                withdrawal_amount,
                remaining_balance: vault_container.remaining_asset_balance,
                revealed_secret,
                ethereum_transaction_reference: vault_container.ethereum_transaction_reference,
            });
        };

        withdrawal_coin
    }
    
    /// Executes complete vault settlement (withdraws all remaining)
    /// @param vault_container Vault to settle
    /// @param secrets_registry Global secrets registry
    /// @param revealed_secret Secret for verification
    /// @param clock_reference System clock
    /// @param ctx Transaction context
    /// @return Complete remaining balance as coin
    public fun execute_complete_settlement<T>(
        vault_container: &mut InterchainVaultContainer<T>,
        secrets_registry: &mut ConsumedSecretsRegistry,
        revealed_secret: vector<u8>,
        clock_reference: &Clock,
        ctx: &mut sui::tx_context::TxContext
    ): Coin<T> {
        assert!(vault_container.remaining_asset_balance > 0, E_VAULT_ALREADY_SETTLED);
        
        // Execute withdrawal for entire remaining balance
        let remaining_balance = vault_container.remaining_asset_balance;
        execute_partial_withdrawal(vault_container, secrets_registry, remaining_balance, revealed_secret, clock_reference, ctx)
    }

    /// Cancels expired vault (post-expiration only)
    /// @param vault_container Vault to cancel
    /// @param clock_reference System clock
    /// @param ctx Transaction context
    /// @return Recovered assets as coin
    public fun cancel_expired_vault<T>(
        vault_container: &mut InterchainVaultContainer<T>,
        clock_reference: &Clock,
        ctx: &mut sui::tx_context::TxContext
    ): Coin<T> {
        let executor_address = sui::tx_context::sender(ctx);
        let _current_timestamp = clock::timestamp_ms(clock_reference);
        
        assert!(executor_address == vault_container.vault_initiator, E_UNAUTHORIZED_INITIATOR);
        assert!(!vault_container.settlement_status, E_VAULT_ALREADY_SETTLED);
        assert!(temporal_validation::is_temporal_window_expired(vault_container.temporal_expiration, clock_reference), E_TEMPORAL_WINDOW_NOT_EXPIRED);
        
        let recovery_amount = vault_container.remaining_asset_balance;
        let recovery_coin = coin::from_balance(balance::withdraw_all(&mut vault_container.asset_balance), ctx);
        
        event::emit(AssetRecoveryCompleted {
            vault_identifier: object::uid_to_inner(&vault_container.id),
            vault_initiator: executor_address,
            recovered_amount: recovery_amount,
            ethereum_transaction_reference: vault_container.ethereum_transaction_reference,
        });

        recovery_coin
    }

    /// Verifies secret against commitment
    /// @param secret_value Secret to verify
    /// @param commitment_hash Commitment to verify against
    /// @return True if verification succeeds
    public fun verify_secret_commitment(
        secret_value: vector<u8>,
        commitment_hash: vector<u8>
    ): bool {
        cryptographic_proof::verify_commitment(secret_value, commitment_hash)
    }

    /// Creates new cryptographic commitment
    /// @param secret_value Secret to create commitment for
    /// @return Generated commitment hash
    public fun create_commitment_hash(secret_value: vector<u8>): vector<u8> {
        cryptographic_proof::create_commitment(secret_value)
    }

    /// Retrieves comprehensive vault information
    /// @param vault_container Vault to inspect
    /// @return Complete vault state data
    public fun get_vault_information<T>(vault_container: &InterchainVaultContainer<T>): (
        address, address, u64, u64, vector<u8>, u64, bool, u64, String
    ) {
        (
            vault_container.vault_initiator,
            vault_container.authorized_counterparty,
            vault_container.total_asset_amount,
            vault_container.remaining_asset_balance,
            vault_container.cryptographic_commitment,
            vault_container.temporal_expiration,
            vault_container.settlement_status,
            vault_container.creation_timestamp,
            vault_container.ethereum_transaction_reference
        )
    }
    
    /// Gets current remaining balance
    /// @param vault_container Vault to check
    /// @return Remaining asset balance
    public fun get_remaining_balance<T>(vault_container: &InterchainVaultContainer<T>): u64 {
        vault_container.remaining_asset_balance
    }

    /// Checks if vault has expired
    /// @param vault_container Vault to check
    /// @param clock_reference System clock
    /// @return True if vault is expired
    public fun is_vault_expired<T>(vault_container: &InterchainVaultContainer<T>, clock_reference: &Clock): bool {
        temporal_validation::is_temporal_window_expired(vault_container.temporal_expiration, clock_reference)
    }

    /// Checks if vault can be settled
    /// @param vault_container Vault to check
    /// @param clock_reference System clock
    /// @return True if vault can be settled
    public fun can_settle_vault<T>(vault_container: &InterchainVaultContainer<T>, clock_reference: &Clock): bool {
        !vault_container.settlement_status && temporal_validation::is_temporal_window_active(vault_container.temporal_expiration, clock_reference)
    }

    /// Gets revealed secret (if any)
    /// @param vault_container Vault to check
    /// @return Revealed secret
    public fun get_revealed_secret<T>(vault_container: &InterchainVaultContainer<T>): vector<u8> {
        vault_container.revealed_secret
    }

    /// Checks if secret has been consumed
    /// @param secrets_registry Global registry
    /// @param secret_value Secret to check
    /// @return True if secret is consumed
    public fun is_secret_consumed(secrets_registry: &ConsumedSecretsRegistry, secret_value: &vector<u8>): bool {
        let mut index = 0;
        let registry_length = vector::length(&secrets_registry.consumed_secrets);
        while (index < registry_length) {
            let consumed_secret = vector::borrow(&secrets_registry.consumed_secrets, index);
            if (consumed_secret == secret_value) {
                return true
            };
            index = index + 1;
        };
        false
    }

    /// Gets total number of consumed secrets
    /// @param secrets_registry Global registry
    /// @return Count of consumed secrets
    public fun get_consumed_secrets_count(secrets_registry: &ConsumedSecretsRegistry): u64 {
        vector::length(&secrets_registry.consumed_secrets)
    }

    /// Batch creates commitment hashes (utility function)
    /// @param secret_values Array of secrets
    /// @return Array of corresponding commitments
    public fun create_batch_commitment_hashes(secret_values: vector<vector<u8>>): vector<vector<u8>> {
        cryptographic_proof::create_batch_commitments(secret_values)
    }
}
