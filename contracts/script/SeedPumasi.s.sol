// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {JobFactory} from "../src/JobFactory.sol";
import {ApplicationRegistry} from "../src/ApplicationRegistry.sol";
import {ReviewRegistry} from "../src/ReviewRegistry.sol";
import {ProfileRegistry} from "../src/ProfileRegistry.sol";
import {IJobFactory} from "../src/interfaces/IJobFactory.sol";

/// @title SeedPumasi
/// @notice Seeds Pumasi contracts with test data for development/demo
/// @dev Uses Anvil test accounts (accounts 0-9 from default mnemonic)
contract SeedPumasi is Script {
    // ============ Contract References ============
    JobFactory public jobFactory;
    ApplicationRegistry public applicationRegistry;
    ReviewRegistry public reviewRegistry;
    ProfileRegistry public profileRegistry;

    // ============ Test Accounts (Anvil defaults) ============
    uint256 constant ANVIL_PK_0 = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
    uint256 constant ANVIL_PK_1 = 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d;
    uint256 constant ANVIL_PK_2 = 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a;
    uint256 constant ANVIL_PK_3 = 0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6;
    uint256 constant ANVIL_PK_4 = 0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a;

    // Test accounts derived from private keys
    address public alice; // Account 0 - Admin/Treasury
    address public bob;   // Account 1 - Client
    address public carol; // Account 2 - Freelancer
    address public dave;  // Account 3 - Freelancer
    address public eve;   // Account 4 - Client

    // ============ Seed Configuration ============
    uint256 constant JOB_BUDGET_1 = 0.5 ether;
    uint256 constant JOB_BUDGET_2 = 1 ether;
    uint256 constant JOB_BUDGET_3 = 0.25 ether;
    uint256 constant JOB_DEADLINE = 30 days;

    // ============ Real IPFS URIs (Generated via scripts/upload-metadata.js) ============
    // Profile metadata URIs (ProfileMetadata schema)
    string constant ALICE_PROFILE = "ipfs://bafkreigef4me65xqglhiyv6rzd5zt3buvxkyggazptqppsndwf4pdnpe2y";
    string constant BOB_PROFILE = "ipfs://bafkreihzy22yms45hx7sqansxa7foyctxua3zeiswygvkvpfrscdgw6oz4";
    string constant CAROL_PROFILE = "ipfs://bafkreie3zbuqoulc3o3dju4mrydipzgelk6dkurto4g2zgofynwxjhvs6q";
    string constant DAVE_PROFILE = "ipfs://bafkreig5ccqhworerig2iwcx4hyh2jglqakpwo5u7lb6xmmans4uqk6mau";
    string constant EVE_PROFILE = "ipfs://bafkreih3kgsghm5ibbnbfn4xx3pbadxmq43v2y4y4xok5zpotufaebovsa";

    // Job metadata URIs (JobMetadata schema)
    string constant JOB0_META = "ipfs://bafkreiapvcj35kozozrglwiz2n3b2pqwsal4hyndmszl2e7s3kkjmidmye";
    string constant JOB1_META = "ipfs://bafkreibpdn44cx7dbraqk5j776nvvu4erhafmpli4sgpelbefvee4v24le";
    string constant JOB2_META = "ipfs://bafkreiabnmmmtpigw62sdcgxnyb4mpddeufdletqoi4gsh4sifiu66prnu";
    string constant JOB3_META = "ipfs://bafkreihucdwmddv6hgndg4rjjcblknfszb6bt3orqmcayoqoulelveji7u";

    // Proposal metadata URIs (ProposalMetadata schema)
    string constant CAROL_PROP0 = "ipfs://bafkreibvsphtmo4o4prhlxl5mgahoihf56ls7uy5y3dmsq5vgvf4okaviu";
    string constant DAVE_PROP0 = "ipfs://bafkreifzz7c6qsy3yufnxiqw5eptbahyphml6fbd5gd5czyllljznmubde";
    string constant CAROL_PROP1 = "ipfs://bafkreieitnttvnn7kesjtptc3e5nhzpogiryk7nzegufo67n2ocan6ogru";
    string constant DAVE_PROP2 = "ipfs://bafkreigzs2ks7dymeyne75eqmjkqzhiyznm3wvbw5iakpnfmh6viarbodu";
    string constant CAROL_PROP3 = "ipfs://bafkreiadk5uugev7yx74xztua4hdptdvl4qgo2x3mfv2kugp44z7kmolqm";

    // Deliverable metadata URI (DeliverableMetadata schema)
    string constant DELIVERABLE3 = "ipfs://bafkreicykjhwl5f4y5uh55gvvnhgp3flocdtlmbnge3uiougx463r55cay";

    // Review comment URIs (ReviewMetadata schema)
    string constant REVIEW_EVE_CAROL = "ipfs://bafkreie2wszfewbri5lbm2zhpmogquirfqg2h6intc32pu4mjwb4zucsxu";
    string constant REVIEW_CAROL_EVE = "ipfs://bafkreihns7hxjyeume5otytuhgvcag5eqlnr2cmeyjyoqyugvvejmqghoy";

    /// @notice Run seeding with deployed contract addresses
    function run(
        address _jobFactory,
        address _applicationRegistry,
        address _reviewRegistry,
        address _profileRegistry
    ) external {
        _initContracts(_jobFactory, _applicationRegistry, _reviewRegistry, _profileRegistry);
        _initAccounts();
        _logHeader();

        _seedProfiles();
        _seedJobs();
        _seedApplications();
        _seedCompletedJob();

        _logSummary();
    }

    /// @notice Run seeding reading addresses from environment
    function runFromEnv() external {
        address jf = vm.envAddress("JOB_FACTORY");
        address ar = vm.envAddress("APPLICATION_REGISTRY");
        address rr = vm.envAddress("REVIEW_REGISTRY");
        address pr = vm.envAddress("PROFILE_REGISTRY");

        _initContracts(jf, ar, rr, pr);
        _initAccounts();
        _logHeader();

        _seedProfiles();
        _seedJobs();
        _seedApplications();
        _seedCompletedJob();

        _logSummary();
    }

    // ============ Internal Functions ============

    function _initContracts(address jf, address ar, address rr, address pr) internal {
        jobFactory = JobFactory(jf);
        applicationRegistry = ApplicationRegistry(ar);
        reviewRegistry = ReviewRegistry(rr);
        profileRegistry = ProfileRegistry(pr);
    }

    function _initAccounts() internal {
        alice = vm.addr(ANVIL_PK_0);
        bob = vm.addr(ANVIL_PK_1);
        carol = vm.addr(ANVIL_PK_2);
        dave = vm.addr(ANVIL_PK_3);
        eve = vm.addr(ANVIL_PK_4);
    }

    function _seedProfiles() internal {
        console2.log("\n--- Seeding Profiles ---");

        // Alice's profile (Admin)
        vm.broadcast(ANVIL_PK_0);
        profileRegistry.setProfile(ALICE_PROFILE);
        console2.log("Alice profile set:", alice);

        // Bob's profile (Client)
        vm.broadcast(ANVIL_PK_1);
        profileRegistry.setProfile(BOB_PROFILE);
        console2.log("Bob profile set:", bob);

        // Carol's profile (Freelancer)
        vm.broadcast(ANVIL_PK_2);
        profileRegistry.setProfile(CAROL_PROFILE);
        console2.log("Carol profile set:", carol);

        // Dave's profile (Freelancer)
        vm.broadcast(ANVIL_PK_3);
        profileRegistry.setProfile(DAVE_PROFILE);
        console2.log("Dave profile set:", dave);

        // Eve's profile (Client)
        vm.broadcast(ANVIL_PK_4);
        profileRegistry.setProfile(EVE_PROFILE);
        console2.log("Eve profile set:", eve);
    }

    function _seedJobs() internal {
        console2.log("\n--- Seeding Jobs ---");
        uint256 deadline = block.timestamp + JOB_DEADLINE;

        // Job 0: Bob posts - Open (Web Development)
        vm.broadcast(ANVIL_PK_1);
        uint256 job0 = jobFactory.createJob{value: JOB_BUDGET_1}(deadline, JOB0_META);
        console2.log("Job 0 created (Open):", job0, "Budget:", JOB_BUDGET_1);

        // Job 1: Bob posts - Will be assigned to Carol
        vm.broadcast(ANVIL_PK_1);
        uint256 job1 = jobFactory.createJob{value: JOB_BUDGET_2}(deadline, JOB1_META);
        console2.log("Job 1 created (for assignment):", job1, "Budget:", JOB_BUDGET_2);

        // Job 2: Eve posts - Open (Design)
        vm.broadcast(ANVIL_PK_4);
        uint256 job2 = jobFactory.createJob{value: JOB_BUDGET_3}(deadline, JOB2_META);
        console2.log("Job 2 created (Open):", job2, "Budget:", JOB_BUDGET_3);

        // Job 3: Eve posts - Will complete full cycle
        vm.broadcast(ANVIL_PK_4);
        uint256 job3 = jobFactory.createJob{value: JOB_BUDGET_1}(deadline, JOB3_META);
        console2.log("Job 3 created (for completion):", job3, "Budget:", JOB_BUDGET_1);
    }

    function _seedApplications() internal {
        console2.log("\n--- Seeding Applications ---");

        // Carol applies to Job 0 (Open)
        vm.broadcast(ANVIL_PK_2);
        uint256 app0 = applicationRegistry.submitApplication(0, CAROL_PROP0);
        console2.log("Carol applied to Job 0, app:", app0);

        // Dave applies to Job 0 (Open)
        vm.broadcast(ANVIL_PK_3);
        uint256 app1 = applicationRegistry.submitApplication(0, DAVE_PROP0);
        console2.log("Dave applied to Job 0, app:", app1);

        // Carol applies to Job 1
        vm.broadcast(ANVIL_PK_2);
        uint256 app2 = applicationRegistry.submitApplication(1, CAROL_PROP1);
        console2.log("Carol applied to Job 1, app:", app2);

        // Bob accepts Carol's application for Job 1 and assigns her
        vm.broadcast(ANVIL_PK_1);
        applicationRegistry.acceptApplication(app2);
        console2.log("Bob accepted Carol's application for Job 1");

        vm.broadcast(ANVIL_PK_1);
        jobFactory.assignFreelancer(1, carol);
        console2.log("Bob assigned Carol to Job 1");

        // Dave applies to Job 2
        vm.broadcast(ANVIL_PK_3);
        uint256 app3 = applicationRegistry.submitApplication(2, DAVE_PROP2);
        console2.log("Dave applied to Job 2, app:", app3);

        // Carol applies to Job 3 (will be completed)
        vm.broadcast(ANVIL_PK_2);
        uint256 app4 = applicationRegistry.submitApplication(3, CAROL_PROP3);
        console2.log("Carol applied to Job 3, app:", app4);

        // Eve accepts Carol's application for Job 3
        vm.broadcast(ANVIL_PK_4);
        applicationRegistry.acceptApplication(app4);
        console2.log("Eve accepted Carol's application for Job 3");

        vm.broadcast(ANVIL_PK_4);
        jobFactory.assignFreelancer(3, carol);
        console2.log("Eve assigned Carol to Job 3");
    }

    function _seedCompletedJob() internal {
        console2.log("\n--- Completing Job 3 ---");

        // Carol submits deliverable for Job 3
        vm.broadcast(ANVIL_PK_2);
        jobFactory.submitDeliverable(3, DELIVERABLE3);
        console2.log("Carol submitted deliverable for Job 3");

        // Eve approves the delivery
        vm.broadcast(ANVIL_PK_4);
        jobFactory.approveDelivery(3);
        console2.log("Eve approved Job 3 delivery");

        // Eve reviews Carol (5 stars)
        vm.broadcast(ANVIL_PK_4);
        reviewRegistry.submitReview(3, 5, REVIEW_EVE_CAROL);
        console2.log("Eve gave Carol 5-star review");

        // Carol reviews Eve (4 stars)
        vm.broadcast(ANVIL_PK_2);
        reviewRegistry.submitReview(3, 4, REVIEW_CAROL_EVE);
        console2.log("Carol gave Eve 4-star review");
    }

    function _logHeader() internal view {
        console2.log("====================================");
        console2.log("Seeding Pumasi Contracts");
        console2.log("====================================");
        console2.log("Chain ID:", block.chainid);
        console2.log("JobFactory:", address(jobFactory));
        console2.log("ApplicationRegistry:", address(applicationRegistry));
        console2.log("ReviewRegistry:", address(reviewRegistry));
        console2.log("ProfileRegistry:", address(profileRegistry));
        console2.log("------------------------------------");
        console2.log("Alice (Admin):", alice);
        console2.log("Bob (Client):", bob);
        console2.log("Carol (Freelancer):", carol);
        console2.log("Dave (Freelancer):", dave);
        console2.log("Eve (Client):", eve);
        console2.log("====================================");
    }

    function _logSummary() internal view {
        console2.log("\n====================================");
        console2.log("SEEDING COMPLETE");
        console2.log("====================================");
        console2.log("Profiles created:", profileRegistry.totalProfiles());
        console2.log("Jobs created:", jobFactory.totalJobs());
        console2.log("------------------------------------");
        console2.log("Job 0: Open (Bob) - 2 applications");
        console2.log("Job 1: InProgress (Bob->Carol)");
        console2.log("Job 2: Open (Eve) - 1 application");
        console2.log("Job 3: Completed (Eve->Carol) + reviews");
        console2.log("====================================");
    }
}
