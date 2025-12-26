// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test, console2} from "forge-std/Test.sol";
import {ProfileRegistry} from "../../src/ProfileRegistry.sol";
import {IProfileRegistry} from "../../src/interfaces/IProfileRegistry.sol";

contract ProfileRegistryTest is Test {
    ProfileRegistry public registry;

    address public user1 = makeAddr("user1");
    address public user2 = makeAddr("user2");

    string public constant PROFILE_URI_1 = "ipfs://QmTest123";
    string public constant PROFILE_URI_2 = "ipfs://QmTest456";
    string public constant PROFILE_URI_UPDATED = "ipfs://QmTestUpdated";

    function setUp() public {
        registry = new ProfileRegistry();
    }

    function test_SetProfile_CreatesNewProfile() public {
        vm.prank(user1);
        registry.setProfile(PROFILE_URI_1);

        IProfileRegistry.Profile memory profile = registry.getProfile(user1);
        assertEq(profile.profileURI, PROFILE_URI_1);
        assertEq(profile.createdAt, block.timestamp);
        assertEq(profile.updatedAt, block.timestamp);
        assertTrue(registry.hasProfile(user1));
        assertEq(registry.totalProfiles(), 1);
    }

    function test_SetProfile_UpdatesExistingProfile() public {
        vm.startPrank(user1);
        registry.setProfile(PROFILE_URI_1);
        uint256 createdAt = block.timestamp;

        vm.warp(block.timestamp + 1 days);
        registry.setProfile(PROFILE_URI_UPDATED);
        vm.stopPrank();

        IProfileRegistry.Profile memory profile = registry.getProfile(user1);
        assertEq(profile.profileURI, PROFILE_URI_UPDATED);
        assertEq(profile.createdAt, createdAt);
        assertEq(profile.updatedAt, block.timestamp);
        assertEq(registry.totalProfiles(), 1); // Still 1
    }

    function test_SetProfile_RevertsOnEmptyURI() public {
        vm.prank(user1);
        vm.expectRevert(IProfileRegistry.EmptyProfileURI.selector);
        registry.setProfile("");
    }

    function test_GetProfileURI() public {
        vm.prank(user1);
        registry.setProfile(PROFILE_URI_1);

        assertEq(registry.getProfileURI(user1), PROFILE_URI_1);
    }

    function test_HasProfile_ReturnsFalseForNoProfile() public view {
        assertFalse(registry.hasProfile(user1));
    }

    function test_MultipleUsers() public {
        vm.prank(user1);
        registry.setProfile(PROFILE_URI_1);

        vm.prank(user2);
        registry.setProfile(PROFILE_URI_2);

        assertEq(registry.getProfileURI(user1), PROFILE_URI_1);
        assertEq(registry.getProfileURI(user2), PROFILE_URI_2);
        assertEq(registry.totalProfiles(), 2);
    }

    function test_EmitsProfileCreatedEvent() public {
        vm.prank(user1);
        vm.expectEmit(true, false, false, true);
        emit IProfileRegistry.ProfileCreated(user1, PROFILE_URI_1, block.timestamp);
        registry.setProfile(PROFILE_URI_1);
    }

    function test_EmitsProfileUpdatedEvent() public {
        vm.startPrank(user1);
        registry.setProfile(PROFILE_URI_1);

        vm.warp(block.timestamp + 1 days);
        vm.expectEmit(true, false, false, true);
        emit IProfileRegistry.ProfileUpdated(user1, PROFILE_URI_UPDATED, block.timestamp);
        registry.setProfile(PROFILE_URI_UPDATED);
        vm.stopPrank();
    }
}
