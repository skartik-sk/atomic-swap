/// @title temporal_validation
/// @dev Temporal security enforcement for atomic swap operations
/// @author Atomic Swap Protocol Team
/// @notice Time-based validation mechanisms with multiple security layers
module atomic_swap_sui::temporal_validation {
    use sui::clock::{Self, Clock};
    
    /// Duration constants in milliseconds for different security levels
    const MINIMUM_SECURITY_DURATION: u64 = 300000;        // 5 minutes
    const STANDARD_SECURITY_DURATION: u64 = 3600000;      // 1 hour
    const ENHANCED_SECURITY_DURATION: u64 = 86400000;     // 24 hours
    const MAXIMUM_SECURITY_DURATION: u64 = 604800000;     // 7 days

    /// Error constants with unique identifiers
    const E_INVALID_DURATION_PARAMETER: u64 = 0x2001;
    const E_TIMESTAMP_OUT_OF_BOUNDS: u64 = 0x2002;
    const E_TEMPORAL_WINDOW_EXPIRED: u64 = 0x2003;
    const E_TEMPORAL_SEQUENCE_INVALID: u64 = 0x2004;
    const E_CLOCK_REFERENCE_MISSING: u64 = 0x2005;

    /// Creates expiration timestamp with specified security duration
    /// @param security_duration Duration in milliseconds
    /// @param clock_reference System clock reference
    /// @return Future expiration timestamp
    public fun create_expiration_timestamp(
        security_duration: u64, 
        clock_reference: &Clock
    ): u64 {
        assert!(is_valid_security_duration(security_duration), E_INVALID_DURATION_PARAMETER);
        
        let current_timestamp = clock::timestamp_ms(clock_reference);
        current_timestamp + security_duration
    }

    /// Validates if security duration is within acceptable bounds
    /// @param duration_ms Duration in milliseconds to validate
    /// @return True if duration is valid
    public fun is_valid_security_duration(duration_ms: u64): bool {
        duration_ms >= MINIMUM_SECURITY_DURATION && duration_ms <= MAXIMUM_SECURITY_DURATION
    }

    /// Checks if temporal window has expired
    /// @param expiration_timestamp Target expiration time
    /// @param clock_reference System clock reference
    /// @return True if window has expired
    public fun is_temporal_window_expired(
        expiration_timestamp: u64, 
        clock_reference: &Clock
    ): bool {
        let current_timestamp = clock::timestamp_ms(clock_reference);
        current_timestamp >= expiration_timestamp
    }

    /// Checks if temporal window is still active
    /// @param expiration_timestamp Target expiration time
    /// @param clock_reference System clock reference
    /// @return True if window is still active
    public fun is_temporal_window_active(
        expiration_timestamp: u64, 
        clock_reference: &Clock
    ): bool {
        let current_timestamp = clock::timestamp_ms(clock_reference);
        current_timestamp < expiration_timestamp
    }

    /// Calculates remaining time in temporal window
    /// @param expiration_timestamp Target expiration time
    /// @param clock_reference System clock reference
    /// @return Remaining milliseconds (0 if expired)
    public fun get_remaining_temporal_duration(
        expiration_timestamp: u64, 
        clock_reference: &Clock
    ): u64 {
        let current_timestamp = clock::timestamp_ms(clock_reference);
        
        if (current_timestamp >= expiration_timestamp) {
            0
        } else {
            expiration_timestamp - current_timestamp
        }
    }

    /// Validates timestamp is reasonable (not too far in past/future)
    /// @param target_timestamp Timestamp to validate
    /// @param clock_reference System clock reference
    /// @return True if timestamp is reasonable
    public fun is_reasonable_timestamp(
        target_timestamp: u64, 
        clock_reference: &Clock
    ): bool {
        let current_timestamp = clock::timestamp_ms(clock_reference);
        
        // Allow 1 minute tolerance for clock variance
        let tolerance_window = 60000;
        
        // Cannot be too far in past
        if (target_timestamp < current_timestamp - tolerance_window) {
            return false
        };
        
        // Cannot be more than maximum duration in future
        if (target_timestamp > current_timestamp + MAXIMUM_SECURITY_DURATION) {
            return false
        };
        
        true
    }

    /// Creates standard security expiration timestamp
    /// @param clock_reference System clock reference
    /// @return Standard duration expiration timestamp
    public fun create_standard_expiration(clock_reference: &Clock): u64 {
        let current_timestamp = clock::timestamp_ms(clock_reference);
        current_timestamp + STANDARD_SECURITY_DURATION
    }

