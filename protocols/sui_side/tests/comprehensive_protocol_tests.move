#[test_only]
module atomic_swap_sui::comprehensive_protocol_tests {
    use sui::test_scenario::{Self as test, Scenario, next_tx, ctx};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::clock::{Self, Clock};
    use std::vector;
    use atomic_swap_sui::interchain_vault_protocol::{Self, InterchainVaultContainer, ConsumedSecretsRegistry};
    use atomic_swap_sui::cryptographic_proof;
    use atomic_swap_sui::temporal_validation;
    use atomic_swap_sui::bilateral_swap_examples;

    const ALICE: address = @0xA11CE;
    const BOB: address = @0xB0B;
    const CHARLIE: address = @0xCHA12;

    #[test]
    fun test_basic_vault_establishment() {
        let mut scenario = test::begin(ALICE);
        let ctx = test::ctx(&mut scenario);
        
        // Initialize registry
        interchain_vault_protocol::init_for_testing(ctx);
        
        test::next_tx(&mut scenario, ALICE);
        {
            let mut clock = clock::create_for_testing(ctx(& scenario));
            let secret = b"secure_test_secret";
            let test_coin = coin::mint_for_testing<SUI>(1000, ctx(& scenario));
            
            let commitment = cryptographic_proof::create_commitment(secret);
            let expiration = temporal_validation::create_standard_expiration(&clock);
            
            let vault_id = interchain_vault_protocol::establish_and_share_vault<SUI>(
                test_coin,
                BOB,
                commitment,
                expiration,
                std::string::utf8(b"test_reference"),
                &clock,
                ctx(& scenario)
            );
            
            // Verify vault was created
            assert!(sui::object::id_to_address(&vault_id) != @0x0, 0);
            
            clock::destroy_for_testing(clock);
        };
        
        test::end(scenario);
    }

    #[test]
    fun test_vault_settlement_flow() {
        let mut scenario = test::begin(ALICE);
        let ctx = test::ctx(&mut scenario);
        
        // Initialize registry
        interchain_vault_protocol::init_for_testing(ctx);
        
        test::next_tx(&mut scenario, ALICE);
        let mut clock = clock::create_for_testing(ctx(& scenario));
        let secret = b"settlement_test_secret";
        let test_coin = coin::mint_for_testing<SUI>(2000, ctx(& scenario));
        
        let commitment = cryptographic_proof::create_commitment(secret);
        let expiration = temporal_validation::create_standard_expiration(&clock);
        
        interchain_vault_protocol::establish_and_share_vault<SUI>(
            test_coin,
            BOB,
            commitment,
            expiration,
            std::string::utf8(b"settlement_test"),
            &clock,
            ctx(& scenario)
        );
        
        test::next_tx(&mut scenario, BOB);
        {
            let mut vault = test::take_shared<InterchainVaultContainer<SUI>>(&scenario);
            let mut registry = test::take_shared<ConsumedSecretsRegistry>(&scenario);
            
            let settlement_coin = interchain_vault_protocol::execute_complete_settlement(
                &mut vault,
                &mut registry,
                secret,
                &clock,
                ctx(& scenario)
            );
            
            // Verify settlement amount
            assert!(coin::value(&settlement_coin) == 2000, 0);
            
            coin::burn_for_testing(settlement_coin);
            test::return_shared(vault);
            test::return_shared(registry);
        };
        
        clock::destroy_for_testing(clock);
        test::end(scenario);
    }

