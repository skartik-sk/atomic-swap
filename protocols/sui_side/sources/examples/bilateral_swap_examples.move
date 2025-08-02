/// @title bilateral_swap_examples
/// @dev Comprehensive examples demonstrating the interchain vault protocol usage
/// @author Atomic Swap Protocol Team
/// @notice Real-world usage patterns for cross-chain atomic swaps
module atomic_swap_sui::bilateral_swap_examples {
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::clock::{Clock};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use std::string;
    use std::vector;
    use atomic_swap_sui::interchain_vault_protocol::{Self, InterchainVaultContainer, ConsumedSecretsRegistry};
    use atomic_swap_sui::cryptographic_proof;
    use atomic_swap_sui::temporal_validation;

    /// Example: Establish basic interchain vault
    /// @param digital_asset SUI coin to lock in vault
    /// @param authorized_recipient Address authorized to claim assets
    /// @param secret_value Secret for commitment generation
    /// @param clock_reference System clock
    /// @param ctx Transaction context
    public entry fun establish_basic_swap_vault(
        digital_asset: Coin<SUI>,
        authorized_recipient: address,
        secret_value: vector<u8>,
        clock_reference: &Clock,
        ctx: &mut TxContext
    ) {
        let commitment_hash = cryptographic_proof::create_commitment(secret_value);
        let expiration_timestamp = temporal_validation::create_standard_expiration(clock_reference);
        let ethereum_reference = string::utf8(b"basic_swap_transaction_ref");
        
        interchain_vault_protocol::establish_and_share_vault<SUI>(
            digital_asset,
            authorized_recipient,
            commitment_hash,
            expiration_timestamp,
            ethereum_reference,
            clock_reference,
            ctx
        );
    }
    
    /// Example: Execute vault settlement with secret revelation
    /// @param vault_container Vault to settle
    /// @param secrets_registry Global secrets registry
    /// @param secret_value Secret for verification
    /// @param clock_reference System clock
    /// @param ctx Transaction context
    public entry fun execute_vault_settlement_example(
        vault_container: &mut InterchainVaultContainer<SUI>,
        secrets_registry: &mut ConsumedSecretsRegistry,
        secret_value: vector<u8>,
        clock_reference: &Clock,
        ctx: &mut TxContext
    ) {
        let settlement_coin = interchain_vault_protocol::execute_complete_settlement(
            vault_container,
            secrets_registry,
            secret_value,
            clock_reference,
            ctx
        );
        
        // Transfer settled assets to executor
        let executor_address = tx_context::sender(ctx);
        transfer::public_transfer(settlement_coin, executor_address);
    }
    
    /// Example: Cancel expired vault and recover assets
    /// @param vault_container Expired vault to cancel
    /// @param clock_reference System clock
    /// @param ctx Transaction context
    public entry fun cancel_expired_vault_example(
        vault_container: &mut InterchainVaultContainer<SUI>,
        clock_reference: &Clock,
        ctx: &mut TxContext
    ) {
        let recovered_coin = interchain_vault_protocol::cancel_expired_vault(
            vault_container,
            clock_reference,
            ctx
        );
        
        // Return recovered assets to initiator
        let initiator_address = tx_context::sender(ctx);
        transfer::public_transfer(recovered_coin, initiator_address);
    }
    
    /// Example: Create multiple vaults in batch operation
    /// @param asset_coins Array of SUI coins to lock
    /// @param authorized_recipient Recipient for all vaults
    /// @param secret_values Array of secrets for commitments
    /// @param clock_reference System clock
    /// @param ctx Transaction context
    public entry fun establish_batch_swap_vaults(
        mut asset_coins: vector<Coin<SUI>>,
        authorized_recipient: address,
        secret_values: vector<vector<u8>>,
        clock_reference: &Clock,
        ctx: &mut TxContext
    ) {
        let commitment_hashes = cryptographic_proof::create_batch_commitments(secret_values);
        let expiration_timestamp = temporal_validation::create_enhanced_expiration(clock_reference);
        
        let mut index = 0;
        let coins_length = vector::length(&asset_coins);
        while (index < coins_length) {
            let digital_asset = vector::pop_back(&mut asset_coins);
            let commitment_hash = *vector::borrow(&commitment_hashes, index);
            let ethereum_reference = string::utf8(b"batch_swap_transaction_");
            
            interchain_vault_protocol::establish_and_share_vault<SUI>(
                digital_asset,
                authorized_recipient,
                commitment_hash,
                expiration_timestamp,
                ethereum_reference,
                clock_reference,
                ctx
            );
            
            index = index + 1;
        };
        
        // Destroy empty vector
        vector::destroy_empty(asset_coins);
    }

    /// Example: Partial withdrawal from vault
    /// @param vault_container Vault for partial withdrawal
    /// @param secrets_registry Global secrets registry
    /// @param withdrawal_amount Amount to withdraw
    /// @param secret_value Secret for verification
    /// @param clock_reference System clock
    /// @param ctx Transaction context
    public entry fun execute_partial_withdrawal_example(
        vault_container: &mut InterchainVaultContainer<SUI>,
        secrets_registry: &mut ConsumedSecretsRegistry,
        withdrawal_amount: u64,
        secret_value: vector<u8>,
        clock_reference: &Clock,
        ctx: &mut TxContext
    ) {
        let withdrawal_coin = interchain_vault_protocol::execute_partial_withdrawal(
            vault_container,
            secrets_registry,
            withdrawal_amount,
            secret_value,
            clock_reference,
            ctx
        );
        
        // Transfer withdrawn assets to executor
        let executor_address = tx_context::sender(ctx);
        transfer::public_transfer(withdrawal_coin, executor_address);
    }
    
