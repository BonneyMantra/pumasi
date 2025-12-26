// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {BaseTest} from "../utils/BaseTest.sol";
import {ArbitrationDAO} from "../../src/ArbitrationDAO.sol";
import {IArbitrationDAO} from "../../src/interfaces/IArbitrationDAO.sol";
import {JobEscrow} from "../../src/JobEscrow.sol";
import {IJobEscrow} from "../../src/interfaces/IJobEscrow.sol";

/// @title ArbitrationDAOTest
/// @notice Unit tests for the ArbitrationDAO contract
contract ArbitrationDAOTest is BaseTest {
    ArbitrationDAO public dao;
    JobEscrow public escrow;

    address public ARB1;
    address public ARB2;
    address public ARB3;

    uint256 public constant JOB_BUDGET = 1 ether;
    uint256 public constant JOB_DEADLINE = 7 days;
    uint256 public constant STAKE_AMOUNT = 1 ether;
    string public constant METADATA_URI = "ipfs://QmJobMetadata";
    string public constant DELIVERABLE_URI = "ipfs://QmDeliverable";
    string public constant EVIDENCE_URI = "ipfs://QmEvidence";
    string public constant RATIONALE_URI = "ipfs://QmRationale";

    function setUp() public override {
        super.setUp();

        ARB1 = createUser("Arbitrator1");
        ARB2 = createUser("Arbitrator2");
        ARB3 = createUser("Arbitrator3");

        vm.startPrank(DEPLOYER);
        escrow = new JobEscrow(TREASURY);
        dao = new ArbitrationDAO(address(escrow), TREASURY);
        vm.stopPrank();
    }

    // ============ Arbitrator Registration Tests ============

    function test_RegisterArbitrator_Success() public {
        vm.prank(ARB1);
        dao.registerArbitrator{value: STAKE_AMOUNT}();

        IArbitrationDAO.Arbitrator memory arb = dao.getArbitrator(ARB1);
        assertEq(arb.addr, ARB1);
        assertEq(arb.stakeAmount, STAKE_AMOUNT);
        assertTrue(arb.active);
        assertEq(dao.activeArbitratorCount(), 1);
    }

    function test_RegisterArbitrator_AddToExistingStake() public {
        vm.prank(ARB1);
        dao.registerArbitrator{value: STAKE_AMOUNT}();

        vm.prank(ARB1);
        dao.registerArbitrator{value: STAKE_AMOUNT}();

        IArbitrationDAO.Arbitrator memory arb = dao.getArbitrator(ARB1);
        assertEq(arb.stakeAmount, 2 * STAKE_AMOUNT);
        assertEq(dao.activeArbitratorCount(), 1); // Still just 1
    }

    function test_RegisterArbitrator_RevertsStakeTooLow() public {
        vm.prank(ARB1);
        vm.expectRevert(IArbitrationDAO.StakeTooLow.selector);
        dao.registerArbitrator{value: 0.5 ether}();
    }

    // ============ Withdraw Stake Tests ============

    function test_WithdrawStake_Success() public {
        vm.prank(ARB1);
        dao.registerArbitrator{value: STAKE_AMOUNT}();

        uint256 balanceBefore = ARB1.balance;

        vm.prank(ARB1);
        dao.withdrawStake();

        assertEq(ARB1.balance, balanceBefore + STAKE_AMOUNT);
        assertEq(dao.activeArbitratorCount(), 0);

        IArbitrationDAO.Arbitrator memory arb = dao.getArbitrator(ARB1);
        assertFalse(arb.active);
    }

    function test_WithdrawStake_RevertsNotArbitrator() public {
        vm.prank(ARB1);
        vm.expectRevert(IArbitrationDAO.NotArbitrator.selector);
        dao.withdrawStake();
    }

    // ============ Raise Dispute Tests ============

    function test_RaiseDispute_Success() public {
        uint256 jobId = _createDisputedJob();

        vm.prank(ALICE);
        uint256 disputeId = dao.raiseDispute(jobId);

        IArbitrationDAO.Dispute memory dispute = dao.getDispute(disputeId);
        assertEq(dispute.disputeId, 1);
        assertEq(dispute.jobId, jobId);
        assertEq(dispute.client, ALICE);
        assertEq(dispute.freelancer, BOB);
        assertEq(dispute.amount, JOB_BUDGET);
        assertEq(uint256(dispute.status), uint256(IArbitrationDAO.DisputeStatus.EvidencePhase));
    }

    function test_RaiseDispute_RevertsNotDisputeParty() public {
        uint256 jobId = _createDisputedJob();

        vm.prank(CHARLIE);
        vm.expectRevert(IArbitrationDAO.NotDisputeParty.selector);
        dao.raiseDispute(jobId);
    }

    function test_RaiseDispute_RevertsInvalidPhase() public {
        // Create job that's not disputed yet
        uint256 deadline = block.timestamp + JOB_DEADLINE;
        vm.prank(ALICE);
        uint256 jobId = escrow.createJob{value: JOB_BUDGET}(deadline, METADATA_URI);

        vm.prank(ALICE);
        vm.expectRevert(IArbitrationDAO.InvalidPhase.selector);
        dao.raiseDispute(jobId);
    }

    // ============ Submit Evidence Tests ============

    function test_SubmitEvidence_ClientSubmits() public {
        uint256 disputeId = _createFullDispute();

        vm.prank(ALICE);
        dao.submitEvidence(disputeId, EVIDENCE_URI);

        IArbitrationDAO.Dispute memory dispute = dao.getDispute(disputeId);
        assertEq(dispute.clientEvidenceURI, EVIDENCE_URI);
    }

    function test_SubmitEvidence_FreelancerSubmits() public {
        uint256 disputeId = _createFullDispute();

        vm.prank(BOB);
        dao.submitEvidence(disputeId, EVIDENCE_URI);

        IArbitrationDAO.Dispute memory dispute = dao.getDispute(disputeId);
        assertEq(dispute.freelancerEvidenceURI, EVIDENCE_URI);
    }

    function test_SubmitEvidence_RevertsNotDisputeParty() public {
        uint256 disputeId = _createFullDispute();

        vm.prank(CHARLIE);
        vm.expectRevert(IArbitrationDAO.NotDisputeParty.selector);
        dao.submitEvidence(disputeId, EVIDENCE_URI);
    }

    function test_SubmitEvidence_RevertsDeadlinePassed() public {
        uint256 disputeId = _createFullDispute();

        skip(2 days); // Past evidence deadline

        vm.prank(ALICE);
        vm.expectRevert(IArbitrationDAO.DeadlinePassed.selector);
        dao.submitEvidence(disputeId, EVIDENCE_URI);
    }

    // ============ Start Voting Tests ============

    function test_StartVoting_Success() public {
        uint256 disputeId = _createFullDispute();

        skip(1 days + 1); // Past evidence deadline

        dao.startVoting(disputeId);

        IArbitrationDAO.Dispute memory dispute = dao.getDispute(disputeId);
        assertEq(uint256(dispute.status), uint256(IArbitrationDAO.DisputeStatus.VotingPhase));
    }

    function test_StartVoting_RevertsDeadlineNotReached() public {
        uint256 disputeId = _createFullDispute();

        vm.expectRevert(IArbitrationDAO.DeadlineNotReached.selector);
        dao.startVoting(disputeId);
    }

    // ============ Cast Vote Tests ============

    function test_CastVote_Success() public {
        uint256 disputeId = _createDisputeInVotingPhase();
        _registerArbitrators();

        vm.prank(ARB1);
        dao.castVote(disputeId, IArbitrationDAO.VoteDecision.FullToFreelancer, RATIONALE_URI);

        IArbitrationDAO.Vote[] memory votes = dao.getVotes(disputeId);
        assertEq(votes.length, 1);
        assertEq(votes[0].arbitrator, ARB1);
        assertEq(uint256(votes[0].decision), uint256(IArbitrationDAO.VoteDecision.FullToFreelancer));
    }

    function test_CastVote_RevertsNotArbitrator() public {
        uint256 disputeId = _createDisputeInVotingPhase();

        vm.prank(CHARLIE);
        vm.expectRevert(IArbitrationDAO.NotArbitrator.selector);
        dao.castVote(disputeId, IArbitrationDAO.VoteDecision.Split, RATIONALE_URI);
    }

    function test_CastVote_RevertsAlreadyVoted() public {
        uint256 disputeId = _createDisputeInVotingPhase();
        _registerArbitrators();

        vm.prank(ARB1);
        dao.castVote(disputeId, IArbitrationDAO.VoteDecision.FullToClient, RATIONALE_URI);

        vm.prank(ARB1);
        vm.expectRevert(IArbitrationDAO.AlreadyVoted.selector);
        dao.castVote(disputeId, IArbitrationDAO.VoteDecision.Split, RATIONALE_URI);
    }

    function test_CastVote_RevertsCannotVoteOnOwnDispute() public {
        uint256 disputeId = _createDisputeInVotingPhase();

        vm.prank(ALICE);
        dao.registerArbitrator{value: STAKE_AMOUNT}();

        vm.prank(ALICE);
        vm.expectRevert(IArbitrationDAO.CannotVoteOnOwnDispute.selector);
        dao.castVote(disputeId, IArbitrationDAO.VoteDecision.FullToClient, RATIONALE_URI);
    }

    // ============ Execute Resolution Tests ============

    function test_ExecuteResolution_MajorityToFreelancer() public {
        uint256 disputeId = _createDisputeInVotingPhase();
        _registerArbitrators();

        vm.prank(ARB1);
        dao.castVote(disputeId, IArbitrationDAO.VoteDecision.FullToFreelancer, RATIONALE_URI);
        vm.prank(ARB2);
        dao.castVote(disputeId, IArbitrationDAO.VoteDecision.FullToFreelancer, RATIONALE_URI);
        vm.prank(ARB3);
        dao.castVote(disputeId, IArbitrationDAO.VoteDecision.FullToClient, RATIONALE_URI);

        dao.executeResolution(disputeId);

        IArbitrationDAO.Dispute memory dispute = dao.getDispute(disputeId);
        assertEq(uint256(dispute.status), uint256(IArbitrationDAO.DisputeStatus.Resolved));
    }

    function test_ExecuteResolution_RevertsNotEnoughArbitrators() public {
        uint256 disputeId = _createDisputeInVotingPhase();
        _registerArbitrators();

        vm.prank(ARB1);
        dao.castVote(disputeId, IArbitrationDAO.VoteDecision.FullToClient, RATIONALE_URI);

        vm.expectRevert(IArbitrationDAO.NotEnoughArbitrators.selector);
        dao.executeResolution(disputeId);
    }

    // ============ View Functions Tests ============

    function test_MinStake() public view {
        assertEq(dao.minStake(), 1 ether);
    }

    function test_ArbitrationFeeBps() public view {
        assertEq(dao.arbitrationFeeBps(), 500); // 5%
    }

    // ============ Helpers ============

    function _registerArbitrators() internal {
        vm.prank(ARB1);
        dao.registerArbitrator{value: STAKE_AMOUNT}();
        vm.prank(ARB2);
        dao.registerArbitrator{value: STAKE_AMOUNT}();
        vm.prank(ARB3);
        dao.registerArbitrator{value: STAKE_AMOUNT}();
    }

    function _createDisputedJob() internal returns (uint256 jobId) {
        uint256 deadline = block.timestamp + JOB_DEADLINE;

        vm.prank(ALICE);
        jobId = escrow.createJob{value: JOB_BUDGET}(deadline, METADATA_URI);

        vm.prank(ALICE);
        escrow.assignFreelancer(jobId, BOB);

        vm.prank(ALICE);
        escrow.raiseDispute(jobId);
    }

    function _createFullDispute() internal returns (uint256 disputeId) {
        uint256 jobId = _createDisputedJob();

        vm.prank(ALICE);
        disputeId = dao.raiseDispute(jobId);
    }

    function _createDisputeInVotingPhase() internal returns (uint256 disputeId) {
        disputeId = _createFullDispute();
        skip(1 days + 1);
        dao.startVoting(disputeId);
    }
}
