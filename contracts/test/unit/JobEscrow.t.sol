// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {BaseTest} from "../utils/BaseTest.sol";
import {JobEscrow} from "../../src/JobEscrow.sol";
import {IJobEscrow} from "../../src/interfaces/IJobEscrow.sol";

/// @title JobEscrowTest
/// @notice Unit tests for the JobEscrow contract
contract JobEscrowTest is BaseTest {
    JobEscrow public escrow;

    uint256 public constant JOB_BUDGET = 1 ether;
    uint256 public constant JOB_DEADLINE = 7 days;
    string public constant METADATA_URI = "ipfs://QmJobMetadata";
    string public constant DELIVERABLE_URI = "ipfs://QmDeliverable";

    function setUp() public override {
        super.setUp();
        vm.prank(DEPLOYER);
        escrow = new JobEscrow(TREASURY);
    }

    // ============ Create Job Tests ============

    function test_CreateJob_Success() public {
        uint256 deadline = block.timestamp + JOB_DEADLINE;

        vm.prank(ALICE);
        uint256 jobId = escrow.createJob{value: JOB_BUDGET}(deadline, METADATA_URI);

        IJobEscrow.Job memory job = escrow.getJob(jobId);
        assertEq(job.jobId, 0);
        assertEq(job.client, ALICE);
        assertEq(job.freelancer, address(0));
        assertEq(job.budget, JOB_BUDGET);
        assertEq(job.deadline, deadline);
        assertEq(uint256(job.status), uint256(IJobEscrow.JobStatus.Open));
        assertEq(job.metadataURI, METADATA_URI);
    }

    function test_CreateJob_RevertsBudgetTooLow() public {
        uint256 deadline = block.timestamp + JOB_DEADLINE;

        vm.prank(ALICE);
        vm.expectRevert(IJobEscrow.BudgetTooLow.selector);
        escrow.createJob{value: 0.001 ether}(deadline, METADATA_URI);
    }

    function test_CreateJob_RevertsInvalidDeadline() public {
        vm.prank(ALICE);
        vm.expectRevert(IJobEscrow.InvalidDeadline.selector);
        escrow.createJob{value: JOB_BUDGET}(block.timestamp - 1, METADATA_URI);
    }

    // ============ Assign Freelancer Tests ============

    function test_AssignFreelancer_Success() public {
        uint256 deadline = block.timestamp + JOB_DEADLINE;

        vm.prank(ALICE);
        uint256 jobId = escrow.createJob{value: JOB_BUDGET}(deadline, METADATA_URI);

        vm.prank(ALICE);
        escrow.assignFreelancer(jobId, BOB);

        IJobEscrow.Job memory job = escrow.getJob(jobId);
        assertEq(job.freelancer, BOB);
        assertEq(uint256(job.status), uint256(IJobEscrow.JobStatus.InProgress));
    }

    function test_AssignFreelancer_RevertsNotClient() public {
        uint256 deadline = block.timestamp + JOB_DEADLINE;

        vm.prank(ALICE);
        uint256 jobId = escrow.createJob{value: JOB_BUDGET}(deadline, METADATA_URI);

        vm.prank(BOB);
        vm.expectRevert(IJobEscrow.NotClient.selector);
        escrow.assignFreelancer(jobId, CHARLIE);
    }

    function test_AssignFreelancer_RevertsCannotApplyToOwnJob() public {
        uint256 deadline = block.timestamp + JOB_DEADLINE;

        vm.prank(ALICE);
        uint256 jobId = escrow.createJob{value: JOB_BUDGET}(deadline, METADATA_URI);

        vm.prank(ALICE);
        vm.expectRevert(IJobEscrow.CannotApplyToOwnJob.selector);
        escrow.assignFreelancer(jobId, ALICE);
    }

    // ============ Submit Deliverable Tests ============

    function test_SubmitDeliverable_Success() public {
        (uint256 jobId,) = _createAndAssignJob();

        vm.prank(BOB);
        escrow.submitDeliverable(jobId, DELIVERABLE_URI);

        IJobEscrow.Job memory job = escrow.getJob(jobId);
        assertEq(uint256(job.status), uint256(IJobEscrow.JobStatus.Delivered));
        assertEq(job.deliverableURI, DELIVERABLE_URI);
    }

    function test_SubmitDeliverable_RevertsNotFreelancer() public {
        (uint256 jobId,) = _createAndAssignJob();

        vm.prank(ALICE);
        vm.expectRevert(IJobEscrow.NotFreelancer.selector);
        escrow.submitDeliverable(jobId, DELIVERABLE_URI);
    }

    // ============ Approve Delivery Tests ============

    function test_ApproveDelivery_Success() public {
        (uint256 jobId,) = _createAndAssignJob();

        vm.prank(BOB);
        escrow.submitDeliverable(jobId, DELIVERABLE_URI);

        uint256 bobBalanceBefore = BOB.balance;
        uint256 expectedPayout = JOB_BUDGET - (JOB_BUDGET * 300 / 10000); // 3% fee

        vm.prank(ALICE);
        escrow.approveDelivery(jobId);

        IJobEscrow.Job memory job = escrow.getJob(jobId);
        assertEq(uint256(job.status), uint256(IJobEscrow.JobStatus.Completed));
        assertEq(BOB.balance, bobBalanceBefore + expectedPayout);
    }

    function test_ApproveDelivery_RevertsNotClient() public {
        (uint256 jobId,) = _createAndAssignJob();

        vm.prank(BOB);
        escrow.submitDeliverable(jobId, DELIVERABLE_URI);

        vm.prank(BOB);
        vm.expectRevert(IJobEscrow.NotClient.selector);
        escrow.approveDelivery(jobId);
    }

    // ============ Request Revision Tests ============

    function test_RequestRevision_Success() public {
        (uint256 jobId,) = _createAndAssignJob();

        vm.prank(BOB);
        escrow.submitDeliverable(jobId, DELIVERABLE_URI);

        vm.prank(ALICE);
        escrow.requestRevision(jobId, "Needs more detail");

        IJobEscrow.Job memory job = escrow.getJob(jobId);
        assertEq(uint256(job.status), uint256(IJobEscrow.JobStatus.InProgress));
    }

    // ============ Cancel Job Tests ============

    function test_CancelJob_Success() public {
        uint256 deadline = block.timestamp + JOB_DEADLINE;
        uint256 aliceBalanceBefore = ALICE.balance;

        vm.prank(ALICE);
        uint256 jobId = escrow.createJob{value: JOB_BUDGET}(deadline, METADATA_URI);

        vm.prank(ALICE);
        escrow.cancelJob(jobId);

        IJobEscrow.Job memory job = escrow.getJob(jobId);
        assertEq(uint256(job.status), uint256(IJobEscrow.JobStatus.Cancelled));
        assertEq(ALICE.balance, aliceBalanceBefore); // Full refund
    }

    function test_CancelJob_RevertsAfterAssignment() public {
        (uint256 jobId,) = _createAndAssignJob();

        vm.prank(ALICE);
        vm.expectRevert(IJobEscrow.InvalidJobStatus.selector);
        escrow.cancelJob(jobId);
    }

    // ============ Raise Dispute Tests ============

    function test_RaiseDispute_Success() public {
        (uint256 jobId,) = _createAndAssignJob();

        vm.prank(ALICE);
        escrow.raiseDispute(jobId);

        IJobEscrow.Job memory job = escrow.getJob(jobId);
        assertEq(uint256(job.status), uint256(IJobEscrow.JobStatus.Disputed));
    }

    // ============ Timeout Tests ============

    function test_HandleTimeout_OpenJob() public {
        uint256 deadline = block.timestamp + JOB_DEADLINE;
        uint256 aliceBalanceBefore = ALICE.balance;

        vm.prank(ALICE);
        uint256 jobId = escrow.createJob{value: JOB_BUDGET}(deadline, METADATA_URI);

        // Fast forward past timeout
        skip(31 days);

        escrow.handleTimeout(jobId);

        IJobEscrow.Job memory job = escrow.getJob(jobId);
        assertEq(uint256(job.status), uint256(IJobEscrow.JobStatus.Cancelled));
        assertEq(ALICE.balance, aliceBalanceBefore);
    }

    function test_HandleTimeout_DeliveredJob() public {
        (uint256 jobId,) = _createAndAssignJob();

        vm.prank(BOB);
        escrow.submitDeliverable(jobId, DELIVERABLE_URI);

        uint256 bobBalanceBefore = BOB.balance;
        uint256 expectedPayout = JOB_BUDGET - (JOB_BUDGET * 300 / 10000);

        // Fast forward past delivery timeout
        skip(8 days);

        escrow.handleTimeout(jobId);

        IJobEscrow.Job memory job = escrow.getJob(jobId);
        assertEq(uint256(job.status), uint256(IJobEscrow.JobStatus.Completed));
        assertEq(BOB.balance, bobBalanceBefore + expectedPayout);
    }

    // ============ Happy Path Test ============

    function test_CompleteHappyPath() public {
        // 1. Alice creates a job
        uint256 deadline = block.timestamp + JOB_DEADLINE;
        vm.prank(ALICE);
        uint256 jobId = escrow.createJob{value: JOB_BUDGET}(deadline, METADATA_URI);

        // 2. Alice assigns Bob as freelancer
        vm.prank(ALICE);
        escrow.assignFreelancer(jobId, BOB);

        // 3. Bob submits deliverable
        vm.prank(BOB);
        escrow.submitDeliverable(jobId, DELIVERABLE_URI);

        // 4. Alice approves
        uint256 bobBalanceBefore = BOB.balance;
        vm.prank(ALICE);
        escrow.approveDelivery(jobId);

        // Verify final state
        IJobEscrow.Job memory job = escrow.getJob(jobId);
        assertEq(uint256(job.status), uint256(IJobEscrow.JobStatus.Completed));

        uint256 expectedPayout = JOB_BUDGET - (JOB_BUDGET * 300 / 10000);
        assertEq(BOB.balance, bobBalanceBefore + expectedPayout);
    }

    // ============ Helpers ============

    function _createAndAssignJob() internal returns (uint256 jobId, uint256 deadline) {
        deadline = block.timestamp + JOB_DEADLINE;

        vm.prank(ALICE);
        jobId = escrow.createJob{value: JOB_BUDGET}(deadline, METADATA_URI);

        vm.prank(ALICE);
        escrow.assignFreelancer(jobId, BOB);
    }
}
