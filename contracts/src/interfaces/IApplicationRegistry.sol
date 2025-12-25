// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title IApplicationRegistry
/// @notice Interface for managing job applications
/// @dev Tracks applications from freelancers to jobs
interface IApplicationRegistry {
    // ============ Enums ============

    /// @notice Status of an application
    enum ApplicationStatus {
        Pending,     // Application submitted, awaiting review
        Accepted,    // Client accepted the application
        Rejected,    // Client rejected the application
        Withdrawn    // Freelancer withdrew the application
    }

    // ============ Structs ============

    /// @notice Represents a job application
    struct Application {
        uint256 applicationId;
        uint256 jobId;
        address freelancer;
        ApplicationStatus status;
        string proposalURI;   // IPFS: cover letter, timeline, portfolio
        uint256 createdAt;
        uint256 updatedAt;
    }

    // ============ Events ============

    /// @notice Emitted when an application is submitted
    event ApplicationSubmitted(
        uint256 indexed applicationId,
        uint256 indexed jobId,
        address indexed freelancer,
        string proposalURI,
        uint256 timestamp
    );

    /// @notice Emitted when an application is accepted
    event ApplicationAccepted(
        uint256 indexed applicationId,
        uint256 indexed jobId,
        address indexed freelancer,
        uint256 timestamp
    );

    /// @notice Emitted when an application is rejected
    event ApplicationRejected(
        uint256 indexed applicationId,
        uint256 indexed jobId,
        address indexed freelancer,
        uint256 timestamp
    );

    /// @notice Emitted when an application is withdrawn
    event ApplicationWithdrawn(
        uint256 indexed applicationId,
        uint256 indexed jobId,
        address indexed freelancer,
        uint256 timestamp
    );

    // ============ Errors ============

    /// @notice Thrown when application doesn't exist
    error ApplicationNotFound();

    /// @notice Thrown when caller is not the client
    error NotClient();

    /// @notice Thrown when caller is not the freelancer
    error NotFreelancer();

    /// @notice Thrown when application is not in expected status
    error InvalidApplicationStatus();

    /// @notice Thrown when job doesn't exist or is invalid
    error InvalidJob();

    /// @notice Thrown when freelancer already applied to the job
    error AlreadyApplied();

    /// @notice Thrown when freelancer tries to apply to own job
    error CannotApplyToOwnJob();

    /// @notice Thrown when job is not accepting applications
    error JobNotOpen();

    // ============ Functions ============

    /// @notice Submit an application to a job
    /// @param jobId The job ID to apply for
    /// @param proposalURI IPFS URI containing proposal details
    /// @return applicationId The ID of the created application
    function submitApplication(
        uint256 jobId,
        string calldata proposalURI
    ) external returns (uint256 applicationId);

    /// @notice Accept an application (client only)
    /// @param applicationId The application ID
    function acceptApplication(uint256 applicationId) external;

    /// @notice Reject an application (client only)
    /// @param applicationId The application ID
    function rejectApplication(uint256 applicationId) external;

    /// @notice Withdraw an application (freelancer only)
    /// @param applicationId The application ID
    function withdrawApplication(uint256 applicationId) external;

    /// @notice Get application details
    /// @param applicationId The application ID
    /// @return Application struct
    function getApplication(uint256 applicationId) external view returns (Application memory);

    /// @notice Get all applications for a job
    /// @param jobId The job ID
    /// @return Array of application IDs
    function getJobApplications(uint256 jobId) external view returns (uint256[] memory);

    /// @notice Get all applications by a freelancer
    /// @param freelancer The freelancer address
    /// @return Array of application IDs
    function getFreelancerApplications(address freelancer) external view returns (uint256[] memory);

    /// @notice Check if freelancer has applied to a job
    /// @param jobId The job ID
    /// @param freelancer The freelancer address
    /// @return True if already applied
    function hasApplied(uint256 jobId, address freelancer) external view returns (bool);
}
