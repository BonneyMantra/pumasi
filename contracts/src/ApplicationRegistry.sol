// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ReentrancyGuard} from "@openzeppelin/utils/ReentrancyGuard.sol";
import {IApplicationRegistry} from "./interfaces/IApplicationRegistry.sol";
import {IJobEscrow} from "./interfaces/IJobEscrow.sol";

/// @title ApplicationRegistry
/// @notice Manages job applications from freelancers
/// @dev Independent contract, can be deployed before JobEscrow
contract ApplicationRegistry is IApplicationRegistry, ReentrancyGuard {
    // ============ Storage ============

    IJobEscrow public immutable jobEscrow;

    uint256 private _nextApplicationId;

    mapping(uint256 => Application) private _applications;
    mapping(uint256 => uint256[]) private _jobApplications;
    mapping(address => uint256[]) private _freelancerApplications;
    mapping(uint256 => mapping(address => bool)) private _hasApplied;

    // ============ Constructor ============

    constructor(address _jobEscrow) {
        jobEscrow = IJobEscrow(_jobEscrow);
    }

    // ============ External Functions ============

    /// @inheritdoc IApplicationRegistry
    function submitApplication(
        uint256 jobId,
        string calldata proposalURI
    ) external nonReentrant returns (uint256 applicationId) {
        // Use gas-efficient validation (avoids loading full Job struct with strings)
        (address client, IJobEscrow.JobStatus status) = jobEscrow.getJobForValidation(jobId);

        if (client == address(0)) revert InvalidJob();
        if (status != IJobEscrow.JobStatus.Open) revert JobNotOpen();
        if (client == msg.sender) revert CannotApplyToOwnJob();
        if (_hasApplied[jobId][msg.sender]) revert AlreadyApplied();

        applicationId = _nextApplicationId++;

        _applications[applicationId] = Application({
            applicationId: applicationId,
            jobId: jobId,
            freelancer: msg.sender,
            status: ApplicationStatus.Pending,
            proposalURI: proposalURI,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });

        _jobApplications[jobId].push(applicationId);
        _freelancerApplications[msg.sender].push(applicationId);
        _hasApplied[jobId][msg.sender] = true;

        emit ApplicationSubmitted(applicationId, jobId, msg.sender, proposalURI, block.timestamp);
    }

    /// @inheritdoc IApplicationRegistry
    function acceptApplication(uint256 applicationId) external nonReentrant {
        Application storage app = _applications[applicationId];
        if (app.freelancer == address(0)) revert ApplicationNotFound();

        // Use gas-efficient validation
        (address client, IJobEscrow.JobStatus status) = jobEscrow.getJobForValidation(app.jobId);
        if (client != msg.sender) revert NotClient();
        if (app.status != ApplicationStatus.Pending) revert InvalidApplicationStatus();
        if (status != IJobEscrow.JobStatus.Open) revert JobNotOpen();

        app.status = ApplicationStatus.Accepted;
        app.updatedAt = block.timestamp;

        // Reject all other pending applications
        uint256[] memory jobApps = _jobApplications[app.jobId];
        for (uint256 i = 0; i < jobApps.length; i++) {
            if (jobApps[i] != applicationId) {
                Application storage otherApp = _applications[jobApps[i]];
                if (otherApp.status == ApplicationStatus.Pending) {
                    otherApp.status = ApplicationStatus.Rejected;
                    otherApp.updatedAt = block.timestamp;
                    emit ApplicationRejected(jobApps[i], app.jobId, otherApp.freelancer, block.timestamp);
                }
            }
        }

        emit ApplicationAccepted(applicationId, app.jobId, app.freelancer, block.timestamp);
    }

    /// @inheritdoc IApplicationRegistry
    function rejectApplication(uint256 applicationId) external nonReentrant {
        Application storage app = _applications[applicationId];
        if (app.freelancer == address(0)) revert ApplicationNotFound();

        // Use gas-efficient validation
        (address client, ) = jobEscrow.getJobForValidation(app.jobId);
        if (client != msg.sender) revert NotClient();
        if (app.status != ApplicationStatus.Pending) revert InvalidApplicationStatus();

        app.status = ApplicationStatus.Rejected;
        app.updatedAt = block.timestamp;

        emit ApplicationRejected(applicationId, app.jobId, app.freelancer, block.timestamp);
    }

    /// @inheritdoc IApplicationRegistry
    function withdrawApplication(uint256 applicationId) external nonReentrant {
        Application storage app = _applications[applicationId];
        if (app.freelancer == address(0)) revert ApplicationNotFound();
        if (app.freelancer != msg.sender) revert NotFreelancer();
        if (app.status != ApplicationStatus.Pending) revert InvalidApplicationStatus();

        app.status = ApplicationStatus.Withdrawn;
        app.updatedAt = block.timestamp;

        emit ApplicationWithdrawn(applicationId, app.jobId, msg.sender, block.timestamp);
    }

    // ============ View Functions ============

    /// @inheritdoc IApplicationRegistry
    function getApplication(uint256 applicationId) external view returns (Application memory) {
        return _applications[applicationId];
    }

    /// @inheritdoc IApplicationRegistry
    function getJobApplications(uint256 jobId) external view returns (uint256[] memory) {
        return _jobApplications[jobId];
    }

    /// @inheritdoc IApplicationRegistry
    function getFreelancerApplications(address freelancer) external view returns (uint256[] memory) {
        return _freelancerApplications[freelancer];
    }

    /// @inheritdoc IApplicationRegistry
    function hasApplied(uint256 jobId, address freelancer) external view returns (bool) {
        return _hasApplied[jobId][freelancer];
    }

    /// @notice Get the next application ID
    function nextApplicationId() external view returns (uint256) {
        return _nextApplicationId;
    }

    /// @notice Get count of applications for a job
    function getJobApplicationCount(uint256 jobId) external view returns (uint256) {
        return _jobApplications[jobId].length;
    }

    /// @notice Get count of applications by a freelancer
    function getFreelancerApplicationCount(address freelancer) external view returns (uint256) {
        return _freelancerApplications[freelancer].length;
    }
}
