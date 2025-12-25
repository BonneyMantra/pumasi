// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ReentrancyGuard} from "@openzeppelin/utils/ReentrancyGuard.sol";
import {IJobEscrow} from "./interfaces/IJobEscrow.sol";

/// @title JobEscrow
/// @notice Manages escrow-based job payments between clients and freelancers
/// @dev Uses native token (ETH/VERY) for escrow payments
contract JobEscrow is IJobEscrow, ReentrancyGuard {
    // ============ Constants ============

    /// @notice Minimum budget (0.0001 ETH for testing)
    uint256 public constant MIN_BUDGET = 0.0001 ether;

    /// @notice Platform fee (3% = 300 basis points)
    uint256 public constant PLATFORM_FEE_BPS = 300;

    /// @notice Basis points denominator
    uint256 public constant BASIS_POINTS = 10000;

    /// @notice Timeout period after delivery (7 days)
    uint256 public constant DELIVERY_TIMEOUT = 7 days;

    /// @notice Timeout period for open jobs (30 days)
    uint256 public constant OPEN_JOB_TIMEOUT = 30 days;

    // ============ Storage ============

    /// @notice Next job ID
    uint256 private _nextJobId;

    /// @notice Mapping of job ID to job data
    mapping(uint256 => Job) private _jobs;

    /// @notice Mapping of client to their job IDs
    mapping(address => uint256[]) private _clientJobs;

    /// @notice Mapping of freelancer to their job IDs
    mapping(address => uint256[]) private _freelancerJobs;

    /// @notice Treasury address for platform fees
    address public treasury;

    /// @notice Accumulated platform fees
    uint256 public accumulatedFees;

    // ============ Constructor ============

    /// @notice Initialize the contract
    /// @param _treasury The treasury address for platform fees
    constructor(address _treasury) {
        treasury = _treasury;
    }

    // ============ External Functions ============

    /// @inheritdoc IJobEscrow
    function createJob(
        uint256 deadline,
        string calldata metadataURI
    ) external payable nonReentrant returns (uint256 jobId) {
        if (msg.value < MIN_BUDGET) revert BudgetTooLow();
        if (deadline <= block.timestamp) revert InvalidDeadline();

        jobId = _nextJobId++;

        _jobs[jobId] = Job({
            jobId: jobId,
            client: msg.sender,
            freelancer: address(0),
            budget: msg.value,
            deadline: deadline,
            status: JobStatus.Open,
            metadataURI: metadataURI,
            createdAt: block.timestamp,
            deliveredAt: 0,
            deliverableURI: ""
        });

        _clientJobs[msg.sender].push(jobId);

        emit JobCreated(jobId, msg.sender, msg.value, deadline, metadataURI);
    }

    /// @inheritdoc IJobEscrow
    function assignFreelancer(uint256 jobId, address freelancer) external nonReentrant {
        Job storage job = _jobs[jobId];

        if (job.client == address(0)) revert JobNotFound();
        if (job.client != msg.sender) revert NotClient();
        if (job.status != JobStatus.Open) revert InvalidJobStatus();
        if (freelancer == msg.sender) revert CannotApplyToOwnJob();
        if (job.freelancer != address(0)) revert FreelancerAlreadyAssigned();

        job.freelancer = freelancer;
        job.status = JobStatus.InProgress;
        _freelancerJobs[freelancer].push(jobId);

        emit FreelancerAssigned(jobId, freelancer, block.timestamp);
    }

    /// @inheritdoc IJobEscrow
    function submitDeliverable(
        uint256 jobId,
        string calldata deliverableURI
    ) external nonReentrant {
        Job storage job = _jobs[jobId];

        if (job.client == address(0)) revert JobNotFound();
        if (job.freelancer != msg.sender) revert NotFreelancer();
        if (job.status != JobStatus.InProgress) revert InvalidJobStatus();

        job.status = JobStatus.Delivered;
        job.deliveredAt = block.timestamp;
        job.deliverableURI = deliverableURI;

        emit DeliverableSubmitted(jobId, msg.sender, deliverableURI, block.timestamp);
    }

    /// @inheritdoc IJobEscrow
    function approveDelivery(uint256 jobId) external nonReentrant {
        Job storage job = _jobs[jobId];

        if (job.client == address(0)) revert JobNotFound();
        if (job.client != msg.sender) revert NotClient();
        if (job.status != JobStatus.Delivered) revert InvalidJobStatus();

        job.status = JobStatus.Completed;
        _releaseFunds(jobId, job.freelancer, job.budget);

        emit JobApproved(jobId, msg.sender, job.freelancer, block.timestamp);
    }

    /// @inheritdoc IJobEscrow
    function requestRevision(uint256 jobId, string calldata reason) external nonReentrant {
        Job storage job = _jobs[jobId];

        if (job.client == address(0)) revert JobNotFound();
        if (job.client != msg.sender) revert NotClient();
        if (job.status != JobStatus.Delivered) revert InvalidJobStatus();

        job.status = JobStatus.InProgress;
        job.deliveredAt = 0;

        emit RevisionRequested(jobId, msg.sender, reason, block.timestamp);
    }

    /// @inheritdoc IJobEscrow
    function raiseDispute(uint256 jobId) external nonReentrant {
        Job storage job = _jobs[jobId];

        if (job.client == address(0)) revert JobNotFound();
        if (msg.sender != job.client && msg.sender != job.freelancer) {
            revert InvalidJobStatus();
        }
        if (job.status != JobStatus.InProgress && job.status != JobStatus.Delivered) {
            revert InvalidJobStatus();
        }

        job.status = JobStatus.Disputed;

        emit JobDisputed(jobId, msg.sender, block.timestamp);
    }

    /// @inheritdoc IJobEscrow
    function cancelJob(uint256 jobId) external nonReentrant {
        Job storage job = _jobs[jobId];

        if (job.client == address(0)) revert JobNotFound();
        if (job.client != msg.sender) revert NotClient();
        if (job.status != JobStatus.Open) revert InvalidJobStatus();

        job.status = JobStatus.Cancelled;

        // Refund client
        (bool success,) = msg.sender.call{value: job.budget}("");
        if (!success) revert TransferFailed();

        emit JobCancelled(jobId, msg.sender, block.timestamp);
    }

    /// @inheritdoc IJobEscrow
    function handleTimeout(uint256 jobId) external nonReentrant {
        Job storage job = _jobs[jobId];

        if (job.client == address(0)) revert JobNotFound();

        if (job.status == JobStatus.Open) {
            // Open job timeout - refund client
            if (block.timestamp < job.createdAt + OPEN_JOB_TIMEOUT) revert InvalidJobStatus();
            job.status = JobStatus.Cancelled;
            (bool success,) = job.client.call{value: job.budget}("");
            if (!success) revert TransferFailed();
            emit JobCancelled(jobId, address(this), block.timestamp);
        } else if (job.status == JobStatus.Delivered) {
            // Delivery timeout - auto-approve
            if (block.timestamp < job.deliveredAt + DELIVERY_TIMEOUT) revert InvalidJobStatus();
            job.status = JobStatus.Completed;
            _releaseFunds(jobId, job.freelancer, job.budget);
            emit JobApproved(jobId, address(this), job.freelancer, block.timestamp);
        } else {
            revert InvalidJobStatus();
        }
    }

    // ============ View Functions ============

    /// @inheritdoc IJobEscrow
    function getJob(uint256 jobId) external view returns (Job memory) {
        return _jobs[jobId];
    }

    /// @inheritdoc IJobEscrow
    function getJobForValidation(uint256 jobId) external view returns (address client, JobStatus status) {
        Job storage job = _jobs[jobId];
        return (job.client, job.status);
    }

    /// @inheritdoc IJobEscrow
    function getClientJobs(address client) external view returns (uint256[] memory) {
        return _clientJobs[client];
    }

    /// @inheritdoc IJobEscrow
    function getFreelancerJobs(address freelancer) external view returns (uint256[] memory) {
        return _freelancerJobs[freelancer];
    }

    /// @inheritdoc IJobEscrow
    function minBudget() external pure returns (uint256) {
        return MIN_BUDGET;
    }

    /// @inheritdoc IJobEscrow
    function platformFeeBps() external pure returns (uint256) {
        return PLATFORM_FEE_BPS;
    }

    /// @notice Get the next job ID
    /// @return Next job ID
    function nextJobId() external view returns (uint256) {
        return _nextJobId;
    }

    // ============ Internal Functions ============

    /// @notice Release funds to recipient with platform fee deduction
    /// @param jobId The job ID
    /// @param recipient The recipient address
    /// @param amount The total amount to distribute
    function _releaseFunds(uint256 jobId, address recipient, uint256 amount) internal {
        uint256 fee = (amount * PLATFORM_FEE_BPS) / BASIS_POINTS;
        uint256 payout = amount - fee;

        accumulatedFees += fee;

        (bool success,) = recipient.call{value: payout}("");
        if (!success) revert TransferFailed();

        emit FundsReleased(jobId, recipient, payout, fee);
    }

    // ============ Admin Functions ============

    /// @notice Withdraw accumulated fees to treasury
    function withdrawFees() external {
        uint256 fees = accumulatedFees;
        accumulatedFees = 0;

        (bool success,) = treasury.call{value: fees}("");
        if (!success) revert TransferFailed();
    }

    /// @notice Update treasury address
    /// @param newTreasury The new treasury address
    function setTreasury(address newTreasury) external {
        // Note: In production, add access control
        treasury = newTreasury;
    }
}
