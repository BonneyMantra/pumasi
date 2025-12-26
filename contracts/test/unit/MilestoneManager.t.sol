// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {BaseTest} from "../utils/BaseTest.sol";
import {MilestoneManager} from "../../src/MilestoneManager.sol";
import {JobFactory} from "../../src/JobFactory.sol";
import {IMilestoneManager} from "../../src/interfaces/IMilestoneManager.sol";
import {IJobEscrow} from "../../src/interfaces/IJobEscrow.sol";

/// @title MilestoneManagerTest
/// @notice Unit tests for the MilestoneManager contract
contract MilestoneManagerTest is BaseTest {
    MilestoneManager public milestoneManager;
    JobFactory public jobFactory;

    uint256 public constant JOB_BUDGET = 1 ether;
    uint256 public constant JOB_DEADLINE = 30 days;
    string public constant METADATA_URI = "ipfs://QmJobMetadata";
    string public constant MILESTONE_URI = "ipfs://QmMilestone";
    string public constant DELIVERABLE_URI = "ipfs://QmDeliverable";

    function setUp() public override {
        super.setUp();

        vm.startPrank(DEPLOYER);
        jobFactory = new JobFactory(TREASURY);
        milestoneManager = new MilestoneManager(address(jobFactory), TREASURY);
        vm.stopPrank();

        // Fund milestone manager for payouts
        vm.deal(address(milestoneManager), 100 ether);
    }

    // ============ Create Milestones Tests ============

    function test_CreateMilestones_Success() public {
        uint256 jobId = _createJob();

        uint256[] memory amounts = new uint256[](3);
        amounts[0] = 0.3 ether;
        amounts[1] = 0.3 ether;
        amounts[2] = 0.4 ether;

        uint256[] memory deadlines = new uint256[](3);
        deadlines[0] = block.timestamp + 7 days;
        deadlines[1] = block.timestamp + 14 days;
        deadlines[2] = block.timestamp + 21 days;

        string[] memory uris = new string[](3);
        uris[0] = "ipfs://milestone1";
        uris[1] = "ipfs://milestone2";
        uris[2] = "ipfs://milestone3";

        vm.prank(ALICE);
        uint256[] memory milestoneIds = milestoneManager.createMilestones(jobId, amounts, deadlines, uris);

        assertEq(milestoneIds.length, 3);
        assertTrue(milestoneManager.hasMilestones(jobId));

        IMilestoneManager.Milestone memory m = milestoneManager.getMilestone(milestoneIds[0]);
        assertEq(m.jobId, jobId);
        assertEq(m.amount, 0.3 ether);
        assertEq(uint256(m.status), uint256(IMilestoneManager.MilestoneStatus.Pending));
    }

    function test_CreateMilestones_RevertsNotClient() public {
        uint256 jobId = _createJob();

        uint256[] memory amounts = new uint256[](1);
        amounts[0] = JOB_BUDGET;

        uint256[] memory deadlines = new uint256[](1);
        deadlines[0] = block.timestamp + 7 days;

        string[] memory uris = new string[](1);
        uris[0] = MILESTONE_URI;

        vm.prank(BOB);
        vm.expectRevert(IMilestoneManager.NotClient.selector);
        milestoneManager.createMilestones(jobId, amounts, deadlines, uris);
    }

    function test_CreateMilestones_RevertsInvalidAmounts() public {
        uint256 jobId = _createJob();

        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 0.3 ether;
        amounts[1] = 0.3 ether; // Total 0.6 ether, but budget is 1 ether

        uint256[] memory deadlines = new uint256[](2);
        deadlines[0] = block.timestamp + 7 days;
        deadlines[1] = block.timestamp + 14 days;

        string[] memory uris = new string[](2);
        uris[0] = "uri1";
        uris[1] = "uri2";

        vm.prank(ALICE);
        vm.expectRevert(IMilestoneManager.InvalidMilestoneAmounts.selector);
        milestoneManager.createMilestones(jobId, amounts, deadlines, uris);
    }

    function test_CreateMilestones_RevertsMilestonesAlreadyExist() public {
        uint256 jobId = _createJob();
        _createSingleMilestone(jobId);

        uint256[] memory amounts = new uint256[](1);
        amounts[0] = JOB_BUDGET;

        uint256[] memory deadlines = new uint256[](1);
        deadlines[0] = block.timestamp + 7 days;

        string[] memory uris = new string[](1);
        uris[0] = MILESTONE_URI;

        vm.prank(ALICE);
        vm.expectRevert(IMilestoneManager.MilestonesAlreadyExist.selector);
        milestoneManager.createMilestones(jobId, amounts, deadlines, uris);
    }

    // ============ Start Milestone Tests ============

    function test_StartMilestone_Success() public {
        uint256 jobId = _createJob();
        uint256[] memory ids = _createSingleMilestone(jobId);
        _assignFreelancer(jobId);

        vm.prank(BOB);
        milestoneManager.startMilestone(ids[0]);

        IMilestoneManager.Milestone memory m = milestoneManager.getMilestone(ids[0]);
        assertEq(uint256(m.status), uint256(IMilestoneManager.MilestoneStatus.InProgress));
    }

    function test_StartMilestone_RevertsNotFreelancer() public {
        uint256 jobId = _createJob();
        uint256[] memory ids = _createSingleMilestone(jobId);
        _assignFreelancer(jobId);

        vm.prank(CHARLIE);
        vm.expectRevert(IMilestoneManager.NotFreelancer.selector);
        milestoneManager.startMilestone(ids[0]);
    }

    // ============ Deliver Milestone Tests ============

    function test_DeliverMilestone_Success() public {
        uint256 jobId = _createJob();
        uint256[] memory ids = _createSingleMilestone(jobId);
        _assignFreelancer(jobId);

        vm.prank(BOB);
        milestoneManager.startMilestone(ids[0]);

        vm.prank(BOB);
        milestoneManager.deliverMilestone(ids[0], DELIVERABLE_URI);

        IMilestoneManager.Milestone memory m = milestoneManager.getMilestone(ids[0]);
        assertEq(uint256(m.status), uint256(IMilestoneManager.MilestoneStatus.Delivered));
        assertEq(m.deliverableURI, DELIVERABLE_URI);
    }

    function test_DeliverMilestone_RevertsNotInProgress() public {
        uint256 jobId = _createJob();
        uint256[] memory ids = _createSingleMilestone(jobId);
        _assignFreelancer(jobId);

        vm.prank(BOB);
        vm.expectRevert(IMilestoneManager.InvalidMilestoneStatus.selector);
        milestoneManager.deliverMilestone(ids[0], DELIVERABLE_URI);
    }

    // ============ Approve Milestone Tests ============

    function test_ApproveMilestone_Success() public {
        uint256 jobId = _createJob();
        uint256[] memory ids = _createSingleMilestone(jobId);
        _assignFreelancer(jobId);

        vm.prank(BOB);
        milestoneManager.startMilestone(ids[0]);

        vm.prank(BOB);
        milestoneManager.deliverMilestone(ids[0], DELIVERABLE_URI);

        uint256 bobBalBefore = BOB.balance;
        uint256 expectedPayout = JOB_BUDGET - (JOB_BUDGET * 300 / 10000);

        vm.prank(ALICE);
        milestoneManager.approveMilestone(ids[0]);

        IMilestoneManager.Milestone memory m = milestoneManager.getMilestone(ids[0]);
        assertEq(uint256(m.status), uint256(IMilestoneManager.MilestoneStatus.Approved));
        assertEq(BOB.balance, bobBalBefore + expectedPayout);
    }

    function test_ApproveMilestone_RevertsNotClient() public {
        uint256 jobId = _createJob();
        uint256[] memory ids = _createSingleMilestone(jobId);
        _assignFreelancer(jobId);

        vm.prank(BOB);
        milestoneManager.startMilestone(ids[0]);

        vm.prank(BOB);
        milestoneManager.deliverMilestone(ids[0], DELIVERABLE_URI);

        vm.prank(BOB);
        vm.expectRevert(IMilestoneManager.NotClient.selector);
        milestoneManager.approveMilestone(ids[0]);
    }

    // ============ Dispute Milestone Tests ============

    function test_DisputeMilestone_Success() public {
        uint256 jobId = _createJob();
        uint256[] memory ids = _createSingleMilestone(jobId);
        _assignFreelancer(jobId);

        vm.prank(BOB);
        milestoneManager.startMilestone(ids[0]);

        vm.prank(ALICE);
        milestoneManager.disputeMilestone(ids[0]);

        IMilestoneManager.Milestone memory m = milestoneManager.getMilestone(ids[0]);
        assertEq(uint256(m.status), uint256(IMilestoneManager.MilestoneStatus.Disputed));
    }

    // ============ Happy Path Test ============

    function test_CompleteMultipleMilestones() public {
        uint256 jobId = _createJob();

        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 0.5 ether;
        amounts[1] = 0.5 ether;

        uint256[] memory deadlines = new uint256[](2);
        deadlines[0] = block.timestamp + 7 days;
        deadlines[1] = block.timestamp + 14 days;

        string[] memory uris = new string[](2);
        uris[0] = "milestone1";
        uris[1] = "milestone2";

        vm.prank(ALICE);
        uint256[] memory ids = milestoneManager.createMilestones(jobId, amounts, deadlines, uris);

        _assignFreelancer(jobId);

        // Complete first milestone
        vm.prank(BOB);
        milestoneManager.startMilestone(ids[0]);
        vm.prank(BOB);
        milestoneManager.deliverMilestone(ids[0], "del1");
        vm.prank(ALICE);
        milestoneManager.approveMilestone(ids[0]);

        // Complete second milestone
        vm.prank(BOB);
        milestoneManager.startMilestone(ids[1]);
        vm.prank(BOB);
        milestoneManager.deliverMilestone(ids[1], "del2");
        vm.prank(ALICE);
        milestoneManager.approveMilestone(ids[1]);

        // Verify both completed
        assertEq(uint256(milestoneManager.getMilestone(ids[0]).status), uint256(IMilestoneManager.MilestoneStatus.Approved));
        assertEq(uint256(milestoneManager.getMilestone(ids[1]).status), uint256(IMilestoneManager.MilestoneStatus.Approved));
    }

    // ============ Helpers ============

    function _createJob() internal returns (uint256) {
        vm.prank(ALICE);
        return jobFactory.createJob{value: JOB_BUDGET}(block.timestamp + JOB_DEADLINE, METADATA_URI);
    }

    function _createSingleMilestone(uint256 jobId) internal returns (uint256[] memory) {
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = JOB_BUDGET;

        uint256[] memory deadlines = new uint256[](1);
        deadlines[0] = block.timestamp + 7 days;

        string[] memory uris = new string[](1);
        uris[0] = MILESTONE_URI;

        vm.prank(ALICE);
        return milestoneManager.createMilestones(jobId, amounts, deadlines, uris);
    }

    function _assignFreelancer(uint256 jobId) internal {
        vm.prank(ALICE);
        jobFactory.assignFreelancer(jobId, BOB);
    }
}
