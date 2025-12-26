// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {JobFactory} from "../src/JobFactory.sol";
import {ApplicationRegistry} from "../src/ApplicationRegistry.sol";
import {MilestoneManager} from "../src/MilestoneManager.sol";
import {ReviewRegistry} from "../src/ReviewRegistry.sol";
import {ArbitrationDAO} from "../src/ArbitrationDAO.sol";
import {ProfileRegistry} from "../src/ProfileRegistry.sol";

/// @title DeployPumasi
/// @notice Deploys all Pumasi contracts with proper configuration
/// @dev Returns all deployed contracts for script composition
contract DeployPumasi is Script {
    // ============ Deployed Contracts ============
    JobFactory public jobFactory;
    ApplicationRegistry public applicationRegistry;
    MilestoneManager public milestoneManager;
    ReviewRegistry public reviewRegistry;
    ArbitrationDAO public arbitrationDAO;
    ProfileRegistry public profileRegistry;

    // ============ Configuration ============
    uint256 internal constant ANVIL_CHAIN_ID = 31337;
    uint256 internal constant VERYCHAIN_CHAIN_ID = 4613; // VeryChain mainnet

    // Default Anvil private key (account 0)
    uint256 internal constant ANVIL_PK = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;

    /// @notice Deployment result struct for easy return
    struct DeploymentResult {
        address jobFactory;
        address applicationRegistry;
        address milestoneManager;
        address reviewRegistry;
        address arbitrationDAO;
        address profileRegistry;
        address treasury;
        address deployer;
    }

    function run() external returns (DeploymentResult memory result) {
        (uint256 deployerPrivateKey, address deployer) = _getDeployer();
        address treasury = deployer; // Treasury receives platform fees

        _logHeader(deployer, treasury);

        vm.startBroadcast(deployerPrivateKey);

        result = _deployAll(treasury, deployer);

        vm.stopBroadcast();

        _logSummary(result);

        return result;
    }

    /// @notice Deploy with custom treasury address
    function runWithTreasury(address customTreasury) external returns (DeploymentResult memory result) {
        (uint256 deployerPrivateKey, address deployer) = _getDeployer();

        _logHeader(deployer, customTreasury);

        vm.startBroadcast(deployerPrivateKey);

        result = _deployAll(customTreasury, deployer);

        vm.stopBroadcast();

        _logSummary(result);

        return result;
    }

    // ============ Internal Functions ============

    function _getDeployer() internal view returns (uint256 pk, address deployer) {
        // Try to read from env first (for mainnet deployment)
        try vm.envString("PRIVATE_KEY") returns (string memory pkString) {
            if (bytes(pkString).length > 0) {
                pk = vm.parseUint(string.concat("0x", pkString));
                deployer = vm.addr(pk);
                return (pk, deployer);
            }
        } catch {}

        // Fallback to Anvil key for local testing
        pk = ANVIL_PK;
        deployer = vm.addr(pk);
    }

    function _deployAll(address treasury, address deployer) internal returns (DeploymentResult memory result) {
        // 1. Deploy ProfileRegistry (independent)
        profileRegistry = new ProfileRegistry();
        console2.log("ProfileRegistry deployed:", address(profileRegistry));

        // 2. Deploy JobFactory (core - uses treasury)
        jobFactory = new JobFactory(treasury);
        console2.log("JobFactory deployed:", address(jobFactory));

        // 3. Deploy ApplicationRegistry (depends on JobFactory)
        applicationRegistry = new ApplicationRegistry(address(jobFactory));
        console2.log("ApplicationRegistry deployed:", address(applicationRegistry));

        // 4. Deploy MilestoneManager (depends on JobFactory + treasury)
        milestoneManager = new MilestoneManager(address(jobFactory), treasury);
        console2.log("MilestoneManager deployed:", address(milestoneManager));

        // 5. Deploy ReviewRegistry (depends on JobFactory)
        reviewRegistry = new ReviewRegistry(address(jobFactory));
        console2.log("ReviewRegistry deployed:", address(reviewRegistry));

        // 6. Deploy ArbitrationDAO (depends on JobFactory + treasury)
        arbitrationDAO = new ArbitrationDAO(address(jobFactory), treasury);
        console2.log("ArbitrationDAO deployed:", address(arbitrationDAO));

        result = DeploymentResult({
            jobFactory: address(jobFactory),
            applicationRegistry: address(applicationRegistry),
            milestoneManager: address(milestoneManager),
            reviewRegistry: address(reviewRegistry),
            arbitrationDAO: address(arbitrationDAO),
            profileRegistry: address(profileRegistry),
            treasury: treasury,
            deployer: deployer
        });
    }

    function _logHeader(address deployer, address treasury) internal view {
        console2.log("====================================");
        console2.log("Deploying Pumasi Contracts");
        console2.log("====================================");
        console2.log("Chain ID:", block.chainid);
        console2.log("Deployer:", deployer);
        console2.log("Treasury:", treasury);
        console2.log("====================================");
    }

    function _logSummary(DeploymentResult memory result) internal pure {
        console2.log("\n====================================");
        console2.log("DEPLOYMENT COMPLETE");
        console2.log("====================================");
        console2.log("ProfileRegistry:", result.profileRegistry);
        console2.log("JobFactory:", result.jobFactory);
        console2.log("ApplicationRegistry:", result.applicationRegistry);
        console2.log("MilestoneManager:", result.milestoneManager);
        console2.log("ReviewRegistry:", result.reviewRegistry);
        console2.log("ArbitrationDAO:", result.arbitrationDAO);
        console2.log("------------------------------------");
        console2.log("Treasury:", result.treasury);
        console2.log("Deployer:", result.deployer);
        console2.log("====================================");
    }
}