    #[test]
    fun test_partial_withdrawal_mechanism() {
        let mut scenario = test::begin(ALICE);
        let ctx = test::ctx(&mut scenario);
        
        interchain_vault_protocol::init_for_testing(ctx);
        
        test::next_tx(&mut scenario, ALICE);
        let mut clock = clock::create_for_testing(ctx(& scenario));
        let secret = b"partial_withdrawal_secret";
        let test_coin = coin::mint_for_testing<SUI>(5000, ctx(& scenario));
        
        let commitment = cryptographic_proof::create_commitment(secret);
        let expiration = temporal_validation::create_standard_expiration(&clock);
        
        interchain_vault_protocol::establish_and_share_vault<SUI>(
            test_coin,
            BOB,
            commitment,
            expiration,
            std::string::utf8(b"partial_test"),
            &clock,
            ctx(& scenario)
        );
        
        test::next_tx(&mut scenario, BOB);
        {
            let mut vault = test::take_shared<InterchainVaultContainer<SUI>>(&scenario);
            let mut registry = test::take_shared<ConsumedSecretsRegistry>(&scenario);
            
            // First partial withdrawal
            let first_withdrawal = interchain_vault_protocol::execute_partial_withdrawal(
                &mut vault,
                &mut registry,
                2000,
                secret,
                &clock,
                ctx(& scenario)
            );
            
            assert!(coin::value(&first_withdrawal) == 2000, 0);
            assert!(interchain_vault_protocol::get_remaining_balance(&vault) == 3000, 0);
            
            coin::burn_for_testing(first_withdrawal);
            test::return_shared(vault);
            test::return_shared(registry);
        };
        
        test::next_tx(&mut scenario, BOB);
        {
            let mut vault = test::take_shared<InterchainVaultContainer<SUI>>(&scenario);
            let mut registry = test::take_shared<ConsumedSecretsRegistry>(&scenario);
            
            // Second partial withdrawal
            let second_withdrawal = interchain_vault_protocol::execute_partial_withdrawal(
                &mut vault,
                &mut registry,
                3000,
                secret,
                &clock,
                ctx(& scenario)
            );
            
            assert!(coin::value(&second_withdrawal) == 3000, 0);
            assert!(interchain_vault_protocol::get_remaining_balance(&vault) == 0, 0);
            
            coin::burn_for_testing(second_withdrawal);
            test::return_shared(vault);
            test::return_shared(registry);
        };
        
        clock::destroy_for_testing(clock);
        test::end(scenario);
    }

    #[test]
    fun test_vault_expiration_and_recovery() {
        let mut scenario = test::begin(ALICE);
        let ctx = test::ctx(&mut scenario);
        
        interchain_vault_protocol::init_for_testing(ctx);
        
        test::next_tx(&mut scenario, ALICE);
        let mut clock = clock::create_for_testing(ctx(& scenario));
        let secret = b"expiration_test_secret";
        let test_coin = coin::mint_for_testing<SUI>(3000, ctx(& scenario));
        
        let commitment = cryptographic_proof::create_commitment(secret);
        let short_expiration = clock::timestamp_ms(&clock) + 1000; // Very short expiration
        
        interchain_vault_protocol::establish_and_share_vault<SUI>(
            test_coin,
            BOB,
            commitment,
            short_expiration,
            std::string::utf8(b"expiration_test"),
            &clock,
            ctx(& scenario)
        );
        
        // Advance time past expiration
        clock::increment_for_testing(&mut clock, 2000);
        
        test::next_tx(&mut scenario, ALICE);
        {
            let mut vault = test::take_shared<InterchainVaultContainer<SUI>>(&scenario);
            
            assert!(interchain_vault_protocol::is_vault_expired(&vault, &clock), 0);
            
            let recovered_coin = interchain_vault_protocol::cancel_expired_vault(
                &mut vault,
                &clock,
                ctx(& scenario)
            );
            
            assert!(coin::value(&recovered_coin) == 3000, 0);
            
            coin::burn_for_testing(recovered_coin);
            test::return_shared(vault);
        };
        
        clock::destroy_for_testing(clock);
        test::end(scenario);
    }

