// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title IJobFactory
/// @notice Interface for the Pumasi Job Factory contract
/// @dev Creates and manages job escrows, collects platform fees
interface IJobFactory {
    // ============ Structs ============

    /// @notice Statistics for a user
    struct UserStats {
        uint256 jobsPosted;
        uint256 jobsCompleted;
        uint256 jobsCancelled;
        uint256 totalEarned;
        uint256 totalSpent;
    }

    // ============ Events ============

    /// @notice Emitted when platform fee is updated
    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);

    /// @notice Emitted when minimum budget is updated
    event MinBudgetUpdated(uint256 oldMin, uint256 newMin);

    /// @notice Emitted when treasury address is updated
    event TreasuryUpdated(address oldTreasury, address newTreasury);

    /// @notice Emitted when fees are collected
    event FeesCollected(address indexed treasury, uint256 amount);

    /// @notice Emitted when contract is paused
    event Paused(address indexed by, uint256 timestamp);

    /// @notice Emitted when contract is unpaused
    event Unpaused(address indexed by, uint256 timestamp);

    // ============ Errors ============

    /// @notice Thrown when contract is paused
    error ContractPaused();

    /// @notice Thrown when contract is not paused
    error ContractNotPaused();

    /// @notice Thrown when caller is not owner
    error NotOwner();

    /// @notice Thrown when fee exceeds maximum
    error FeeTooHigh();

    /// @notice Thrown when treasury address is invalid
    error InvalidTreasury();

    /// @notice Thrown when minimum budget is too low
    error MinBudgetTooLow();

    // ============ Functions ============

    /// @notice Get total number of jobs created
    /// @return Total job count
    function totalJobs() external view returns (uint256);

    /// @notice Get user statistics
    /// @param user The user address
    /// @return UserStats struct
    function getUserStats(address user) external view returns (UserStats memory);

    /// @notice Check if contract is paused
    /// @return True if paused
    function isPaused() external view returns (bool);

    /// @notice Get the treasury address
    /// @return Treasury address
    function treasury() external view returns (address);

    /// @notice Get accumulated fees ready for withdrawal
    /// @return Fee amount in wei
    function accumulatedFees() external view returns (uint256);

    /// @notice Pause the contract (owner only)
    function pause() external;

    /// @notice Unpause the contract (owner only)
    function unpause() external;

    /// @notice Update platform fee (owner only)
    /// @param newFeeBps New fee in basis points
    function setPlatformFee(uint256 newFeeBps) external;

    /// @notice Update minimum budget (owner only)
    /// @param newMinBudget New minimum budget in wei
    function setMinBudget(uint256 newMinBudget) external;

    /// @notice Update treasury address (owner only)
    /// @param newTreasury New treasury address
    function setTreasury(address newTreasury) external;

    /// @notice Withdraw accumulated fees to treasury (owner only)
    function withdrawFees() external;
}
