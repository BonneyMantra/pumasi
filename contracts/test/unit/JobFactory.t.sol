// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {BaseTest} from "../utils/BaseTest.sol";
import {JobFactory} from "../../src/JobFactory.sol";
import {IJobFactory} from "../../src/interfaces/IJobFactory.sol";
import {IJobEscrow} from "../../src/interfaces/IJobEscrow.sol";

/// @title JobFactoryTest
/// @notice Unit tests for the JobFactory contract
contract JobFactoryTest is BaseTest {
    JobFactory public factory;

    uint256 public constant JOB_BUDGET = 1 ether;
    uint256 public constant JOB_DEADLINE = 7 days;
    string public constant METADATA_URI = "ipfs://QmJobMetadata";
    string public constant DELIVERABLE_URI = "ipfs://QmDeliverable";

    function setUp() public override {
        super.setUp();
        vm.prank(DEPLOYER);
        factory = new JobFactory(TREASURY);
    }

    // ============ Constructor Tests ============

    function test_Constructor_SetsCorrectValues() public view {
        assertEq(factory.treasury(), TREASURY);
        assertEq(factory.platformFeeBps(), 300);
        assertEq(factory.minBudget(), 0.01 ether);
        assertFalse(factory.isPaused());
    }

    function test_Constructor_RevertsInvalidTreasury() public {
        vm.prank(DEPLOYER);
        vm.expectRevert(IJobFactory.InvalidTreasury.selector);
        new JobFactory(address(0));
    }

    // ============ Create Job Tests ============

    function test_CreateJob_Success() public {
        uint256 deadline = block.timestamp + JOB_DEADLINE;

        vm.prank(ALICE);
        uint256 jobId = factory.createJob{value: JOB_BUDGET}(deadline, METADATA_URI);

        IJobEscrow.Job memory job = factory.getJob(jobId);
        assertEq(job.client, ALICE);
        assertEq(job.budget, JOB_BUDGET);
        assertEq(factory.totalJobs(), 1);

        IJobFactory.UserStats memory stats = factory.getUserStats(ALICE);
        assertEq(stats.jobsPosted, 1);
    }

    function test_CreateJob_RevertWhenPaused() public {
        vm.prank(DEPLOYER);
        factory.pause();

        uint256 deadline = block.timestamp + JOB_DEADLINE;
        vm.prank(ALICE);
        vm.expectRevert(IJobFactory.ContractPaused.selector);
        factory.createJob{value: JOB_BUDGET}(deadline, METADATA_URI);
    }

    // ============ User Stats Tests ============

    function test_UserStats_UpdatesOnCompletion() public {
        (uint256 jobId,) = _createAndAssignJob();

        vm.prank(BOB);
        factory.submitDeliverable(jobId, DELIVERABLE_URI);

        vm.prank(ALICE);
        factory.approveDelivery(jobId);

        IJobFactory.UserStats memory aliceStats = factory.getUserStats(ALICE);
        assertEq(aliceStats.jobsPosted, 1);
        assertEq(aliceStats.jobsCompleted, 1);
        assertEq(aliceStats.totalSpent, JOB_BUDGET);

        IJobFactory.UserStats memory bobStats = factory.getUserStats(BOB);
        assertEq(bobStats.jobsCompleted, 1);
        uint256 expectedEarned = JOB_BUDGET - (JOB_BUDGET * 300 / 10000);
        assertEq(bobStats.totalEarned, expectedEarned);
    }

    function test_UserStats_UpdatesOnCancellation() public {
        uint256 deadline = block.timestamp + JOB_DEADLINE;

        vm.prank(ALICE);
        uint256 jobId = factory.createJob{value: JOB_BUDGET}(deadline, METADATA_URI);

        vm.prank(ALICE);
        factory.cancelJob(jobId);

        IJobFactory.UserStats memory stats = factory.getUserStats(ALICE);
        assertEq(stats.jobsPosted, 1);
        assertEq(stats.jobsCancelled, 1);
    }

    // ============ Admin Functions Tests ============

    function test_Pause_Success() public {
        vm.prank(DEPLOYER);
        factory.pause();

        assertTrue(factory.isPaused());
    }

    function test_Pause_RevertsNotOwner() public {
        vm.prank(ALICE);
        vm.expectRevert();
        factory.pause();
    }

    function test_Unpause_Success() public {
        vm.prank(DEPLOYER);
        factory.pause();

        vm.prank(DEPLOYER);
        factory.unpause();

        assertFalse(factory.isPaused());
    }

    function test_SetPlatformFee_Success() public {
        vm.prank(DEPLOYER);
        factory.setPlatformFee(500); // 5%

        assertEq(factory.platformFeeBps(), 500);
    }

    function test_SetPlatformFee_RevertsFeeTooHigh() public {
        vm.prank(DEPLOYER);
        vm.expectRevert(IJobFactory.FeeTooHigh.selector);
        factory.setPlatformFee(1100); // 11% > 10% max
    }

    function test_SetMinBudget_Success() public {
        vm.prank(DEPLOYER);
        factory.setMinBudget(0.1 ether);

        assertEq(factory.minBudget(), 0.1 ether);
    }

    function test_SetMinBudget_RevertsZero() public {
        vm.prank(DEPLOYER);
        vm.expectRevert(IJobFactory.MinBudgetTooLow.selector);
        factory.setMinBudget(0);
    }

    function test_SetTreasury_Success() public {
        address newTreasury = makeAddr("newTreasury");

        vm.prank(DEPLOYER);
        factory.setTreasury(newTreasury);

        assertEq(factory.treasury(), newTreasury);
    }

    function test_SetTreasury_RevertsZeroAddress() public {
        vm.prank(DEPLOYER);
        vm.expectRevert(IJobFactory.InvalidTreasury.selector);
        factory.setTreasury(address(0));
    }

    // ============ Fee Collection Tests ============

    function test_WithdrawFees_Success() public {
        // Complete a job to generate fees
        (uint256 jobId,) = _createAndAssignJob();

        vm.prank(BOB);
        factory.submitDeliverable(jobId, DELIVERABLE_URI);

        vm.prank(ALICE);
        factory.approveDelivery(jobId);

        uint256 expectedFee = (JOB_BUDGET * 300) / 10000;
        assertEq(factory.accumulatedFees(), expectedFee);

        uint256 treasuryBalanceBefore = TREASURY.balance;

        vm.prank(DEPLOYER);
        factory.withdrawFees();

        assertEq(factory.accumulatedFees(), 0);
        assertEq(TREASURY.balance, treasuryBalanceBefore + expectedFee);
    }

    // ============ Complete Flow Tests ============

    function test_CompleteWorkflow() public {
        // 1. Create job
        uint256 deadline = block.timestamp + JOB_DEADLINE;
        vm.prank(ALICE);
        uint256 jobId = factory.createJob{value: JOB_BUDGET}(deadline, METADATA_URI);

        // 2. Assign freelancer
        vm.prank(ALICE);
        factory.assignFreelancer(jobId, BOB);

        // 3. Submit deliverable
        vm.prank(BOB);
        factory.submitDeliverable(jobId, DELIVERABLE_URI);

        // 4. Approve delivery
        uint256 bobBalanceBefore = BOB.balance;
        vm.prank(ALICE);
        factory.approveDelivery(jobId);

        // Verify
        IJobEscrow.Job memory job = factory.getJob(jobId);
        assertEq(uint256(job.status), uint256(IJobEscrow.JobStatus.Completed));

        uint256 expectedPayout = JOB_BUDGET - (JOB_BUDGET * 300 / 10000);
        assertEq(BOB.balance, bobBalanceBefore + expectedPayout);
    }

    function test_RevisionFlow() public {
        // Create and assign
        (uint256 jobId,) = _createAndAssignJob();

        // Submit
        vm.prank(BOB);
        factory.submitDeliverable(jobId, DELIVERABLE_URI);

        // Request revision
        vm.prank(ALICE);
        factory.requestRevision(jobId, "Please add more detail");

        IJobEscrow.Job memory job = factory.getJob(jobId);
        assertEq(uint256(job.status), uint256(IJobEscrow.JobStatus.InProgress));

        // Resubmit
        vm.prank(BOB);
        factory.submitDeliverable(jobId, "ipfs://QmRevisedDeliverable");

        // Approve
        vm.prank(ALICE);
        factory.approveDelivery(jobId);

        job = factory.getJob(jobId);
        assertEq(uint256(job.status), uint256(IJobEscrow.JobStatus.Completed));
    }

    function test_DisputeFlow() public {
        (uint256 jobId,) = _createAndAssignJob();

        vm.prank(BOB);
        factory.submitDeliverable(jobId, DELIVERABLE_URI);

        // Client raises dispute
        vm.prank(ALICE);
        factory.raiseDispute(jobId);

        IJobEscrow.Job memory job = factory.getJob(jobId);
        assertEq(uint256(job.status), uint256(IJobEscrow.JobStatus.Disputed));
    }

    function test_TimeoutFlow_OpenJob() public {
        uint256 deadline = block.timestamp + JOB_DEADLINE;
        uint256 aliceBalanceBefore = ALICE.balance;

        vm.prank(ALICE);
        uint256 jobId = factory.createJob{value: JOB_BUDGET}(deadline, METADATA_URI);

        skip(31 days);

        factory.handleTimeout(jobId);

        IJobEscrow.Job memory job = factory.getJob(jobId);
        assertEq(uint256(job.status), uint256(IJobEscrow.JobStatus.Cancelled));
        assertEq(ALICE.balance, aliceBalanceBefore);
    }

    function test_TimeoutFlow_DeliveredJob() public {
        (uint256 jobId,) = _createAndAssignJob();

        vm.prank(BOB);
        factory.submitDeliverable(jobId, DELIVERABLE_URI);

        uint256 bobBalanceBefore = BOB.balance;

        skip(8 days);

        factory.handleTimeout(jobId);

        IJobEscrow.Job memory job = factory.getJob(jobId);
        assertEq(uint256(job.status), uint256(IJobEscrow.JobStatus.Completed));

        uint256 expectedPayout = JOB_BUDGET - (JOB_BUDGET * 300 / 10000);
        assertEq(BOB.balance, bobBalanceBefore + expectedPayout);
    }

    // ============ View Functions Tests ============

    function test_GetClientJobs() public {
        uint256 deadline = block.timestamp + JOB_DEADLINE;

        vm.startPrank(ALICE);
        factory.createJob{value: JOB_BUDGET}(deadline, METADATA_URI);
        factory.createJob{value: JOB_BUDGET}(deadline, METADATA_URI);
        vm.stopPrank();

        uint256[] memory jobs = factory.getClientJobs(ALICE);
        assertEq(jobs.length, 2);
    }

    function test_GetFreelancerJobs() public {
        uint256 deadline = block.timestamp + JOB_DEADLINE;

        vm.prank(ALICE);
        uint256 jobId1 = factory.createJob{value: JOB_BUDGET}(deadline, METADATA_URI);
        vm.prank(ALICE);
        factory.assignFreelancer(jobId1, BOB);

        vm.prank(CHARLIE);
        uint256 jobId2 = factory.createJob{value: JOB_BUDGET}(deadline, METADATA_URI);
        vm.prank(CHARLIE);
        factory.assignFreelancer(jobId2, BOB);

        uint256[] memory jobs = factory.getFreelancerJobs(BOB);
        assertEq(jobs.length, 2);
    }

    // ============ Helpers ============

    function _createAndAssignJob() internal returns (uint256 jobId, uint256 deadline) {
        deadline = block.timestamp + JOB_DEADLINE;

        vm.prank(ALICE);
        jobId = factory.createJob{value: JOB_BUDGET}(deadline, METADATA_URI);

        vm.prank(ALICE);
        factory.assignFreelancer(jobId, BOB);
    }
}
