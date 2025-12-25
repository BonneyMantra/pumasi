// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title IMilestoneManager
/// @notice Interface for milestone-based payment management
/// @dev Works with JobEscrow to enable partial fund releases per milestone
interface IMilestoneManager {
    // ============ Enums ============

    /// @notice Status of a milestone
    enum MilestoneStatus {
        Pending,      // Not started
        InProgress,   // Work ongoing
        Delivered,    // Freelancer submitted deliverable
        Approved,     // Client approved, funds released
        Disputed      // In dispute
    }

    // ============ Structs ============

    /// @notice Represents a milestone within a job
    struct Milestone {
        uint256 milestoneId;
        uint256 jobId;
        uint256 amount;
        uint256 deadline;
        MilestoneStatus status;
        string metadataURI;      // IPFS: description, acceptance criteria
        string deliverableURI;   // IPFS: submitted deliverable
        uint256 createdAt;
        uint256 deliveredAt;
    }

    // ============ Events ============

    /// @notice Emitted when a milestone is created
    event MilestoneCreated(
        uint256 indexed milestoneId,
        uint256 indexed jobId,
        uint256 amount,
        uint256 deadline,
        string metadataURI
    );

    /// @notice Emitted when milestone work starts
    event MilestoneStarted(
        uint256 indexed milestoneId,
        uint256 indexed jobId,
        uint256 timestamp
    );

    /// @notice Emitted when milestone deliverable is submitted
    event MilestoneDelivered(
        uint256 indexed milestoneId,
        uint256 indexed jobId,
        string deliverableURI,
        uint256 timestamp
    );

    /// @notice Emitted when milestone is approved and funds released
    event MilestoneApproved(
        uint256 indexed milestoneId,
        uint256 indexed jobId,
        uint256 amount,
        uint256 timestamp
    );

    /// @notice Emitted when milestone is disputed
    event MilestoneDisputed(
        uint256 indexed milestoneId,
        uint256 indexed jobId,
        address indexed disputedBy,
        uint256 timestamp
    );

    // ============ Errors ============

    /// @notice Thrown when milestone doesn't exist
    error MilestoneNotFound();

    /// @notice Thrown when caller is not the client
    error NotClient();

    /// @notice Thrown when caller is not the freelancer
    error NotFreelancer();

    /// @notice Thrown when milestone is not in expected status
    error InvalidMilestoneStatus();

    /// @notice Thrown when amounts don't match job budget
    error InvalidMilestoneAmounts();

    /// @notice Thrown when deadline is invalid
    error InvalidDeadline();

    /// @notice Thrown when job doesn't exist or is invalid
    error InvalidJob();

    /// @notice Thrown when milestones already exist for job
    error MilestonesAlreadyExist();

    /// @notice Thrown when no milestones provided
    error NoMilestonesProvided();

    /// @notice Thrown when transfer fails
    error TransferFailed();

    // ============ Functions ============

    /// @notice Create milestones for a job
    /// @param jobId The job ID
    /// @param amounts Array of amounts for each milestone
    /// @param deadlines Array of deadlines for each milestone
    /// @param metadataURIs Array of IPFS URIs for milestone details
    /// @return milestoneIds Array of created milestone IDs
    function createMilestones(
        uint256 jobId,
        uint256[] calldata amounts,
        uint256[] calldata deadlines,
        string[] calldata metadataURIs
    ) external returns (uint256[] memory milestoneIds);

    /// @notice Start work on a milestone
    /// @param milestoneId The milestone ID
    function startMilestone(uint256 milestoneId) external;

    /// @notice Submit deliverable for a milestone
    /// @param milestoneId The milestone ID
    /// @param deliverableURI IPFS URI of the deliverable
    function deliverMilestone(uint256 milestoneId, string calldata deliverableURI) external;

    /// @notice Approve milestone and release funds
    /// @param milestoneId The milestone ID
    function approveMilestone(uint256 milestoneId) external;

    /// @notice Raise dispute on a milestone
    /// @param milestoneId The milestone ID
    function disputeMilestone(uint256 milestoneId) external;

    /// @notice Get milestone details
    /// @param milestoneId The milestone ID
    /// @return Milestone struct
    function getMilestone(uint256 milestoneId) external view returns (Milestone memory);

    /// @notice Get all milestones for a job
    /// @param jobId The job ID
    /// @return Array of milestone IDs
    function getJobMilestones(uint256 jobId) external view returns (uint256[] memory);

    /// @notice Check if job has milestones
    /// @param jobId The job ID
    /// @return True if job has milestones
    function hasMilestones(uint256 jobId) external view returns (bool);
}
