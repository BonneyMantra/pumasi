// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {ProfileRegistry} from "../src/ProfileRegistry.sol";

/// @title DeployProfileRegistry
/// @notice Deploys the ProfileRegistry contract
contract DeployProfileRegistry is Script {
    ProfileRegistry public profileRegistry;

    function run() external {
        string memory pkString = vm.envString("PRIVATE_KEY");
        uint256 deployerPrivateKey = vm.parseUint(string.concat("0x", pkString));
        address deployer = vm.addr(deployerPrivateKey);

        console2.log("====================================");
        console2.log("Deploying ProfileRegistry");
        console2.log("Chain ID:", block.chainid);
        console2.log("Deployer:", deployer);
        console2.log("====================================");

        vm.startBroadcast(deployerPrivateKey);

        profileRegistry = new ProfileRegistry();
        console2.log("ProfileRegistry deployed:", address(profileRegistry));

        vm.stopBroadcast();

        console2.log("\n====================================");
        console2.log("Add to frontend/.env.local:");
        console2.log("NEXT_PUBLIC_PROFILE_REGISTRY_ADDRESS=", address(profileRegistry));
        console2.log("====================================");
    }
}