    /// Example: Check comprehensive vault status
    /// @param vault_container Vault to analyze
    /// @param clock_reference System clock
    /// @return Status information tuple
    public fun analyze_vault_status<T>(
        vault_container: &InterchainVaultContainer<T>,
        clock_reference: &Clock
    ): (bool, bool, bool) {
        let is_expired = interchain_vault_protocol::is_vault_expired(vault_container, clock_reference);
        let can_settle = interchain_vault_protocol::can_settle_vault(vault_container, clock_reference);
        let (_, _, _, _, _, _, is_settled, _, _) = interchain_vault_protocol::get_vault_information(vault_container);
        
        (is_expired, can_settle, is_settled)
    }

    /// Example: Advanced vault with custom temporal configuration
    /// @param digital_asset SUI coin to lock
    /// @param authorized_recipient Recipient address
    /// @param secret_value Secret for commitment
    /// @param custom_duration Custom duration in milliseconds
    /// @param clock_reference System clock
    /// @param ctx Transaction context
    public entry fun establish_custom_duration_vault(
        digital_asset: Coin<SUI>,
        authorized_recipient: address,
        secret_value: vector<u8>,
        custom_duration: u64,
        clock_reference: &Clock,
        ctx: &mut TxContext
    ) {
        let commitment_hash = cryptographic_proof::create_commitment(secret_value);
        let expiration_timestamp = temporal_validation::create_expiration_timestamp(
            custom_duration,
            clock_reference
        );
        let ethereum_reference = string::utf8(b"custom_duration_swap_ref");
        
        interchain_vault_protocol::establish_and_share_vault<SUI>(
            digital_asset,
            authorized_recipient,
            commitment_hash,
            expiration_timestamp,
            ethereum_reference,
            clock_reference,
            ctx
        );
    }

    /// Example: Multi-layer security vault with enhanced commitment
    /// @param digital_asset SUI coin to lock
    /// @param authorized_recipient Recipient address
    /// @param secret_value Base secret value
    /// @param salt_value Additional entropy
    /// @param clock_reference System clock
    /// @param ctx Transaction context
    public entry fun establish_enhanced_security_vault(
        digital_asset: Coin<SUI>,
        authorized_recipient: address,
        secret_value: vector<u8>,
        salt_value: vector<u8>,
        clock_reference: &Clock,
        ctx: &mut TxContext
    ) {
        let commitment_hash = cryptographic_proof::create_salted_commitment(secret_value, salt_value);
        let expiration_timestamp = temporal_validation::create_enhanced_expiration(clock_reference);
        let ethereum_reference = string::utf8(b"enhanced_security_swap_ref");
        
        interchain_vault_protocol::establish_and_share_vault<SUI>(
            digital_asset,
            authorized_recipient,
            commitment_hash,
            expiration_timestamp,
            ethereum_reference,
            clock_reference,
            ctx
        );
    }

    /// Example: Verify vault accessibility before settlement
    /// @param vault_container Vault to check
    /// @param potential_secret Secret to test
    /// @param clock_reference System clock
    /// @return True if vault can be settled with this secret
    public fun verify_settlement_eligibility<T>(
        vault_container: &InterchainVaultContainer<T>,
        potential_secret: vector<u8>,
        clock_reference: &Clock
    ): bool {
        let (_, _, _, _, commitment_hash, _, is_settled, _, _) = interchain_vault_protocol::get_vault_information(vault_container);
        
        let secret_valid = interchain_vault_protocol::verify_secret_commitment(potential_secret, commitment_hash);
        let time_valid = interchain_vault_protocol::can_settle_vault(vault_container, clock_reference);
        let status_valid = !is_settled;
        
        secret_valid && time_valid && status_valid
    }

    /// Example: Get detailed vault analytics
    /// @param vault_container Vault to analyze
    /// @param clock_reference System clock
    /// @return Comprehensive analytics data
    public fun get_vault_analytics<T>(
        vault_container: &InterchainVaultContainer<T>,
        clock_reference: &Clock
    ): (u64, u64, u64, bool, u64) {
        let (_, _, total_amount, remaining_balance, _, expiration, is_settled, creation_time, _) = 
            interchain_vault_protocol::get_vault_information(vault_container);
        
        let time_remaining = temporal_validation::get_remaining_temporal_duration(expiration, clock_reference);
        let percentage_elapsed = temporal_validation::get_elapsed_percentage(creation_time, expiration, clock_reference);
        
        (total_amount, remaining_balance, time_remaining, is_settled, percentage_elapsed)
    }

    /// Example: Open access vault (no specific recipient)
    /// @param digital_asset SUI coin to lock
    /// @param secret_value Secret for commitment
    /// @param clock_reference System clock
    /// @param ctx Transaction context
    public entry fun establish_open_access_vault(
        digital_asset: Coin<SUI>,
        secret_value: vector<u8>,
        clock_reference: &Clock,
        ctx: &mut TxContext
    ) {
        let commitment_hash = cryptographic_proof::create_commitment(secret_value);
        let expiration_timestamp = temporal_validation::create_standard_expiration(clock_reference);
        let ethereum_reference = string::utf8(b"open_access_swap_ref");
        
        // Using @0x0 for open access
        interchain_vault_protocol::establish_and_share_vault<SUI>(
            digital_asset,
            @0x0,
            commitment_hash,
            expiration_timestamp,
            ethereum_reference,
            clock_reference,
            ctx
        );
    }
}
