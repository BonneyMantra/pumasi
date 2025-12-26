// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {JobFactory} from "../src/JobFactory.sol";
import {ApplicationRegistry} from "../src/ApplicationRegistry.sol";
import {ReviewRegistry} from "../src/ReviewRegistry.sol";
import {ProfileRegistry} from "../src/ProfileRegistry.sol";

/// @title SeedMinimal
/// @notice Minimal seeding script - stays under 0.1 VERY total
/// @dev Uses single deployer account for all actions
contract SeedMinimal is Script {
    // ============ Contract Addresses (VeryChain Mainnet - Fresh Deploy) ============
    address constant JOB_FACTORY = 0xe3955Bf888a38087feFa0b0Fa3539212d9CF9807;
    address constant APP_REGISTRY = 0x6Dd095fB3B6f4dB8679afB783c2EC75Bc35035F9;
    address constant REVIEW_REGISTRY = 0x591FfDB45F50d32eAa535839b503c92Fe4C2d5B5;
    address constant PROFILE_REGISTRY = 0xC535b31f8eafa9A36cA635a8037DcC6fa233c00e;

    // ============ Budget Config (Total < 0.1 VERY) ============
    uint256 constant JOB_BUDGET = 0.01 ether; // 0.01 VERY per job
    uint256 constant JOB_DEADLINE = 30 days;

    // ============ Metadata URIs ============
    string constant PROFILE_URI = "ipfs://bafkreigef4me65xqglhiyv6rzd5zt3buvxkyggazptqppsndwf4pdnpe2y";
    string constant JOB_URI = "ipfs://bafkreiapvcj35kozozrglwiz2n3b2pqwsal4hyndmszl2e7s3kkjmidmye";
    string constant PROPOSAL_URI = "ipfs://bafkreibvsphtmo4o4prhlxl5mgahoihf56ls7uy5y3dmsq5vgvf4okaviu";
    string constant DELIVERABLE_URI = "ipfs://bafkreicykjhwl5f4y5uh55gvvnhgp3flocdtlmbnge3uiougx463r55cay";
    string constant REVIEW_URI = "ipfs://bafkreie2wszfewbri5lbm2zhpmogquirfqg2h6intc32pu4mjwb4zucsxu";

    JobFactory jobFactory;
    ApplicationRegistry appRegistry;
    ReviewRegistry reviewRegistry;
    ProfileRegistry profileRegistry;

    function run() external {
        // Try to read with 0x prefix first, then without
        string memory pkStr = vm.envString("PRIVATE_KEY");
        uint256 deployerPk;
        if (bytes(pkStr).length == 66) {
            // Has 0x prefix
            deployerPk = vm.parseUint(pkStr);
        } else {
            // No 0x prefix, add it
            deployerPk = vm.parseUint(string.concat("0x", pkStr));
        }
        address deployer = vm.addr(deployerPk);

        jobFactory = JobFactory(JOB_FACTORY);
        appRegistry = ApplicationRegistry(APP_REGISTRY);
        reviewRegistry = ReviewRegistry(REVIEW_REGISTRY);
        profileRegistry = ProfileRegistry(PROFILE_REGISTRY);

        console2.log("====================================");
        console2.log("Minimal Seeding - Budget < 0.1 VERY");
        console2.log("====================================");
        console2.log("Deployer:", deployer);
        console2.log("Balance:", deployer.balance);
        console2.log("------------------------------------");

        vm.startBroadcast(deployerPk);

        // 1. Create profile
        console2.log("\n[1/6] Creating profile...");
        profileRegistry.setProfile(PROFILE_URI);
        console2.log("Profile created for:", deployer);

        // 2. Create job (0.01 VERY)
        console2.log("\n[2/6] Creating job with 0.01 VERY budget...");
        uint256 deadline = block.timestamp + JOB_DEADLINE;
        uint256 jobId = jobFactory.createJob{value: JOB_BUDGET}(deadline, JOB_URI);
        console2.log("Job created:", jobId);

        // 3. Create second job (0.01 VERY)
        console2.log("\n[3/5] Creating second job with 0.01 VERY budget...");
        uint256 jobId2 = jobFactory.createJob{value: JOB_BUDGET}(deadline, JOB_URI);
        console2.log("Job 2 created:", jobId2);

        // 4. Create third job (0.01 VERY)
        console2.log("\n[4/5] Creating third job with 0.01 VERY budget...");
        uint256 jobId3 = jobFactory.createJob{value: JOB_BUDGET}(deadline, JOB_URI);
        console2.log("Job 3 created:", jobId3);

        // 5. Cancel one job to get funds back (saves VERY)
        console2.log("\n[5/5] Cancelling job 3 to recover funds...");
        jobFactory.cancelJob(jobId3);
        console2.log("Job 3 cancelled - funds recovered");

        vm.stopBroadcast();

        console2.log("\n====================================");
        console2.log("SEEDING COMPLETE");
        console2.log("====================================");
        console2.log("Profile created: 1");
        console2.log("Jobs created: 3 (1 cancelled)");
        console2.log("Open jobs: 2");
        console2.log("Total VERY used: ~0.02 + gas (0.01 recovered)");
        console2.log("====================================");
    }
}