    #[test]
    fun test_cryptographic_verification() {
        let secret = b"verification_test_secret";
        let commitment = cryptographic_proof::create_commitment(secret);
        
        // Test valid verification
        assert!(cryptographic_proof::verify_commitment(secret, commitment), 0);
        
        // Test invalid verification
        let wrong_secret = b"wrong_secret_value";
        assert!(!cryptographic_proof::verify_commitment(wrong_secret, commitment), 0);
        
        // Test salted commitment
        let salt = b"random_salt_value";
        let salted_commitment = cryptographic_proof::create_salted_commitment(secret, salt);
        assert!(cryptographic_proof::verify_salted_commitment(secret, salt, salted_commitment), 0);
    }

    #[test]
    fun test_temporal_validation_functions() {
        let scenario = test::begin(ALICE);
        let ctx = test::ctx(&scenario);
        let clock = clock::create_for_testing(ctx);
        
        let standard_duration = temporal_validation::get_standard_duration();
        assert!(temporal_validation::is_valid_security_duration(standard_duration), 0);
        
        let expiration = temporal_validation::create_standard_expiration(&clock);
        assert!(temporal_validation::is_temporal_window_active(expiration, &clock), 0);
        assert!(!temporal_validation::is_temporal_window_expired(expiration, &clock), 0);
        
        clock::destroy_for_testing(clock);
        test::end(scenario);
    }

    #[test]
    fun test_batch_operations() {
        let secrets = vector[b"secret1", b"secret2", b"secret3"];
        let commitments = cryptographic_proof::create_batch_commitments(secrets);
        
        assert!(vector::length(&commitments) == 3, 0);
        assert!(cryptographic_proof::verify_batch_commitments(secrets, commitments), 0);
    }

    #[test]
    fun test_open_access_vault() {
        let mut scenario = test::begin(ALICE);
        let ctx = test::ctx(&mut scenario);
        
        interchain_vault_protocol::init_for_testing(ctx);
        
        test::next_tx(&mut scenario, ALICE);
        let mut clock = clock::create_for_testing(ctx(& scenario));
        let secret = b"open_access_secret";
        let test_coin = coin::mint_for_testing<SUI>(1500, ctx(& scenario));
        
        let commitment = cryptographic_proof::create_commitment(secret);
        let expiration = temporal_validation::create_standard_expiration(&clock);
        
        // Create vault with @0x0 for open access
        interchain_vault_protocol::establish_and_share_vault<SUI>(
            test_coin,
            @0x0,
            commitment,
            expiration,
            std::string::utf8(b"open_access_test"),
            &clock,
            ctx(& scenario)
        );
        
        // Charlie (not the original recipient) can settle
        test::next_tx(&mut scenario, CHARLIE);
        {
            let mut vault = test::take_shared<InterchainVaultContainer<SUI>>(&scenario);
            let mut registry = test::take_shared<ConsumedSecretsRegistry>(&scenario);
            
            let settlement_coin = interchain_vault_protocol::execute_complete_settlement(
                &mut vault,
                &mut registry,
                secret,
                &clock,
                ctx(& scenario)
            );
            
            assert!(coin::value(&settlement_coin) == 1500, 0);
            
            coin::burn_for_testing(settlement_coin);
            test::return_shared(vault);
            test::return_shared(registry);
        };
        
        clock::destroy_for_testing(clock);
        test::end(scenario);
    }

    #[test]
    fun test_secret_consumption_tracking() {
        let mut scenario = test::begin(ALICE);
        let ctx = test::ctx(&mut scenario);
        
        interchain_vault_protocol::init_for_testing(ctx);
        
        test::next_tx(&mut scenario, ALICE);
        {
            let registry = test::take_shared<ConsumedSecretsRegistry>(&scenario);
            let secret = b"consumption_test_secret";
            
            // Initially not consumed
            assert!(!interchain_vault_protocol::is_secret_consumed(&registry, &secret), 0);
            assert!(interchain_vault_protocol::get_consumed_secrets_count(&registry) == 0, 0);
            
            test::return_shared(registry);
        };
        
        test::end(scenario);
    }
}
