// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ReentrancyGuard} from "@openzeppelin/utils/ReentrancyGuard.sol";
import {IArbitrationDAO} from "./interfaces/IArbitrationDAO.sol";
import {IJobEscrow} from "./interfaces/IJobEscrow.sol";

/// @title ArbitrationDAO
/// @notice Manages dispute resolution with staked arbitrators
/// @dev Uses simple first-3-to-respond arbitrator selection for MVP
contract ArbitrationDAO is IArbitrationDAO, ReentrancyGuard {
    // ============ Constants ============

    /// @notice Minimum arbitrator stake (1000 VERY equivalent = 1 ether for MVP)
    uint256 public constant MIN_STAKE = 1 ether;

    /// @notice Arbitration fee (5% = 500 basis points)
    uint256 public constant ARBITRATION_FEE_BPS = 500;

    /// @notice Basis points denominator
    uint256 public constant BASIS_POINTS = 10000;

    /// @notice Evidence submission period (24 hours)
    uint256 public constant EVIDENCE_PERIOD = 1 days;

    /// @notice Voting period (48 hours)
    uint256 public constant VOTING_PERIOD = 2 days;

    /// @notice Required votes for resolution
    uint256 public constant REQUIRED_VOTES = 3;

    // ============ Storage ============

    /// @notice Next dispute ID
    uint256 private _nextDisputeId;

    /// @notice Job escrow contract reference
    IJobEscrow public jobEscrow;

    /// @notice Treasury for fees
    address public treasury;

    /// @notice Mapping of dispute ID to dispute data
    mapping(uint256 => Dispute) private _disputes;

    /// @notice Mapping of dispute ID to votes
    mapping(uint256 => Vote[]) private _disputeVotes;

    /// @notice Mapping of arbitrator address to info
    mapping(address => Arbitrator) private _arbitrators;

    /// @notice Mapping of (disputeId, arbitrator) => hasVoted
    mapping(uint256 => mapping(address => bool)) private _hasVoted;

    /// @notice Mapping of jobId to disputeId
    mapping(uint256 => uint256) public jobToDispute;

    /// @notice Active arbitrator count
    uint256 public activeArbitratorCount;

    // ============ Constructor ============

    constructor(address _jobEscrow, address _treasury) {
        jobEscrow = IJobEscrow(_jobEscrow);
        treasury = _treasury;
        _nextDisputeId = 1; // Start at 1
    }

    // ============ Arbitrator Functions ============

    /// @inheritdoc IArbitrationDAO
    function registerArbitrator() external payable nonReentrant {
        if (msg.value < MIN_STAKE) revert StakeTooLow();

        Arbitrator storage arb = _arbitrators[msg.sender];
        if (arb.active) {
            // Add to existing stake
            arb.stakeAmount += msg.value;
        } else {
            _arbitrators[msg.sender] = Arbitrator({
                addr: msg.sender,
                stakeAmount: msg.value,
                joinedAt: block.timestamp,
                casesHandled: 0,
                active: true
            });
            activeArbitratorCount++;
        }

        emit ArbitratorRegistered(msg.sender, msg.value);
    }

    /// @inheritdoc IArbitrationDAO
    function withdrawStake() external nonReentrant {
        Arbitrator storage arb = _arbitrators[msg.sender];
        if (!arb.active) revert NotArbitrator();

        uint256 amount = arb.stakeAmount;
        arb.stakeAmount = 0;
        arb.active = false;
        activeArbitratorCount--;

        (bool success,) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");

        emit ArbitratorWithdrawn(msg.sender, amount);
    }

    // ============ Dispute Functions ============

    /// @inheritdoc IArbitrationDAO
    function raiseDispute(uint256 jobId) external nonReentrant returns (uint256 disputeId) {
        IJobEscrow.Job memory job = jobEscrow.getJob(jobId);

        // Verify caller is party to the job
        bool isClient = job.client == msg.sender;
        bool isFreelancer = job.freelancer == msg.sender;
        if (!isClient && !isFreelancer) revert NotDisputeParty();

        // Verify job is in disputable state (should already be Disputed)
        if (job.status != IJobEscrow.JobStatus.Disputed) revert InvalidPhase();

        // Check dispute doesn't already exist
        if (jobToDispute[jobId] != 0) revert InvalidPhase();

        disputeId = _nextDisputeId++;

        _disputes[disputeId] = Dispute({
            disputeId: disputeId,
            jobId: jobId,
            client: job.client,
            freelancer: job.freelancer,
            amount: job.budget,
            status: DisputeStatus.EvidencePhase,
            evidenceDeadline: block.timestamp + EVIDENCE_PERIOD,
            voteDeadline: 0,
            clientEvidenceURI: "",
            freelancerEvidenceURI: "",
            createdAt: block.timestamp
        });

        jobToDispute[jobId] = disputeId;

        emit DisputeRaised(disputeId, jobId, msg.sender, job.budget);
    }

    /// @inheritdoc IArbitrationDAO
    function submitEvidence(uint256 disputeId, string calldata evidenceURI) external {
        Dispute storage dispute = _disputes[disputeId];
        if (dispute.disputeId == 0) revert DisputeNotFound();
        if (dispute.status != DisputeStatus.EvidencePhase) revert InvalidPhase();
        if (block.timestamp > dispute.evidenceDeadline) revert DeadlinePassed();

        if (msg.sender == dispute.client) {
            dispute.clientEvidenceURI = evidenceURI;
        } else if (msg.sender == dispute.freelancer) {
            dispute.freelancerEvidenceURI = evidenceURI;
        } else {
            revert NotDisputeParty();
        }

        emit EvidenceSubmitted(disputeId, msg.sender, evidenceURI);
    }

    /// @notice Move dispute to voting phase (can be called by anyone after evidence deadline)
    /// @param disputeId The dispute ID
    function startVoting(uint256 disputeId) external {
        Dispute storage dispute = _disputes[disputeId];
        if (dispute.disputeId == 0) revert DisputeNotFound();
        if (dispute.status != DisputeStatus.EvidencePhase) revert InvalidPhase();
        if (block.timestamp < dispute.evidenceDeadline) revert DeadlineNotReached();

        dispute.status = DisputeStatus.VotingPhase;
        dispute.voteDeadline = block.timestamp + VOTING_PERIOD;
    }

    /// @inheritdoc IArbitrationDAO
    function castVote(
        uint256 disputeId,
        VoteDecision decision,
        string calldata rationaleURI
    ) external {
        Dispute storage dispute = _disputes[disputeId];
        if (dispute.disputeId == 0) revert DisputeNotFound();
        if (dispute.status != DisputeStatus.VotingPhase) revert InvalidPhase();
        if (block.timestamp > dispute.voteDeadline) revert DeadlinePassed();

        Arbitrator storage arb = _arbitrators[msg.sender];
        if (!arb.active) revert NotArbitrator();
        if (_hasVoted[disputeId][msg.sender]) revert AlreadyVoted();

        // Can't vote on own dispute
        if (msg.sender == dispute.client || msg.sender == dispute.freelancer) {
            revert CannotVoteOnOwnDispute();
        }

        _hasVoted[disputeId][msg.sender] = true;
        arb.casesHandled++;

        _disputeVotes[disputeId].push(Vote({
            arbitrator: msg.sender,
            decision: decision,
            rationaleURI: rationaleURI,
            timestamp: block.timestamp
        }));

        emit VoteCast(disputeId, msg.sender, decision);
    }

    /// @inheritdoc IArbitrationDAO
    function executeResolution(uint256 disputeId) external nonReentrant {
        Dispute storage dispute = _disputes[disputeId];
        if (dispute.disputeId == 0) revert DisputeNotFound();
        if (dispute.status != DisputeStatus.VotingPhase) revert InvalidPhase();

        Vote[] storage votes = _disputeVotes[disputeId];
        if (votes.length < REQUIRED_VOTES) revert NotEnoughArbitrators();

        // Tally votes
        uint256 clientVotes;
        uint256 freelancerVotes;
        uint256 splitVotes;

        for (uint256 i = 0; i < votes.length; i++) {
            if (votes[i].decision == VoteDecision.FullToClient) clientVotes++;
            else if (votes[i].decision == VoteDecision.FullToFreelancer) freelancerVotes++;
            else splitVotes++;
        }

        // Determine majority decision
        VoteDecision majorityDecision;
        if (clientVotes >= freelancerVotes && clientVotes >= splitVotes) {
            majorityDecision = VoteDecision.FullToClient;
        } else if (freelancerVotes >= clientVotes && freelancerVotes >= splitVotes) {
            majorityDecision = VoteDecision.FullToFreelancer;
        } else {
            majorityDecision = VoteDecision.Split;
        }

        dispute.status = DisputeStatus.Resolved;

        // Calculate amounts
        uint256 fee = (dispute.amount * ARBITRATION_FEE_BPS) / BASIS_POINTS;
        uint256 remaining = dispute.amount - fee;
        uint256 clientAmount;
        uint256 freelancerAmount;

        if (majorityDecision == VoteDecision.FullToClient) {
            clientAmount = remaining;
        } else if (majorityDecision == VoteDecision.FullToFreelancer) {
            freelancerAmount = remaining;
        } else {
            clientAmount = remaining / 2;
            freelancerAmount = remaining - clientAmount;
        }

        // Note: Actual fund transfers would happen via JobEscrow integration
        // For MVP, we emit the resolution for off-chain processing

        emit DisputeResolved(disputeId, majorityDecision, clientAmount, freelancerAmount);
    }

    // ============ View Functions ============

    /// @inheritdoc IArbitrationDAO
    function getDispute(uint256 disputeId) external view returns (Dispute memory) {
        return _disputes[disputeId];
    }

    /// @inheritdoc IArbitrationDAO
    function getVotes(uint256 disputeId) external view returns (Vote[] memory) {
        return _disputeVotes[disputeId];
    }

    /// @inheritdoc IArbitrationDAO
    function getArbitrator(address arbitrator) external view returns (Arbitrator memory) {
        return _arbitrators[arbitrator];
    }

    /// @inheritdoc IArbitrationDAO
    function minStake() external pure returns (uint256) {
        return MIN_STAKE;
    }

    /// @inheritdoc IArbitrationDAO
    function arbitrationFeeBps() external pure returns (uint256) {
        return ARBITRATION_FEE_BPS;
    }

    /// @notice Get next dispute ID
    function nextDisputeId() external view returns (uint256) {
        return _nextDisputeId;
    }

    /// @notice Check if arbitrator has voted on dispute
    function hasVoted(uint256 disputeId, address arbitrator) external view returns (bool) {
        return _hasVoted[disputeId][arbitrator];
    }
}
