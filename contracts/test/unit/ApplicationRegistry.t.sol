// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {BaseTest} from "../utils/BaseTest.sol";
import {ApplicationRegistry} from "../../src/ApplicationRegistry.sol";
import {JobFactory} from "../../src/JobFactory.sol";
import {IApplicationRegistry} from "../../src/interfaces/IApplicationRegistry.sol";
import {IJobEscrow} from "../../src/interfaces/IJobEscrow.sol";

/// @title ApplicationRegistryTest
/// @notice Unit tests for the ApplicationRegistry contract
contract ApplicationRegistryTest is BaseTest {
    ApplicationRegistry public registry;
    JobFactory public jobFactory;

    uint256 public constant JOB_BUDGET = 1 ether;
    uint256 public constant JOB_DEADLINE = 30 days;
    string public constant METADATA_URI = "ipfs://QmJobMetadata";
    string public constant PROPOSAL_URI = "ipfs://QmProposal";

    function setUp() public override {
        super.setUp();

        vm.startPrank(DEPLOYER);
        jobFactory = new JobFactory(TREASURY);
        registry = new ApplicationRegistry(address(jobFactory));
        vm.stopPrank();
    }

    // ============ Submit Application Tests ============

    function test_SubmitApplication_Success() public {
        uint256 jobId = _createJob();

        vm.prank(BOB);
        uint256 appId = registry.submitApplication(jobId, PROPOSAL_URI);

        IApplicationRegistry.Application memory app = registry.getApplication(appId);
        assertEq(app.applicationId, 0);
        assertEq(app.jobId, jobId);
        assertEq(app.freelancer, BOB);
        assertEq(uint256(app.status), uint256(IApplicationRegistry.ApplicationStatus.Pending));
        assertEq(app.proposalURI, PROPOSAL_URI);

        assertTrue(registry.hasApplied(jobId, BOB));
    }

    function test_SubmitApplication_RevertsCannotApplyToOwnJob() public {
        uint256 jobId = _createJob();

        vm.prank(ALICE);
        vm.expectRevert(IApplicationRegistry.CannotApplyToOwnJob.selector);
        registry.submitApplication(jobId, PROPOSAL_URI);
    }

    function test_SubmitApplication_RevertsAlreadyApplied() public {
        uint256 jobId = _createJob();

        vm.prank(BOB);
        registry.submitApplication(jobId, PROPOSAL_URI);

        vm.prank(BOB);
        vm.expectRevert(IApplicationRegistry.AlreadyApplied.selector);
        registry.submitApplication(jobId, "another proposal");
    }

    function test_SubmitApplication_RevertsJobNotOpen() public {
        uint256 jobId = _createJob();

        // Cancel the job
        vm.prank(ALICE);
        jobFactory.cancelJob(jobId);

        vm.prank(BOB);
        vm.expectRevert(IApplicationRegistry.JobNotOpen.selector);
        registry.submitApplication(jobId, PROPOSAL_URI);
    }

    // ============ Accept Application Tests ============

    function test_AcceptApplication_Success() public {
        uint256 jobId = _createJob();

        vm.prank(BOB);
        uint256 appId = registry.submitApplication(jobId, PROPOSAL_URI);

        vm.prank(ALICE);
        registry.acceptApplication(appId);

        IApplicationRegistry.Application memory app = registry.getApplication(appId);
        assertEq(uint256(app.status), uint256(IApplicationRegistry.ApplicationStatus.Accepted));
    }

    function test_AcceptApplication_RejectsOthers() public {
        uint256 jobId = _createJob();

        vm.prank(BOB);
        uint256 bobAppId = registry.submitApplication(jobId, "bob proposal");

        vm.prank(CHARLIE);
        uint256 charlieAppId = registry.submitApplication(jobId, "charlie proposal");

        vm.prank(ALICE);
        registry.acceptApplication(bobAppId);

        // Bob accepted, Charlie rejected
        IApplicationRegistry.Application memory bobApp = registry.getApplication(bobAppId);
        IApplicationRegistry.Application memory charlieApp = registry.getApplication(charlieAppId);

        assertEq(uint256(bobApp.status), uint256(IApplicationRegistry.ApplicationStatus.Accepted));
        assertEq(uint256(charlieApp.status), uint256(IApplicationRegistry.ApplicationStatus.Rejected));
    }

    function test_AcceptApplication_RevertsNotClient() public {
        uint256 jobId = _createJob();

        vm.prank(BOB);
        uint256 appId = registry.submitApplication(jobId, PROPOSAL_URI);

        vm.prank(BOB);
        vm.expectRevert(IApplicationRegistry.NotClient.selector);
        registry.acceptApplication(appId);
    }

    function test_AcceptApplication_RevertsInvalidStatus() public {
        uint256 jobId = _createJob();

        vm.prank(BOB);
        uint256 appId = registry.submitApplication(jobId, PROPOSAL_URI);

        // Withdraw first
        vm.prank(BOB);
        registry.withdrawApplication(appId);

        vm.prank(ALICE);
        vm.expectRevert(IApplicationRegistry.InvalidApplicationStatus.selector);
        registry.acceptApplication(appId);
    }

    // ============ Reject Application Tests ============

    function test_RejectApplication_Success() public {
        uint256 jobId = _createJob();

        vm.prank(BOB);
        uint256 appId = registry.submitApplication(jobId, PROPOSAL_URI);

        vm.prank(ALICE);
        registry.rejectApplication(appId);

        IApplicationRegistry.Application memory app = registry.getApplication(appId);
        assertEq(uint256(app.status), uint256(IApplicationRegistry.ApplicationStatus.Rejected));
    }

    function test_RejectApplication_RevertsNotClient() public {
        uint256 jobId = _createJob();

        vm.prank(BOB);
        uint256 appId = registry.submitApplication(jobId, PROPOSAL_URI);

        vm.prank(CHARLIE);
        vm.expectRevert(IApplicationRegistry.NotClient.selector);
        registry.rejectApplication(appId);
    }

    // ============ Withdraw Application Tests ============

    function test_WithdrawApplication_Success() public {
        uint256 jobId = _createJob();

        vm.prank(BOB);
        uint256 appId = registry.submitApplication(jobId, PROPOSAL_URI);

        vm.prank(BOB);
        registry.withdrawApplication(appId);

        IApplicationRegistry.Application memory app = registry.getApplication(appId);
        assertEq(uint256(app.status), uint256(IApplicationRegistry.ApplicationStatus.Withdrawn));
    }

    function test_WithdrawApplication_RevertsNotFreelancer() public {
        uint256 jobId = _createJob();

        vm.prank(BOB);
        uint256 appId = registry.submitApplication(jobId, PROPOSAL_URI);

        vm.prank(CHARLIE);
        vm.expectRevert(IApplicationRegistry.NotFreelancer.selector);
        registry.withdrawApplication(appId);
    }

    function test_WithdrawApplication_RevertsIfAlreadyAccepted() public {
        uint256 jobId = _createJob();

        vm.prank(BOB);
        uint256 appId = registry.submitApplication(jobId, PROPOSAL_URI);

        vm.prank(ALICE);
        registry.acceptApplication(appId);

        vm.prank(BOB);
        vm.expectRevert(IApplicationRegistry.InvalidApplicationStatus.selector);
        registry.withdrawApplication(appId);
    }

    // ============ View Functions Tests ============

    function test_GetJobApplications() public {
        uint256 jobId = _createJob();

        vm.prank(BOB);
        registry.submitApplication(jobId, "proposal1");

        vm.prank(CHARLIE);
        registry.submitApplication(jobId, "proposal2");

        uint256[] memory apps = registry.getJobApplications(jobId);
        assertEq(apps.length, 2);
    }

    function test_GetFreelancerApplications() public {
        uint256 jobId1 = _createJob();

        vm.prank(ALICE);
        uint256 jobId2 = jobFactory.createJob{value: JOB_BUDGET}(block.timestamp + JOB_DEADLINE, "job2");

        vm.prank(BOB);
        registry.submitApplication(jobId1, "proposal1");

        vm.prank(BOB);
        registry.submitApplication(jobId2, "proposal2");

        uint256[] memory apps = registry.getFreelancerApplications(BOB);
        assertEq(apps.length, 2);
    }

    // ============ Happy Path Test ============

    function test_CompleteApplicationFlow() public {
        // 1. Alice creates job
        uint256 jobId = _createJob();

        // 2. Bob and Charlie apply
        vm.prank(BOB);
        uint256 bobAppId = registry.submitApplication(jobId, "Bob's proposal");

        vm.prank(CHARLIE);
        uint256 charlieAppId = registry.submitApplication(jobId, "Charlie's proposal");

        // 3. Alice reviews and accepts Bob
        vm.prank(ALICE);
        registry.acceptApplication(bobAppId);

        // 4. Verify states
        IApplicationRegistry.Application memory bobApp = registry.getApplication(bobAppId);
        IApplicationRegistry.Application memory charlieApp = registry.getApplication(charlieAppId);

        assertEq(uint256(bobApp.status), uint256(IApplicationRegistry.ApplicationStatus.Accepted));
        assertEq(uint256(charlieApp.status), uint256(IApplicationRegistry.ApplicationStatus.Rejected));

        // 5. Verify counts
        assertEq(registry.getJobApplicationCount(jobId), 2);
        assertEq(registry.getFreelancerApplicationCount(BOB), 1);
        assertEq(registry.getFreelancerApplicationCount(CHARLIE), 1);
    }

    // ============ Helpers ============

    function _createJob() internal returns (uint256) {
        vm.prank(ALICE);
        return jobFactory.createJob{value: JOB_BUDGET}(block.timestamp + JOB_DEADLINE, METADATA_URI);
    }
}
