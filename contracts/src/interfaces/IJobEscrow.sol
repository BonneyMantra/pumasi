// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title IJobEscrow
/// @notice Interface for the Pumasi Job Escrow contract
/// @dev Manages escrow-based job payments between clients and freelancers
interface IJobEscrow {
    // ============ Enums ============

    /// @notice Status of a job
    enum JobStatus {
        Open,           // Job posted, waiting for freelancer
        InProgress,     // Freelancer assigned, work ongoing
        Delivered,      // Freelancer submitted deliverable
        Completed,      // Client approved, funds released
        Disputed,       // In dispute resolution
        Cancelled       // Job cancelled
    }

    // ============ Structs ============

    /// @notice Represents a job posting
    struct Job {
        uint256 jobId;
        address client;
        address freelancer;
        uint256 budget;
        uint256 deadline;
        JobStatus status;
        string metadataURI;     // IPFS hash for title, description, category
        uint256 createdAt;
        uint256 deliveredAt;
        string deliverableURI;  // IPFS hash for submitted deliverable
    }

    // ============ Events ============

    /// @notice Emitted when a new job is created
    event JobCreated(
        uint256 indexed jobId,
        address indexed client,
        uint256 budget,
        uint256 deadline,
        string metadataURI
    );

    /// @notice Emitted when a freelancer is assigned to a job
    event FreelancerAssigned(
        uint256 indexed jobId,
        address indexed freelancer,
        uint256 timestamp
    );

    /// @notice Emitted when a deliverable is submitted
    event DeliverableSubmitted(
        uint256 indexed jobId,
        address indexed freelancer,
        string deliverableURI,
        uint256 timestamp
    );

    /// @notice Emitted when a job is approved and completed
    event JobApproved(
        uint256 indexed jobId,
        address indexed client,
        address indexed freelancer,
        uint256 timestamp
    );

    /// @notice Emitted when a job is disputed
    event JobDisputed(
        uint256 indexed jobId,
        address indexed disputedBy,
        uint256 timestamp
    );

    /// @notice Emitted when a job is cancelled
    event JobCancelled(
        uint256 indexed jobId,
        address indexed cancelledBy,
        uint256 timestamp
    );

    /// @notice Emitted when funds are released
    event FundsReleased(
        uint256 indexed jobId,
        address indexed recipient,
        uint256 amount,
        uint256 platformFee
    );

    /// @notice Emitted when a revision is requested
    event RevisionRequested(
        uint256 indexed jobId,
        address indexed client,
        string reason,
        uint256 timestamp
    );

    // ============ Errors ============

    /// @notice Thrown when job doesn't exist
    error JobNotFound();

    /// @notice Thrown when caller is not the client
    error NotClient();

    /// @notice Thrown when caller is not the freelancer
    error NotFreelancer();

    /// @notice Thrown when job is not in expected status
    error InvalidJobStatus();

    /// @notice Thrown when budget is too low
    error BudgetTooLow();

    /// @notice Thrown when deadline is in the past
    error InvalidDeadline();

    /// @notice Thrown when freelancer tries to apply to own job
    error CannotApplyToOwnJob();

    /// @notice Thrown when job already has a freelancer
    error FreelancerAlreadyAssigned();

    /// @notice Thrown when deadline has passed
    error DeadlinePassed();

    /// @notice Thrown when transfer fails
    error TransferFailed();

    /// @notice Thrown when job has timed out
    error JobTimedOut();

    // ============ Functions ============

    /// @notice Create a new job with escrow deposit
    /// @param deadline The deadline timestamp for the job
    /// @param metadataURI IPFS URI containing job details
    /// @return jobId The ID of the created job
    function createJob(uint256 deadline, string calldata metadataURI) external payable returns (uint256 jobId);

    /// @notice Assign a freelancer to an open job
    /// @param jobId The job ID
    /// @param freelancer The freelancer address to assign
    function assignFreelancer(uint256 jobId, address freelancer) external;

    /// @notice Submit a deliverable for a job
    /// @param jobId The job ID
    /// @param deliverableURI IPFS URI containing deliverable
    function submitDeliverable(uint256 jobId, string calldata deliverableURI) external;

    /// @notice Approve delivery and release funds to freelancer
    /// @param jobId The job ID
    function approveDelivery(uint256 jobId) external;

    /// @notice Request a revision on submitted deliverable
    /// @param jobId The job ID
    /// @param reason Reason for revision request
    function requestRevision(uint256 jobId, string calldata reason) external;

    /// @notice Raise a dispute on a job
    /// @param jobId The job ID
    function raiseDispute(uint256 jobId) external;

    /// @notice Cancel a job (before freelancer assignment)
    /// @param jobId The job ID
    function cancelJob(uint256 jobId) external;

    /// @notice Handle job timeout (release funds appropriately)
    /// @param jobId The job ID
    function handleTimeout(uint256 jobId) external;

    /// @notice Get job details
    /// @param jobId The job ID
    /// @return Job struct
    function getJob(uint256 jobId) external view returns (Job memory);

    /// @notice Get minimal job info for validation (gas-efficient)
    /// @param jobId The job ID
    /// @return client The job client address
    /// @return status The job status
    function getJobForValidation(uint256 jobId) external view returns (address client, JobStatus status);

    /// @notice Get all jobs for a client
    /// @param client The client address
    /// @return Array of job IDs
    function getClientJobs(address client) external view returns (uint256[] memory);

    /// @notice Get all jobs for a freelancer
    /// @param freelancer The freelancer address
    /// @return Array of job IDs
    function getFreelancerJobs(address freelancer) external view returns (uint256[] memory);

    /// @notice Get the minimum budget for a job
    /// @return Minimum budget in wei
    function minBudget() external view returns (uint256);

    /// @notice Get the platform fee percentage
    /// @return Fee in basis points (e.g., 300 = 3%)
    function platformFeeBps() external view returns (uint256);
}
