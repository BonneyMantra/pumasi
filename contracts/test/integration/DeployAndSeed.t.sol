// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test, console2} from "forge-std/Test.sol";
import {DeployPumasi} from "../../script/DeployPumasi.s.sol";
import {SeedPumasi} from "../../script/SeedPumasi.s.sol";
import {JobFactory} from "../../src/JobFactory.sol";
import {ApplicationRegistry} from "../../src/ApplicationRegistry.sol";
import {ReviewRegistry} from "../../src/ReviewRegistry.sol";
import {ProfileRegistry} from "../../src/ProfileRegistry.sol";
import {IJobFactory} from "../../src/interfaces/IJobFactory.sol";
import {IJobEscrow} from "../../src/interfaces/IJobEscrow.sol";

/// @title DeployAndSeedTest
/// @notice Integration test simulating full deployment and seeding workflow
/// @dev Run with: forge test --match-contract DeployAndSeedTest -vvv
contract DeployAndSeedTest is Test {
    DeployPumasi deployer;
    SeedPumasi seeder;
    DeployPumasi.DeploymentResult result;

    // Test accounts (same as SeedPumasi)
    address alice;
    address bob;
    address carol;
    address dave;
    address eve;

    function setUp() public {
        // Initialize deployer and seeder
        deployer = new DeployPumasi();
        seeder = new SeedPumasi();

        // Initialize test accounts
        alice = vm.addr(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80);
        bob = vm.addr(0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d);
        carol = vm.addr(0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a);
        dave = vm.addr(0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6);
        eve = vm.addr(0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a);

        // Fund test accounts
        vm.deal(alice, 100 ether);
        vm.deal(bob, 100 ether);
        vm.deal(carol, 100 ether);
        vm.deal(dave, 100 ether);
        vm.deal(eve, 100 ether);
    }

    function test_FullDeployment() public {
        // Run deployment
        result = deployer.run();

        // Verify all contracts deployed
        assertTrue(result.jobFactory != address(0), "JobFactory not deployed");
        assertTrue(result.applicationRegistry != address(0), "ApplicationRegistry not deployed");
        assertTrue(result.reviewRegistry != address(0), "ReviewRegistry not deployed");
        assertTrue(result.profileRegistry != address(0), "ProfileRegistry not deployed");
        assertTrue(result.milestoneManager != address(0), "MilestoneManager not deployed");
        assertTrue(result.arbitrationDAO != address(0), "ArbitrationDAO not deployed");

        // Verify JobFactory configuration
        JobFactory jf = JobFactory(result.jobFactory);
        assertEq(jf.treasury(), result.treasury, "Treasury mismatch");
        assertEq(jf.platformFeeBps(), 300, "Platform fee should be 3%");
        assertEq(jf.totalJobs(), 0, "Should have no jobs initially");

        console2.log("Deployment verified successfully");
    }

    function test_FullDeploymentAndSeeding() public {
        // Step 1: Deploy all contracts
        result = deployer.run();

        // Step 2: Run seeding
        seeder.run(
            result.jobFactory,
            result.applicationRegistry,
            result.reviewRegistry,
            result.profileRegistry
        );

        // Step 3: Verify seeded data
        _verifyProfiles();
        _verifyJobs();
        _verifyApplications();
        _verifyCompletedJob();

        console2.log("Full deployment and seeding verified successfully");
    }

    function _verifyProfiles() internal view {
        ProfileRegistry pr = ProfileRegistry(result.profileRegistry);

        assertEq(pr.totalProfiles(), 5, "Should have 5 profiles");
        assertTrue(pr.hasProfile(alice), "Alice should have profile");
        assertTrue(pr.hasProfile(bob), "Bob should have profile");
        assertTrue(pr.hasProfile(carol), "Carol should have profile");
        assertTrue(pr.hasProfile(dave), "Dave should have profile");
        assertTrue(pr.hasProfile(eve), "Eve should have profile");

        console2.log("Profiles verified: 5 profiles created");
    }

    function _verifyJobs() internal view {
        JobFactory jf = JobFactory(result.jobFactory);

        assertEq(jf.totalJobs(), 4, "Should have 4 jobs");

        // Job 0: Open
        IJobEscrow.Job memory job0 = jf.getJob(0);
        assertEq(job0.client, bob, "Job 0 client should be Bob");
        assertEq(uint8(job0.status), uint8(IJobEscrow.JobStatus.Open), "Job 0 should be Open");

        // Job 1: InProgress (assigned to Carol)
        IJobEscrow.Job memory job1 = jf.getJob(1);
        assertEq(job1.client, bob, "Job 1 client should be Bob");
        assertEq(job1.freelancer, carol, "Job 1 freelancer should be Carol");
        assertEq(uint8(job1.status), uint8(IJobEscrow.JobStatus.InProgress), "Job 1 should be InProgress");

        // Job 2: Open
        IJobEscrow.Job memory job2 = jf.getJob(2);
        assertEq(job2.client, eve, "Job 2 client should be Eve");
        assertEq(uint8(job2.status), uint8(IJobEscrow.JobStatus.Open), "Job 2 should be Open");

        // Job 3: Completed
        IJobEscrow.Job memory job3 = jf.getJob(3);
        assertEq(job3.client, eve, "Job 3 client should be Eve");
        assertEq(job3.freelancer, carol, "Job 3 freelancer should be Carol");
        assertEq(uint8(job3.status), uint8(IJobEscrow.JobStatus.Completed), "Job 3 should be Completed");

        console2.log("Jobs verified: 4 jobs with correct statuses");
    }

    function _verifyApplications() internal view {
        ApplicationRegistry ar = ApplicationRegistry(result.applicationRegistry);

        // Job 0 should have 2 applications (Carol and Dave)
        uint256[] memory job0Apps = ar.getJobApplications(0);
        assertEq(job0Apps.length, 2, "Job 0 should have 2 applications");

        // Carol's applications (Jobs 0, 1, 3)
        uint256[] memory carolApps = ar.getFreelancerApplications(carol);
        assertEq(carolApps.length, 3, "Carol should have 3 applications");

        // Dave's applications (Jobs 0, 2)
        uint256[] memory daveApps = ar.getFreelancerApplications(dave);
        assertEq(daveApps.length, 2, "Dave should have 2 applications");

        console2.log("Applications verified: correct application counts");
    }

    function _verifyCompletedJob() internal {
        JobFactory jf = JobFactory(result.jobFactory);
        ReviewRegistry rr = ReviewRegistry(result.reviewRegistry);

        // Verify Job 3 is completed
        IJobEscrow.Job memory job3 = jf.getJob(3);
        assertEq(uint8(job3.status), uint8(IJobEscrow.JobStatus.Completed), "Job 3 should be Completed");

        // Verify reviews
        assertTrue(rr.hasReviewed(3, eve), "Eve should have reviewed Job 3");
        assertTrue(rr.hasReviewed(3, carol), "Carol should have reviewed Job 3");

        // Verify Carol's rating (5 stars from Eve)
        uint256 carolRating = rr.getAverageRating(carol);
        assertEq(carolRating, 500, "Carol should have 5.0 rating (500)");

        // Verify Eve's rating (4 stars from Carol)
        uint256 eveRating = rr.getAverageRating(eve);
        assertEq(eveRating, 400, "Eve should have 4.0 rating (400)");

        // Verify Carol received payment (budget minus 3% fee)
        IJobFactory.UserStats memory carolStats = jf.getUserStats(carol);
        uint256 expectedEarnings = (0.5 ether * 9700) / 10000; // 97% of budget
        assertEq(carolStats.totalEarned, expectedEarnings, "Carol should have earned payment");

        console2.log("Completed job verified: reviews and payments correct");
    }

    function test_JobLifecycle_FullFlow() public {
        // Deploy contracts
        result = deployer.run();
        JobFactory jf = JobFactory(result.jobFactory);
        ApplicationRegistry ar = ApplicationRegistry(result.applicationRegistry);
        ReviewRegistry rr = ReviewRegistry(result.reviewRegistry);

        // 1. Bob creates a job
        vm.prank(bob);
        uint256 jobId = jf.createJob{value: 1 ether}(block.timestamp + 30 days, "ipfs://test");
        assertEq(jf.totalJobs(), 1, "Should have 1 job");

        // 2. Carol applies
        vm.prank(carol);
        uint256 appId = ar.submitApplication(jobId, "ipfs://proposal");
        assertEq(ar.getJobApplicationCount(jobId), 1, "Should have 1 application");

        // 3. Bob accepts and assigns Carol
        vm.prank(bob);
        ar.acceptApplication(appId);
        vm.prank(bob);
        jf.assignFreelancer(jobId, carol);

        IJobEscrow.Job memory job = jf.getJob(jobId);
        assertEq(uint8(job.status), uint8(IJobEscrow.JobStatus.InProgress), "Should be InProgress");

        // 4. Carol delivers
        vm.prank(carol);
        jf.submitDeliverable(jobId, "ipfs://deliverable");
        job = jf.getJob(jobId);
        assertEq(uint8(job.status), uint8(IJobEscrow.JobStatus.Delivered), "Should be Delivered");

        // 5. Bob approves
        vm.prank(bob);
        jf.approveDelivery(jobId);
        job = jf.getJob(jobId);
        assertEq(uint8(job.status), uint8(IJobEscrow.JobStatus.Completed), "Should be Completed");

        // 6. Both parties review
        vm.prank(bob);
        rr.submitReview(jobId, 5, "ipfs://review1");
        vm.prank(carol);
        rr.submitReview(jobId, 4, "ipfs://review2");

        assertEq(rr.getAverageRating(carol), 500, "Carol should have 5.0 rating");
        assertEq(rr.getAverageRating(bob), 400, "Bob should have 4.0 rating");

        console2.log("Full job lifecycle test passed");
    }
}