    /// Creates enhanced security expiration timestamp
    /// @param clock_reference System clock reference  
    /// @return Enhanced duration expiration timestamp
    public fun create_enhanced_expiration(clock_reference: &Clock): u64 {
        let current_timestamp = clock::timestamp_ms(clock_reference);
        current_timestamp + ENHANCED_SECURITY_DURATION
    }

    /// Validates temporal sequence (first expires before second)
    /// @param first_expiration Earlier expiration timestamp
    /// @param second_expiration Later expiration timestamp
    /// @return True if sequence is valid
    public fun validate_temporal_sequence(
        first_expiration: u64, 
        second_expiration: u64
    ): bool {
        first_expiration < second_expiration
    }

    /// Calculates percentage of temporal window elapsed
    /// @param start_timestamp When window started
    /// @param expiration_timestamp When window expires
    /// @param clock_reference System clock reference
    /// @return Percentage elapsed (0-100)
    public fun get_elapsed_percentage(
        start_timestamp: u64,
        expiration_timestamp: u64,
        clock_reference: &Clock
    ): u64 {
        assert!(start_timestamp < expiration_timestamp, E_TEMPORAL_SEQUENCE_INVALID);
        
        let current_timestamp = clock::timestamp_ms(clock_reference);
        let total_duration = expiration_timestamp - start_timestamp;
        
        if (current_timestamp <= start_timestamp) {
            0
        } else if (current_timestamp >= expiration_timestamp) {
            100
        } else {
            let elapsed_duration = current_timestamp - start_timestamp;
            (elapsed_duration * 100) / total_duration
        }
    }

    /// Validates temporal window overlap between two periods
    /// @param first_start Start of first window
    /// @param first_end End of first window
    /// @param second_start Start of second window
    /// @param second_end End of second window
    /// @return True if windows overlap
    public fun check_temporal_overlap(
        first_start: u64,
        first_end: u64,
        second_start: u64,
        second_end: u64
    ): bool {
        assert!(first_start < first_end, E_TEMPORAL_SEQUENCE_INVALID);
        assert!(second_start < second_end, E_TEMPORAL_SEQUENCE_INVALID);
        
        !(first_end <= second_start || second_end <= first_start)
    }

    /// Creates temporal window with buffer periods
    /// @param core_duration Main duration for the window
    /// @param buffer_duration Additional buffer time
    /// @param clock_reference System clock reference
    /// @return Expiration timestamp with buffer
    public fun create_buffered_expiration(
        core_duration: u64,
        buffer_duration: u64,
        clock_reference: &Clock
    ): u64 {
        let total_duration = core_duration + buffer_duration;
        assert!(is_valid_security_duration(total_duration), E_INVALID_DURATION_PARAMETER);
        
        create_expiration_timestamp(total_duration, clock_reference)
    }

    /// Gets standard duration constant
    /// @return Standard security duration in milliseconds
    public fun get_standard_duration(): u64 {
        STANDARD_SECURITY_DURATION
    }

    /// Gets enhanced duration constant
    /// @return Enhanced security duration in milliseconds
    public fun get_enhanced_duration(): u64 {
        ENHANCED_SECURITY_DURATION
    }

    /// Gets minimum duration constant
    /// @return Minimum security duration in milliseconds
    public fun get_minimum_duration(): u64 {
        MINIMUM_SECURITY_DURATION
    }

    /// Gets maximum duration constant
    /// @return Maximum security duration in milliseconds
    public fun get_maximum_duration(): u64 {
        MAXIMUM_SECURITY_DURATION
    }

    #[test_only]
    public fun init_for_testing(ctx: &mut sui::tx_context::TxContext) {
        // Test initialization function
    }

    #[test]
    fun test_duration_validation() {
        assert!(is_valid_security_duration(STANDARD_SECURITY_DURATION), 0);
        assert!(!is_valid_security_duration(100), 0); // Too short
        assert!(!is_valid_security_duration(MAXIMUM_SECURITY_DURATION + 1), 0); // Too long
    }

    #[test]
    fun test_temporal_sequence() {
        let first = 1000000;
        let second = 2000000;
        assert!(validate_temporal_sequence(first, second), 0);
        assert!(!validate_temporal_sequence(second, first), 0);
    }

    #[test]
    fun test_temporal_overlap() {
        // Non-overlapping windows
        assert!(!check_temporal_overlap(1000, 2000, 3000, 4000), 0);
        
        // Overlapping windows
        assert!(check_temporal_overlap(1000, 3000, 2000, 4000), 0);
    }
}
