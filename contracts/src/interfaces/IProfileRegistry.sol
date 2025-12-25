// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title IProfileRegistry
/// @notice Interface for the Pumasi Profile Registry contract
/// @dev Manages user profile metadata stored on IPFS
interface IProfileRegistry {
    // ============ Structs ============

    /// @notice Represents a user profile
    struct Profile {
        string profileURI;      // IPFS URI containing profile metadata
        uint256 createdAt;      // First profile creation timestamp
        uint256 updatedAt;      // Last update timestamp
    }

    // ============ Events ============

    /// @notice Emitted when a profile is created
    event ProfileCreated(
        address indexed user,
        string profileURI,
        uint256 timestamp
    );

    /// @notice Emitted when a profile is updated
    event ProfileUpdated(
        address indexed user,
        string profileURI,
        uint256 timestamp
    );

    // ============ Errors ============

    /// @notice Thrown when profile URI is empty
    error EmptyProfileURI();

    /// @notice Thrown when profile doesn't exist
    error ProfileNotFound();

    // ============ Functions ============

    /// @notice Create or update your profile
    /// @param profileURI IPFS URI containing profile metadata JSON
    function setProfile(string calldata profileURI) external;

    /// @notice Get a user's profile
    /// @param user The user address
    /// @return Profile struct
    function getProfile(address user) external view returns (Profile memory);

    /// @notice Get a user's profile URI
    /// @param user The user address
    /// @return IPFS URI string
    function getProfileURI(address user) external view returns (string memory);

    /// @notice Check if a user has a profile
    /// @param user The user address
    /// @return True if profile exists
    function hasProfile(address user) external view returns (bool);
}
