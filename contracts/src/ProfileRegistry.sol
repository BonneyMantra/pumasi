// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IProfileRegistry} from "./interfaces/IProfileRegistry.sol";

/// @title ProfileRegistry
/// @notice Manages user profile metadata stored on IPFS
/// @dev Simple registry that links wallet addresses to IPFS profile metadata
contract ProfileRegistry is IProfileRegistry {
    // ============ Storage ============

    /// @notice Mapping of user address to profile data
    mapping(address => Profile) private _profiles;

    /// @notice Total number of profiles created
    uint256 public totalProfiles;

    // ============ External Functions ============

    /// @inheritdoc IProfileRegistry
    function setProfile(string calldata profileURI) external {
        if (bytes(profileURI).length == 0) revert EmptyProfileURI();

        Profile storage profile = _profiles[msg.sender];
        bool isNew = profile.createdAt == 0;

        if (isNew) {
            profile.createdAt = block.timestamp;
            totalProfiles++;
            emit ProfileCreated(msg.sender, profileURI, block.timestamp);
        } else {
            emit ProfileUpdated(msg.sender, profileURI, block.timestamp);
        }

        profile.profileURI = profileURI;
        profile.updatedAt = block.timestamp;
    }

    // ============ View Functions ============

    /// @inheritdoc IProfileRegistry
    function getProfile(address user) external view returns (Profile memory) {
        return _profiles[user];
    }

    /// @inheritdoc IProfileRegistry
    function getProfileURI(address user) external view returns (string memory) {
        return _profiles[user].profileURI;
    }

    /// @inheritdoc IProfileRegistry
    function hasProfile(address user) external view returns (bool) {
        return _profiles[user].createdAt != 0;
    }
}
