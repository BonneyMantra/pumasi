// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title IArbitrationDAO
/// @notice Interface for the Pumasi Arbitration DAO contract
/// @dev Manages dispute resolution with staked arbitrators
interface IArbitrationDAO {
    // ============ Enums ============

    /// @notice Status of a dispute
    enum DisputeStatus {
        EvidencePhase,    // Both parties submitting evidence
        VotingPhase,      // Arbitrators voting
        Resolved,         // Decision executed
        Cancelled         // Dispute cancelled
    }

    /// @notice Vote decision options
    enum VoteDecision {
        FullToClient,      // 100% to client
        FullToFreelancer,  // 100% to freelancer
        Split              // 50/50 split
    }

    // ============ Structs ============

    /// @notice Represents a dispute
    struct Dispute {
        uint256 disputeId;
        uint256 jobId;
        address client;
        address freelancer;
        uint256 amount;             // Disputed amount
        DisputeStatus status;
        uint256 evidenceDeadline;
        uint256 voteDeadline;
        string clientEvidenceURI;
        string freelancerEvidenceURI;
        uint256 createdAt;
    }

    /// @notice Represents an arbitrator vote
    struct Vote {
        address arbitrator;
        VoteDecision decision;
        string rationaleURI;
        uint256 timestamp;
    }

    /// @notice Arbitrator info
    struct Arbitrator {
        address addr;
        uint256 stakeAmount;
        uint256 joinedAt;
        uint256 casesHandled;
        bool active;
    }

    // ============ Events ============

    /// @notice Emitted when a dispute is raised
    event DisputeRaised(
        uint256 indexed disputeId,
        uint256 indexed jobId,
        address indexed raisedBy,
        uint256 amount
    );

    /// @notice Emitted when evidence is submitted
    event EvidenceSubmitted(
        uint256 indexed disputeId,
        address indexed submitter,
        string evidenceURI
    );

    /// @notice Emitted when an arbitrator casts a vote
    event VoteCast(
        uint256 indexed disputeId,
        address indexed arbitrator,
        VoteDecision decision
    );

    /// @notice Emitted when a dispute is resolved
    event DisputeResolved(
        uint256 indexed disputeId,
        VoteDecision decision,
        uint256 clientAmount,
        uint256 freelancerAmount
    );

    /// @notice Emitted when an arbitrator registers
    event ArbitratorRegistered(address indexed arbitrator, uint256 stakeAmount);

    /// @notice Emitted when an arbitrator withdraws
    event ArbitratorWithdrawn(address indexed arbitrator, uint256 amount);

    // ============ Errors ============

    /// @notice Thrown when stake is too low
    error StakeTooLow();

    /// @notice Thrown when not an active arbitrator
    error NotArbitrator();

    /// @notice Thrown when dispute not found
    error DisputeNotFound();

    /// @notice Thrown when not a party to the dispute
    error NotDisputeParty();

    /// @notice Thrown when deadline has passed
    error DeadlinePassed();

    /// @notice Thrown when deadline not reached
    error DeadlineNotReached();

    /// @notice Thrown when already voted
    error AlreadyVoted();

    /// @notice Thrown when dispute not in expected phase
    error InvalidPhase();

    /// @notice Thrown when not enough arbitrators
    error NotEnoughArbitrators();

    /// @notice Thrown when arbitrator cannot vote on own dispute
    error CannotVoteOnOwnDispute();

    // ============ Functions ============

    /// @notice Register as an arbitrator with stake
    function registerArbitrator() external payable;

    /// @notice Withdraw arbitrator stake
    function withdrawStake() external;

    /// @notice Raise a dispute on a job
    /// @param jobId The job ID to dispute
    /// @return disputeId The created dispute ID
    function raiseDispute(uint256 jobId) external returns (uint256 disputeId);

    /// @notice Submit evidence for a dispute
    /// @param disputeId The dispute ID
    /// @param evidenceURI IPFS URI of evidence
    function submitEvidence(uint256 disputeId, string calldata evidenceURI) external;

    /// @notice Cast a vote as an arbitrator
    /// @param disputeId The dispute ID
    /// @param decision The vote decision
    /// @param rationaleURI IPFS URI of rationale
    function castVote(
        uint256 disputeId,
        VoteDecision decision,
        string calldata rationaleURI
    ) external;

    /// @notice Execute the dispute resolution
    /// @param disputeId The dispute ID
    function executeResolution(uint256 disputeId) external;

    /// @notice Get dispute details
    /// @param disputeId The dispute ID
    /// @return Dispute struct
    function getDispute(uint256 disputeId) external view returns (Dispute memory);

    /// @notice Get votes for a dispute
    /// @param disputeId The dispute ID
    /// @return Array of votes
    function getVotes(uint256 disputeId) external view returns (Vote[] memory);

    /// @notice Get arbitrator info
    /// @param arbitrator The arbitrator address
    /// @return Arbitrator struct
    function getArbitrator(address arbitrator) external view returns (Arbitrator memory);

    /// @notice Get minimum stake requirement
    /// @return Minimum stake in wei
    function minStake() external view returns (uint256);

    /// @notice Get arbitration fee percentage
    /// @return Fee in basis points
    function arbitrationFeeBps() external view returns (uint256);
}
